import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import type { InstagramFeedResponse, InstagramMedia } from '@/types/plan'

export const dynamic = 'force-dynamic'

interface GraphMedia {
  id?: string
  caption?: string
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
}

interface GraphResponse {
  data?: GraphMedia[]
  username?: string
  error?: { message?: string; code?: number }
}

// Graph error 190 means the token was revoked or expired (e.g. after a password change)
const TOKEN_EXPIRED_MESSAGE =
  'Instagram sign-in expired. Generate a new access token and update INSTAGRAM_ACCESS_TOKEN.'

function graphUrl(path: string) {
  const base = (process.env.INSTAGRAM_GRAPH_BASE_URL ?? 'https://graph.instagram.com').replace(/\/$/, '')
  const version = (process.env.INSTAGRAM_API_VERSION ?? 'v25.0').replace(/^\/?/, '').replace(/\/$/, '')
  return new URL(`${base}/${version}/${path.replace(/^\//, '')}`)
}

async function graphFetch(url: URL, token: string, fresh: boolean) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: 300 } }),
  })
}

export async function GET(request: Request) {
  const fresh = new URL(request.url).searchParams.has('fresh')
  const session = await getSession()
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!token) {
    const response: InstagramFeedResponse = {
      connected: false,
      username: process.env.INSTAGRAM_USERNAME ?? null,
      items: [],
      message: 'Add an Instagram access token to load Marla’s published feed.',
    }
    return NextResponse.json(response)
  }

  const userId = process.env.INSTAGRAM_USER_ID ?? 'me'
  const mediaUrl = graphUrl(`${userId}/media`)
  mediaUrl.searchParams.set(
    'fields',
    'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
  )
  mediaUrl.searchParams.set('limit', '60')

  const profileUrl = graphUrl(userId)
  profileUrl.searchParams.set('fields', 'username')

  try {
    const [mediaResponse, profileResponse] = await Promise.all([
      graphFetch(mediaUrl, token, fresh),
      graphFetch(profileUrl, token, fresh),
    ])
    const mediaJson = await mediaResponse.json() as GraphResponse
    const profileJson = await profileResponse.json() as GraphResponse

    if (!mediaResponse.ok) {
      if (mediaJson.error?.code === 190) {
        const response: InstagramFeedResponse = {
          connected: false,
          username: process.env.INSTAGRAM_USERNAME ?? null,
          items: [],
          message: TOKEN_EXPIRED_MESSAGE,
        }
        return NextResponse.json(response)
      }
      const message = mediaJson.error?.message ?? 'Instagram did not return the feed.'
      return NextResponse.json({ error: message }, { status: 502 })
    }

    const items: InstagramMedia[] = (mediaJson.data ?? [])
      .filter((item): item is Required<Pick<GraphMedia, 'id' | 'media_type' | 'media_url' | 'permalink' | 'timestamp'>> & GraphMedia =>
        Boolean(item.id && item.media_type && item.media_url && item.permalink && item.timestamp),
      )
      .map(item => ({
        id: item.id,
        caption: item.caption ?? '',
        mediaType: item.media_type,
        mediaUrl: item.media_url,
        thumbnailUrl: item.thumbnail_url ?? null,
        permalink: item.permalink,
        timestamp: item.timestamp,
      }))

    const response: InstagramFeedResponse = {
      connected: true,
      username: profileResponse.ok
        ? profileJson.username ?? process.env.INSTAGRAM_USERNAME ?? null
        : process.env.INSTAGRAM_USERNAME ?? null,
      items,
    }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[plan] Instagram feed request failed:', error)
    return NextResponse.json({ error: 'Instagram could not be reached just now.' }, { status: 502 })
  }
}
