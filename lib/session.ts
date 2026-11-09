import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { REMEMBER_ME_TTL_SECONDS } from '@/lib/session-constants'

export { REMEMBER_ME_TTL_SECONDS } from '@/lib/session-constants'

export interface SessionData {
  isLoggedIn: boolean
  email?: string
  // Set when "keep me signed in" was ticked; only these sessions are extended
  remember?: boolean
  refreshedAt?: number
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'marla_admin_session',
  ttl: REMEMBER_ME_TTL_SECONDS,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
