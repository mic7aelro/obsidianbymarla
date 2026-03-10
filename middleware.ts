import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import type { SessionData } from '@/lib/session'

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'marla_admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = req.headers.get('host') ?? ''
  const isAdminSubdomain = host.startsWith('admin.')

  // Rewrite admin.obsidianbymarla.com/* → /admin/*
  if (isAdminSubdomain) {
    // Pass API routes through unchanged
    if (pathname.startsWith('/api/')) return NextResponse.next()

    // Strip leading /admin if already present to avoid double-prefixing
    const stripped = pathname.replace(/^\/admin/, '') || '/'
    const adminPath = stripped === '/' ? '/admin/home' : `/admin${stripped}`
    const url = req.nextUrl.clone()
    url.pathname = adminPath

    // Auth check (skip login page)
    if (adminPath !== '/admin/login') {
      const res = NextResponse.rewrite(url)
      const session = await getIronSession<SessionData>(req, res, sessionOptions)
      if (!session.isLoggedIn) {
        const loginUrl = req.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
      }
      return res
    }

    return NextResponse.rewrite(url)
  }

  // Protect /admin/* on main domain
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const res = NextResponse.next()
    const session = await getIronSession<SessionData>(req, res, sessionOptions)
    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|images|fonts).*)'],
}
