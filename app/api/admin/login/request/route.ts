import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAllowedAdminEmail } from '@/lib/admin-auth'
import { recordOtpRequest } from '@/lib/admin-otp'
import { adminOtpHtml, adminOtpText } from '@/lib/emails/adminOtp'

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_AUTH_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return NextResponse.json({ error: 'Email sign-in is not connected yet.' }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    return NextResponse.json({ error: 'Enter your email.' }, { status: 400 })
  }

  const allowed = isAllowedAdminEmail(email)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent')
  const result = await recordOtpRequest(email, allowed, { ip, userAgent })

  if (result.rateLimited) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a few minutes.' },
      { status: 429 },
    )
  }

  if (!allowed || !result.code) {
    return NextResponse.json({ error: 'That email is not authorized.' }, { status: 403 })
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `Your admin sign-in code: ${result.code}`,
    html: adminOtpHtml(result.code),
    text: adminOtpText(result.code),
  })

  if (error) {
    console.error('[admin/login] OTP delivery failed:', error)
    return NextResponse.json({ error: 'The code could not be sent just now.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
