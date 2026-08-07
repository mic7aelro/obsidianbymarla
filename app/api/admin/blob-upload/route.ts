import { issueSignedToken } from '@vercel/blob'
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client'
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

export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as HandleUploadPresignedBody
    const response = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async pathname => {
        if (!pathname.startsWith('images/projects/') && !pathname.startsWith('images/plan/')) {
          throw new Error('Invalid upload path')
        }

        const allowedContentTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
        const maximumSizeInBytes = 30 * 1024 * 1024
        const validUntil = Date.now() + 15 * 60 * 1000

        return {
          token: await issueSignedToken({
            pathname,
            operations: ['put'],
            allowedContentTypes,
            maximumSizeInBytes,
            validUntil,
          }),
          urlOptions: {
            allowedContentTypes,
            maximumSizeInBytes,
            validUntil,
            addRandomSuffix: true,
            allowOverwrite: false,
            cacheControlMaxAge: 60 * 60 * 24 * 365,
          },
        }
      },
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error('Blob upload token error:', error)
    return NextResponse.json({ error: 'Could not authorize the image upload' }, { status: 400 })
  }
}
