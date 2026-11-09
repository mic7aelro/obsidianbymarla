import { del } from '@vercel/blob'
import { ObjectId, type Collection } from 'mongodb'
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/session'
import type { PlanBoardResponse, PlanDraft } from '@/types/plan'

export const dynamic = 'force-dynamic'

const BOARD_KEY = 'marla-feed'
const MAX_CAPTION_LENGTH = 2_200
const MAX_DRAFTS = 60

interface PlanPostDocument {
  _id?: ObjectId
  placeholder?: boolean
  mediaUrl: string
  width: number
  height: number
  fileName: string
  caption: string
  createdAt: Date
  updatedAt: Date
}

interface PlanBoardDocument {
  key: string
  draftIds: ObjectId[]
  gridOffset: number
  updatedAt: Date
}

async function requireAuth() {
  const session = await getSession()
  return Boolean(session.isLoggedIn)
}

async function collections(): Promise<{
  posts: Collection<PlanPostDocument>
  boards: Collection<PlanBoardDocument>
}> {
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? process.env.MONGO_DB ?? 'marla')
  return {
    posts: db.collection<PlanPostDocument>('plan_posts'),
    boards: db.collection<PlanBoardDocument>('plan_boards'),
  }
}

function serializePost(post: PlanPostDocument & { _id: ObjectId }): PlanDraft {
  return {
    id: post._id.toHexString(),
    placeholder: Boolean(post.placeholder),
    mediaUrl: post.mediaUrl,
    width: post.width,
    height: post.height,
    fileName: post.fileName,
    caption: post.caption,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}

function validBlobUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { posts, boards } = await collections()
  const board = await boards.findOne({ key: BOARD_KEY })
  const ids = board?.draftIds ?? []
  const documents = ids.length > 0
    ? await posts.find({ _id: { $in: ids } }).toArray()
    : []
  const byId = new Map(documents.map(post => [post._id!.toHexString(), post]))
  const drafts = ids
    .map(id => byId.get(id.toHexString()))
    .filter((post): post is PlanPostDocument & { _id: ObjectId } => Boolean(post?._id))
    .map(serializePost)

  const response: PlanBoardResponse = {
    drafts,
    gridOffset: Math.min(2, Math.max(0, board?.gridOffset ?? 0)),
  }
  return NextResponse.json(response)
}

export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const now = new Date()
  const documents: PlanPostDocument[] = []
  const items = Array.isArray(body.items) ? body.items : []

  if (body.placeholder === true) {
    documents.push({
      placeholder: true,
      mediaUrl: '',
      width: 1080,
      height: 1350,
      fileName: 'Blank space',
      caption: '',
      createdAt: now,
      updatedAt: now,
    })
  } else if (items.length < 1 || items.length > 12) {
    return NextResponse.json({ error: 'Add between 1 and 12 images.' }, { status: 400 })
  }

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      return NextResponse.json({ error: 'Invalid image data.' }, { status: 400 })
    }
    const candidate = item as Record<string, unknown>
    const width = Number(candidate.width)
    const height = Number(candidate.height)
    const fileName = typeof candidate.fileName === 'string' ? candidate.fileName.trim().slice(0, 180) : ''
    if (
      !validBlobUrl(candidate.mediaUrl) ||
      !Number.isFinite(width) || width < 1 || width > 20_000 ||
      !Number.isFinite(height) || height < 1 || height > 20_000 ||
      !fileName
    ) {
      return NextResponse.json({ error: 'Invalid image data.' }, { status: 400 })
    }
    documents.push({
      mediaUrl: candidate.mediaUrl,
      width,
      height,
      fileName,
      caption: '',
      createdAt: now,
      updatedAt: now,
    })
  }

  const { posts, boards } = await collections()
  const board = await boards.findOne({ key: BOARD_KEY })
  if ((board?.draftIds.length ?? 0) + documents.length > MAX_DRAFTS) {
    return NextResponse.json({ error: `The planner can hold up to ${MAX_DRAFTS} drafts.` }, { status: 400 })
  }

  const inserted = await posts.insertMany(documents)
  const insertedIds = Object.values(inserted.insertedIds)
  await boards.updateOne(
    { key: BOARD_KEY },
    {
      $push: { draftIds: { $each: insertedIds, $position: 0 } },
      $set: { updatedAt: now },
      $setOnInsert: { gridOffset: 0 },
    },
    { upsert: true },
  )

  const saved = await posts.find({ _id: { $in: insertedIds } }).toArray()
  const savedById = new Map(saved.map(post => [post._id!.toHexString(), post]))
  const drafts = insertedIds
    .map(id => savedById.get(id.toHexString()))
    .filter((post): post is PlanPostDocument & { _id: ObjectId } => Boolean(post?._id))
    .map(serializePost)

  return NextResponse.json({ drafts }, { status: 201 })
}

export async function PATCH(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { posts, boards } = await collections()
  const action = body.action

  if (action === 'reorder') {
    const rawIds = Array.isArray(body.ids) ? body.ids : []
    if (!rawIds.every(id => typeof id === 'string' && ObjectId.isValid(id))) {
      return NextResponse.json({ error: 'Invalid draft order.' }, { status: 400 })
    }
    const board = await boards.findOne({ key: BOARD_KEY })
    const currentIds = board?.draftIds.map(id => id.toHexString()) ?? []
    const requestedIds = rawIds as string[]
    if (
      currentIds.length !== requestedIds.length ||
      currentIds.some(id => !requestedIds.includes(id))
    ) {
      return NextResponse.json({ error: 'The draft list changed. Refresh and try again.' }, { status: 409 })
    }
    await boards.updateOne(
      { key: BOARD_KEY },
      { $set: { draftIds: requestedIds.map(id => new ObjectId(id)), updatedAt: new Date() } },
    )
    return NextResponse.json({ ok: true })
  }

  if (action === 'offset') {
    const offset = Number(body.gridOffset)
    if (!Number.isInteger(offset) || offset < 0 || offset > 2) {
      return NextResponse.json({ error: 'Invalid grid offset.' }, { status: 400 })
    }
    await boards.updateOne(
      { key: BOARD_KEY },
      {
        $set: { gridOffset: offset, updatedAt: new Date() },
        $setOnInsert: { draftIds: [] },
      },
      { upsert: true },
    )
    return NextResponse.json({ ok: true })
  }

  if (action === 'caption') {
    const id = typeof body.id === 'string' ? body.id : ''
    const caption = typeof body.caption === 'string' ? body.caption.trim() : ''
    if (!ObjectId.isValid(id) || caption.length > MAX_CAPTION_LENGTH) {
      return NextResponse.json({ error: 'Invalid caption.' }, { status: 400 })
    }
    const result = await posts.updateOne(
      { _id: new ObjectId(id) },
      { $set: { caption, updatedAt: new Date() } },
    )
    if (!result.matchedCount) {
      return NextResponse.json({ error: 'Draft not found.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  }

  // Puts a photo into a blank space, or swaps the photo on an existing post
  if (action === 'media') {
    const id = typeof body.id === 'string' ? body.id : ''
    const width = Number(body.width)
    const height = Number(body.height)
    const fileName = typeof body.fileName === 'string' ? body.fileName.trim().slice(0, 180) : ''
    if (
      !ObjectId.isValid(id) ||
      !validBlobUrl(body.mediaUrl) ||
      !Number.isFinite(width) || width < 1 || width > 20_000 ||
      !Number.isFinite(height) || height < 1 || height > 20_000 ||
      !fileName
    ) {
      return NextResponse.json({ error: 'Invalid image data.' }, { status: 400 })
    }

    const objectId = new ObjectId(id)
    const existing = await posts.findOne({ _id: objectId })
    if (!existing) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 })

    const updatedAt = new Date()
    await posts.updateOne(
      { _id: objectId },
      { $set: { placeholder: false, mediaUrl: body.mediaUrl, width, height, fileName, updatedAt } },
    )

    if (validBlobUrl(existing.mediaUrl) && existing.mediaUrl !== body.mediaUrl) {
      try {
        await del(existing.mediaUrl)
      } catch (error) {
        // The new photo is saved; a leftover old file is harmless
        console.error('[plan] Could not delete replaced media:', error)
      }
    }

    return NextResponse.json({
      draft: serializePost({ ...existing, placeholder: false, mediaUrl: body.mediaUrl, width, height, fileName, updatedAt, _id: objectId }),
    })
  }

  return NextResponse.json({ error: 'Unknown planner action.' }, { status: 400 })
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid draft.' }, { status: 400 })
  }

  const objectId = new ObjectId(id)
  const { posts, boards } = await collections()
  const post = await posts.findOne({ _id: objectId })
  if (!post) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 })

  if (validBlobUrl(post.mediaUrl)) {
    try {
      await del(post.mediaUrl)
    } catch (error) {
      console.error('[plan] Could not delete draft media:', error)
      return NextResponse.json({ error: 'The draft image could not be removed.' }, { status: 502 })
    }
  }

  await Promise.all([
    posts.deleteOne({ _id: objectId }),
    boards.updateOne(
      { key: BOARD_KEY },
      { $pull: { draftIds: objectId }, $set: { updatedAt: new Date() } },
    ),
  ])

  return NextResponse.json({ ok: true })
}
