import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

async function requireAuth() {
  const session = await getSession()
  if (!session.isLoggedIn) return false
  return true
}

// GET /api/admin/inquiries — list all
export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')
  const inquiries = await db
    .collection('inquiries')
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json(
    inquiries.map((i) => ({ ...i, _id: i._id.toString() }))
  )
}

// PATCH /api/admin/inquiries — update status
export async function PATCH(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status } = await req.json()
  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? 'marla')
  await db.collection('inquiries').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } }
  )

  return NextResponse.json({ ok: true })
}
