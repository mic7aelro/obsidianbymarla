import { NextResponse } from 'next/server'
import { verifyOtpCode } from '@/lib/admin-otp'
import { getSession, sessionOptions } from '@/lib/session'

const messages = {
  expired: 'That code expired. Request a new one.',
  locked: 'Too many attempts. Request a new code.',
  invalid: 'That code is not correct.',
  not_found: 'Request a new code first.',
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const remember = body.remember !== false
  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 })
  }

  const result = await verifyOtpCode(email, code)
  if (!result.ok) {
    return NextResponse.json({ error: messages[result.reason] }, { status: 401 })
  }

  const session = await getSession()
  if (!remember) {
    // Declining "keep me signed in" drops the cookie's max-age so it expires
    // when the browser closes, instead of persisting for the full session ttl.
    session.updateConfig({
      ...sessionOptions,
      cookieOptions: { ...sessionOptions.cookieOptions, maxAge: undefined },
    })
  }
  session.isLoggedIn = true
  session.email = email
  await session.save()

  return NextResponse.json({ ok: true })
}
