import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

async function requireAuth() {
  const session = await getSession()
  if (!session.isLoggedIn) return false
  return true
}

// GET /api/admin/inquiries — list inquiries, optionally archived
export async function GET(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const archived = searchParams.get('archived') === 'true'

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')
  const inquiries = await db
    .collection('inquiries')
    .find({ archived: archived ? true : { $ne: true } })
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json(
    inquiries.map((i) => ({ ...i, _id: i._id.toString() }))
  )
}

// DELETE /api/admin/inquiries — delete by id
export async function DELETE(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')
  await db.collection('inquiries').deleteOne({ _id: new ObjectId(id) })

  return NextResponse.json({ ok: true })
}

// PATCH /api/admin/inquiries — update status or archive
export async function PATCH(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status, archived } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (status !== undefined) updates.status = status
  if (archived !== undefined) updates.archived = archived

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')
  await db.collection('inquiries').updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  )

  return NextResponse.json({ ok: true })
}
