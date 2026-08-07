import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import clientPromise from '@/lib/mongodb'

async function requireAuth() {
  const session = await getIronSession<{ isLoggedIn?: boolean }>(
    await cookies(),
    { password: process.env.SESSION_SECRET!, cookieName: 'marla_admin_session' }
  )
  return !!session.isLoggedIn
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function getCollectionsCol() {
  const client = await clientPromise
  return client.db('marla').collection('collections')
}

async function getDisabledCol() {
  const client = await clientPromise
  return client.db('marla').collection<{ slug: string }>('disabled_collections')
}

export async function GET() {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const col = await getCollectionsCol()
  const docs = await col.find({}).toArray()
  return NextResponse.json(docs)
}

export async function PATCH(req: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug, disabled, order } = await req.json()

  if (order !== undefined) {
    if (!Array.isArray(order) || order.some(item => typeof item !== 'string') || new Set(order).size !== order.length) {
      return NextResponse.json({ error: 'Invalid gallery order' }, { status: 400 })
    }
    const client = await clientPromise
    await client.db('marla').collection('collection_order').updateOne(
      { key: 'gallery-order' },
      { $set: { key: 'gallery-order', slugs: order, updatedAt: new Date() } },
      { upsert: true }
    )
    revalidatePath('/work')
    revalidatePath('/admin/curate')
    return NextResponse.json({ ok: true })
  }

  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  const col = await getDisabledCol()
  if (disabled) {
    await col.updateOne({ slug }, { $set: { slug } }, { upsert: true })
  } else {
    await col.deleteOne({ slug })
  }
  revalidatePath('/work')
  revalidatePath('/admin/curate')
  return NextResponse.json({ ok: true })
}

export async function POST(req: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const year = Number.parseInt(String(body.year), 10) || new Date().getFullYear()
  const images = Array.isArray(body.images) ? body.images.filter((image: unknown): image is { src: string; width: number; height: number } => {
    if (!image || typeof image !== 'object') return false
    const candidate = image as Record<string, unknown>
    return typeof candidate.src === 'string' && Number.isFinite(candidate.width) && Number.isFinite(candidate.height)
  }) : []
  const coverImage = typeof body.coverImage === 'string' ? body.coverImage : ''

  if (!title || !category || images.length === 0 || !images.some((image: { src: string }) => image.src === coverImage)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const slug = slugify(title)

  const collection = {
    slug,
    title,
    year,
    category,
    image: coverImage,
    coverAlt: `${title} by Marla McLeod`,
    images,
    createdAt: new Date(),
  }

  const col = await getCollectionsCol()
  await col.updateOne({ slug }, { $set: collection }, { upsert: true })
  const client = await clientPromise
  await client.db('marla').collection('collection_curation').updateOne(
    { slug },
    { $set: { slug, imageOrder: images.map((image: { src: string }) => image.src), coverImage, updatedAt: new Date() } },
    { upsert: true }
  )
  revalidatePath('/work')
  revalidatePath(`/work/${slug}`)
  revalidatePath('/admin/curate')
  return NextResponse.json({ ok: true, slug })
}
