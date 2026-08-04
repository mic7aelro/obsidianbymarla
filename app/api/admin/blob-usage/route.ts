import { list } from '@vercel/blob'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function requireAuth() {
  const session = await getIronSession<{ isLoggedIn?: boolean }>(
    await cookies(),
    { password: process.env.SESSION_SECRET!, cookieName: 'marla_admin_session' }
  )
  return Boolean(session.isLoggedIn)
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let cursor: string | undefined
    let usedBytes = 0
    let blobCount = 0

    do {
      const page = await list({ cursor, limit: 1000 })
      for (const blob of page.blobs) {
        usedBytes += blob.size
        blobCount += 1
      }
      cursor = page.hasMore ? page.cursor : undefined
    } while (cursor)

    const configuredLimit = Number.parseFloat(process.env.BLOB_STORAGE_LIMIT_GB ?? '1')
    const limitGb = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 1

    return NextResponse.json({
      usedBytes,
      limitBytes: limitGb * 1_000_000_000,
      blobCount,
      measuredAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Blob usage error:', error)
    return NextResponse.json({ error: 'Could not measure Blob storage' }, { status: 500 })
  }
}
