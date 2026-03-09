import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import clientPromise from '@/lib/mongodb'
import {
  inquiryNotificationHtml,
  inquiryNotificationText,
} from '@/lib/emails/inquiryNotification'
import {
  inquiryConfirmationHtml,
  inquiryConfirmationText,
} from '@/lib/emails/inquiryConfirmation'
import type { Inquiry } from '@/types/inquiry'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, location, service, message } = body

  if (!name || !email || !service || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const now = new Date()
  const inquiry: Omit<Inquiry, '_id'> = {
    name,
    email,
    phone: phone || undefined,
    location: location || undefined,
    service,
    message,
    status: 'pending',
    archived: false,
    createdAt: now,
    updatedAt: now,
  }

  try {
    // Save to MongoDB
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB ?? 'marla')
    await db.collection('inquiries').insertOne(inquiry)

    // Send notification to Marla
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.MARLA_EMAIL!,
      subject: `New inquiry — ${name} (${service})`,
      html: inquiryNotificationHtml({ name, email, phone, service, message }),
      text: inquiryNotificationText({ name, email, phone, service, message }),
    })

    // Send confirmation to client
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Your inquiry has been received',
      html: inquiryConfirmationHtml({ name, service }),
      text: inquiryConfirmationText({ name, service }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
