'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'

const links = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
]

const navLinkStyle = (active: boolean) => ({
  fontFamily: 'var(--font-sans)',
  fontSize: '10px',
  fontWeight: 400,
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
  color: '#fff',
  textDecoration: 'none',
  opacity: active ? 1 : 0.5,
  transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
})

export default function Nav() {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const nav = navRef.current
      if (!nav) return
      if (y > lastY.current && y > 60) {
        nav.style.transform = 'translateY(-100%)'
      } else {
        nav.style.transform = 'translateY(0)'
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      ref={navRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '2rem 2.5rem',
        pointerEvents: 'none',
        transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Left — nav links */}
      <ul
        style={{
          display: 'flex',
          gap: '2.5rem',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          pointerEvents: 'all',
        }}
      >
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              style={navLinkStyle(pathname === href)}
              onMouseEnter={e => (e.currentTarget.style.opacity = pathname === href ? '1' : '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = pathname === href ? '1' : '0.5')}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Center — wordmark */}
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '13px',
          fontWeight: 300,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#fff',
          textDecoration: 'none',
          pointerEvents: 'all',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        Marla Chelsea McLeod
      </Link>

      {/* Right — Instagram icon */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: 'all' }}>
        <a
          href="https://www.instagram.com/marlizzlle/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          style={{
            color: '#fff',
            opacity: 0.5,
            display: 'flex',
            alignItems: 'center',
            transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
        >
          <Icon icon="mdi:instagram" width={18} height={18} />
        </a>
      </div>
    </nav>
  )
}
