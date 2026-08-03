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

export async function PATCH(req: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug, imageOrder, coverImage } = await req.json()
  if (typeof slug !== 'string' || !slug.trim()) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }
  if (imageOrder !== undefined && (!Array.isArray(imageOrder) || imageOrder.some(src => typeof src !== 'string'))) {
    return NextResponse.json({ error: 'Invalid image order' }, { status: 400 })
  }
  if (coverImage !== undefined && typeof coverImage !== 'string') {
    return NextResponse.json({ error: 'Invalid thumbnail' }, { status: 400 })
  }

  const updates: { imageOrder?: string[]; coverImage?: string; updatedAt: Date } = { updatedAt: new Date() }
  if (imageOrder !== undefined) updates.imageOrder = imageOrder
  if (coverImage !== undefined) updates.coverImage = coverImage

  const client = await clientPromise
  await client.db('marla').collection('collection_curation').updateOne(
    { slug },
    { $set: { slug, ...updates } },
    { upsert: true }
  )
  return NextResponse.json({ ok: true })
}
