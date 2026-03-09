import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

const DATA_PATH = path.join(process.cwd(), 'data', 'hidden-images.json')

async function requireAuth() {
  const session = await getIronSession<{ isLoggedIn?: boolean }>(
    await cookies(),
    { password: process.env.SESSION_SECRET!, cookieName: 'marla_admin_session' }
  )
  return !!session.isLoggedIn
}

async function readHidden(): Promise<string[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function writeHidden(list: string[]) {
  await fs.writeFile(DATA_PATH, JSON.stringify(list, null, 2))
}

// GET — return current hidden list
export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const hidden = await readHidden()
  return NextResponse.json(hidden)
}

// POST — toggle a src: { src, hidden: true|false }
export async function POST(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { src, hidden } = await req.json()
  if (!src) return NextResponse.json({ error: 'Missing src' }, { status: 400 })

  let list = await readHidden()
  if (hidden) {
    if (!list.includes(src)) list.push(src)
  } else {
    list = list.filter(s => s !== src)
  }
  await writeHidden(list)
  return NextResponse.json({ ok: true })
}
