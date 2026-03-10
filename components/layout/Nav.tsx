'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'
import { useTransition } from '@/providers/PageTransitionProvider'

const links = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
]

const navLinkStyle = (active: boolean) => ({
  fontFamily: 'var(--font-sans)',
  fontSize: '12px',
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
  const [menuOpen, setMenuOpen] = useState(false)
  const { navigate } = useTransition()

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

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
    <>
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
        {/* Scrim — desktop only, mobile pages are black so it's not needed */}
        <div
          className="desktop-only"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />

        {/* Left — nav links (desktop) / hamburger (mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'all' }}>
          {/* Desktop links */}
          <ul
            className="desktop-only"
            style={{
              display: 'flex',
              gap: '2.5rem',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            {links.map(({ href, label }) => (
              <li key={href}>
                <button
                  onClick={() => navigate(href)}
                  style={{ ...navLinkStyle(pathname === href), background: 'none', border: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = pathname === href ? '1' : '0.8')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = pathname === href ? '1' : '0.5')}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {/* Mobile hamburger */}
          <button
            className="mobile-only"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 0,
              display: 'none', // overridden by .mobile-only in CSS
              flexDirection: 'column',
              gap: '5px',
              WebkitAppearance: 'none',
              appearance: 'none',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
          >
            <span style={{
              display: 'block', width: '24px', height: '2px', backgroundColor: 'white',
              transform: menuOpen ? 'translateY(4px) rotate(45deg)' : 'none',
              transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
            <span style={{
              display: 'block', width: '24px', height: '2px', backgroundColor: 'white',
              opacity: menuOpen ? 0 : 1,
              transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
            <span style={{
              display: 'block', width: '24px', height: '2px', backgroundColor: 'white',
              transform: menuOpen ? 'translateY(-4px) rotate(-45deg)' : 'none',
              transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </button>
        </div>

        {/* Center — wordmark */}
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
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
          Obsidian By Marla Chelsea McLeod
        </Link>

        {/* Right — Instagram icon (desktop only) */}
        <div className="desktop-only" style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: 'all' }}>
          <a
            href="https://www.instagram.com/marlizzlle/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            style={{
              color: '#fff',
              opacity: 1,
              display: 'flex',
              alignItems: 'center',
              transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Icon icon="mdi:instagram" width={22} height={22} />
          </a>
        </div>
      </nav>

      {/* Mobile full-screen overlay menu */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2rem 2.5rem',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'all' : 'none',
          transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {links.map(({ href, label }) => (
            <li key={href}>
              <button
                onClick={() => { setMenuOpen(false); navigate(href) }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(3rem, 12vw, 6rem)',
                  fontWeight: 300,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  textDecoration: 'none',
                  opacity: pathname === href ? 1 : 0.45,
                  transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                  lineHeight: 1,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        <a
          href="https://www.instagram.com/marlizzlle/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '2.5rem',
            fontFamily: 'var(--font-sans)',
            fontSize: '9px',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#fff',
            opacity: 0.35,
            textDecoration: 'none',
          }}
        >
          Instagram
        </a>
      </div>
    </>
  )
}
