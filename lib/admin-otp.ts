import { randomInt } from 'crypto'
import type { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { safeEqual, signAdminPayload } from '@/lib/admin-auth'

const COLLECTION = 'otp_attempts'
const OTP_TTL_MS = 5 * 60 * 1000
const MAX_OTP_ATTEMPTS = 5
const REQUEST_WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 3

type OtpAttempt = {
  _id?: ObjectId
  email: string
  allowed: boolean
  requestedAt: Date
  ip: string | null
  userAgent: string | null
  codeHash: string | null
  expiresAt: Date | null
  attempts: number
  consumedAt: Date | null
}

type RequestMeta = {
  ip: string | null
  userAgent: string | null
}

export type OtpRequestResult =
  | { rateLimited: true; code: null }
  | { rateLimited: false; code: string | null }

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

function hashCode(email: string, expiresAt: number, code: string): string {
  return signAdminPayload(`${email}:${expiresAt}:${code}`)
}

async function getCollection() {
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB ?? process.env.MONGO_DB ?? 'marla')
  return db.collection<OtpAttempt>(COLLECTION)
}

export async function recordOtpRequest(
  email: string,
  allowed: boolean,
  meta: RequestMeta,
): Promise<OtpRequestResult> {
  const collection = await getCollection()
  const requestedAt = new Date()
  const recentCount = await collection.countDocuments({
    email,
    requestedAt: { $gte: new Date(Date.now() - REQUEST_WINDOW_MS) },
  })

  if (recentCount >= MAX_REQUESTS_PER_WINDOW) {
    return { rateLimited: true, code: null }
  }

  if (!allowed) {
    await collection.insertOne({
      email,
      allowed,
      requestedAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
      codeHash: null,
      expiresAt: null,
      attempts: 0,
      consumedAt: null,
    })
    return { rateLimited: false, code: null }
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  await collection.insertOne({
    email,
    allowed,
    requestedAt,
    ip: meta.ip,
    userAgent: meta.userAgent,
    codeHash: hashCode(email, expiresAt.getTime(), code),
    expiresAt,
    attempts: 0,
    consumedAt: null,
  })

  return { rateLimited: false, code }
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'expired' | 'locked' | 'invalid' | 'not_found' }

export async function verifyOtpCode(email: string, code: string): Promise<OtpVerifyResult> {
  const collection = await getCollection()
  const document = await collection.findOne(
    { email, allowed: true, consumedAt: null },
    { sort: { requestedAt: -1 } },
  )

  if (!document?.codeHash || !document.expiresAt) {
    return { ok: false, reason: 'not_found' }
  }
  if (Date.now() > document.expiresAt.getTime()) {
    return { ok: false, reason: 'expired' }
  }
  if (document.attempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, reason: 'locked' }
  }

  const candidate = hashCode(email, document.expiresAt.getTime(), code)
  if (safeEqual(candidate, document.codeHash)) {
    await collection.updateOne(
      { _id: document._id },
      { $set: { consumedAt: new Date() } },
    )
    return { ok: true }
  }

  await collection.updateOne({ _id: document._id }, { $inc: { attempts: 1 } })
  return { ok: false, reason: 'invalid' }
}
