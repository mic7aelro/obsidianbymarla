import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { InquiryEvent } from '@/types/inquiry'

async function requireAuth() {
  const session = await getSession()
  return session.isLoggedIn
}

// GET /api/admin/events — list all events
export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')
  const events = await db
    .collection('events')
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json(
    events.map((e) => ({ ...e, _id: e._id.toString() }))
  )
}

// POST /api/admin/events — create event from inquiry
export async function POST(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { inquiryId, clientName, clientEmail, service, date } = await req.json()
  if (!inquiryId || !clientName || !clientEmail || !service) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')

  const now = new Date()
  const event: Omit<InquiryEvent, '_id'> = {
    inquiryId,
    clientName,
    clientEmail,
    service,
    date: date ? new Date(date) : undefined,
    depositPaid: false,
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection('events').insertOne(event)

  // Move inquiry to awaiting_deposit
  await db.collection('inquiries').updateOne(
    { _id: new ObjectId(inquiryId) },
    { $set: { status: 'awaiting_deposit', updatedAt: now } }
  )

  return NextResponse.json({ ok: true, id: result.insertedId.toString() })
}

// PATCH /api/admin/events — update event (mark deposit paid, etc.)
export async function PATCH(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, depositPaid } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const now = new Date()
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')

  await db.collection('events').updateOne(
    { _id: new ObjectId(id) },
    { $set: { depositPaid, updatedAt: now } }
  )

  // If deposit paid, update the inquiry to confirmed
  if (depositPaid) {
    const event = await db.collection('events').findOne({ _id: new ObjectId(id) })
    if (event?.inquiryId) {
      await db.collection('inquiries').updateOne(
        { _id: new ObjectId(event.inquiryId) },
        { $set: { status: 'confirmed', updatedAt: now } }
      )
    }
  }

  return NextResponse.json({ ok: true })
}
