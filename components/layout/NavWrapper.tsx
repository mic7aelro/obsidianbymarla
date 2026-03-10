'use client'

import { usePathname } from 'next/navigation'
import Nav from './Nav'

const PUBLIC_ROUTES = ['/work', '/services', '/contact', '/about']

export default function NavWrapper() {
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (!isPublic) return null
  return <Nav />
}
