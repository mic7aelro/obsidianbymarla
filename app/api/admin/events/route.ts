import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { InquiryEvent } from '@/types/inquiry'

async function requireAuth() {
  const session = await getSession()
  return session.isLoggedIn
}

// GET /api/admin/events — list events, optionally archived
export async function GET(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const archived = searchParams.get('archived') === 'true'
  const inquiryId = searchParams.get('inquiryId')

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')

  const query: Record<string, unknown> = {}
  if (inquiryId) {
    query.inquiryId = inquiryId
  } else {
    query.archived = archived ? true : { $ne: true }
  }

  const events = await db
    .collection('events')
    .find(query)
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
    status: 'awaiting_deposit',
    archived: false,
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection('events').insertOne(event)

  return NextResponse.json({ ok: true, id: result.insertedId.toString() })
}

// PATCH /api/admin/events — update event (status, deposit, archive)
export async function PATCH(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, depositPaid, status, archived, notes } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const now = new Date()
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')

  const updates: Record<string, unknown> = { updatedAt: now }
  if (depositPaid !== undefined) updates.depositPaid = depositPaid
  if (status !== undefined) updates.status = status
  if (archived !== undefined) updates.archived = archived
  if (notes !== undefined) updates.notes = notes

  // If marking deposit paid, auto-confirm
  if (depositPaid === true) updates.status = 'confirmed'

  await db.collection('events').updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  )

  return NextResponse.json({ ok: true })
}
