import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import type { SessionData } from '@/lib/session'
import { REMEMBER_ME_TTL_SECONDS, SESSION_REFRESH_AFTER_MS } from '@/lib/session-constants'

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'marla_admin_session',
  ttl: REMEMBER_ME_TTL_SECONDS,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
}

// Returns whether the request is signed in, and extends remembered sessions
// by writing a fresh cookie onto `res` (so callers must return that response)
async function isAuthorized(req: NextRequest, res: NextResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  if (!session.isLoggedIn) return false
  if (session.remember && Date.now() - (session.refreshedAt ?? 0) > SESSION_REFRESH_AFTER_MS) {
    session.refreshedAt = Date.now()
    await session.save()
  }
  return true
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = req.headers.get('host') ?? ''
  const isAdminSubdomain = host.startsWith('admin.')

  // Rewrite admin.obsidianbymarla.com/* → /admin/*
  if (isAdminSubdomain) {
    // Pass API routes through unchanged
    if (pathname.startsWith('/api/')) return NextResponse.next()

    // Keep the planner at /plan on both the main site and admin subdomain.
    if (pathname === '/plan' || pathname.startsWith('/plan/')) {
      const res = NextResponse.next()
      if (!(await isAuthorized(req, res))) {
        const loginUrl = req.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
      }
      return res
    }

    // Strip leading /admin if already present to avoid double-prefixing
    const stripped = pathname.replace(/^\/admin/, '') || '/'
    const adminPath = stripped === '/' ? '/admin/home' : `/admin${stripped}`
    const url = req.nextUrl.clone()
    url.pathname = adminPath

    // Auth check (skip login page)
    if (adminPath !== '/admin/login') {
      const res = NextResponse.rewrite(url)
      if (!(await isAuthorized(req, res))) {
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
    if (!(await isAuthorized(req, res))) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return res
  }

  // The feed planner shares Marla's existing email OTP session.
  if (pathname === '/plan' || pathname.startsWith('/plan/')) {
    const res = NextResponse.next()
    if (!(await isAuthorized(req, res))) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|images|fonts).*)'],
}
