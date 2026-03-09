import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
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
  const { slug, disabled } = await req.json()
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  const col = await getDisabledCol()
  if (disabled) {
    await col.updateOne({ slug }, { $set: { slug } }, { upsert: true })
  } else {
    await col.deleteOne({ slug })
  }
  return NextResponse.json({ ok: true })
}

export async function POST(req: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const year = parseInt(formData.get('year') as string) || new Date().getFullYear()
  const files = formData.getAll('images') as File[]

  if (!title || !category || files.length === 0) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const slug = slugify(title)
  const dir = path.join(process.cwd(), 'public', 'images', 'projects', slug)
  await fs.mkdir(dir, { recursive: true })

  const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  const images: { src: string; width: number; height: number }[] = []

  for (let i = 0; i < sorted.length; i++) {
    const file = sorted[i]
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${i + 1}.${ext}`
    const buf = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(path.join(dir, filename), buf)
    images.push({ src: `/images/projects/${slug}/${filename}`, width: 0, height: 0 })
  }

  if (images.length > 0) {
    const firstExt = images[0].src.split('.').pop()
    const firstPath = path.join(dir, `1.${firstExt}`)
    await fs.copyFile(firstPath, path.join(dir, 'cover.jpg')).catch(() => {})
  }

  const collection = {
    slug,
    title,
    year,
    category,
    image: `/images/projects/${slug}/cover.jpg`,
    coverAlt: `${title} by Marla McLeod`,
    images,
    createdAt: new Date(),
  }

  const col = await getCollectionsCol()
  await col.updateOne({ slug }, { $set: collection }, { upsert: true })
  return NextResponse.json({ ok: true, slug })
}
