import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'

async function requireAuth() {
  const session = await getIronSession<{ isLoggedIn?: boolean }>(
    await cookies(),
    { password: process.env.SESSION_SECRET!, cookieName: 'marla_admin_session' }
  )
  return !!session.isLoggedIn
}

async function getCol() {
  const client = await clientPromise
  return client.db('marla').collection<{ src: string }>('hidden_images')
}

export async function GET() {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const col = await getCol()
  const docs = await col.find({}).toArray()
  return NextResponse.json(docs.map(d => d.src))
}

export async function POST(req: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { src, hidden } = await req.json()
  if (!src) return NextResponse.json({ error: 'Missing src' }, { status: 400 })
  const col = await getCol()
  if (hidden) {
    await col.updateOne({ src }, { $set: { src } }, { upsert: true })
  } else {
    await col.deleteOne({ src })
  }
  return NextResponse.json({ ok: true })
}
