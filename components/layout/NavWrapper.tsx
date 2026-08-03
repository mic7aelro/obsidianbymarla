'use client'

import { usePathname } from 'next/navigation'
import Nav from './Nav'

export default function NavWrapper() {
  const pathname = usePathname()
  const isPublic = pathname !== '/' && !pathname.startsWith('/admin')
  if (!isPublic) return null
  return <Nav />
}
