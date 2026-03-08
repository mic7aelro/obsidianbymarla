import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { Resend } from 'resend'
import { invoiceHtml, invoiceText } from '@/lib/emails/invoice'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const session = await getSession()
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventId } = await req.json()
  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')
  const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: event.clientEmail,
    subject: `Invoice — ${event.service} with Marla McLeod`,
    html: invoiceHtml({
      clientName: event.clientName,
      clientEmail: event.clientEmail,
      service: event.service,
      date: dateStr,
    }),
    text: invoiceText({
      clientName: event.clientName,
      clientEmail: event.clientEmail,
      service: event.service,
      date: dateStr,
    }),
  })

  await db.collection('events').updateOne(
    { _id: new ObjectId(eventId) },
    { $set: { invoiceSentAt: new Date(), updatedAt: new Date() } }
  )

  return NextResponse.json({ ok: true })
}
