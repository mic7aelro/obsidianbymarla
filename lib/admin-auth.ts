import { createHmac, timingSafeEqual } from 'crypto'
import { ADMIN_EMAIL_ALLOWLIST } from '@/lib/admin-emails'

function authSecret(): string {
  const value = process.env.ADMIN_AUTH_SECRET ?? process.env.SESSION_SECRET
  if (!value) throw new Error('ADMIN_AUTH_SECRET or SESSION_SECRET must be set')
  return value
}

export function signAdminPayload(payload: string): string {
  return createHmac('sha256', authSecret()).update(payload).digest('hex')
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/** ADMIN_EMAIL or ADMIN_EMAILS may contain a comma-separated allowlist. */
export function isAllowedAdminEmail(email: string): boolean {
  const configured =
    process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? process.env.MARLA_EMAIL ?? ''

  const environmentEmails = configured
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)

  const allowed = new Set([
    ...ADMIN_EMAIL_ALLOWLIST.map(value => value.toLowerCase()),
    ...environmentEmails,
  ])

  return allowed.has(email.trim().toLowerCase())
}
