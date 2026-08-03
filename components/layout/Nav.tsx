'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from '@/providers/PageTransitionProvider'

const links = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
]

export default function Nav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { navigate } = useTransition()

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  return (
    <>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link className="site-nav__wordmark" href="/">
          <span className="site-nav__wordmark-desktop">Obsidian by Marla Chelsea McLeod</span>
          <span className="site-nav__wordmark-mobile">Obsidian by Marla</span>
        </Link>

        <ul className="site-nav__links">
          {links.map(({ href, label }) => (
            <li key={href}>
              <button
                className="site-nav__link"
                aria-current={pathname === href ? 'page' : undefined}
                onClick={() => navigate(href)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        <a
          className="site-nav__social"
          href="https://www.instagram.com/marlizzlle/"
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>

        <button
          className="site-nav__menu-button"
          aria-controls="mobile-menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </nav>

      <div id="mobile-menu" className="mobile-menu" data-open={menuOpen} aria-hidden={!menuOpen}>
        <ul className="mobile-menu__links">
          {links.map(({ href, label }) => (
            <li key={href}>
              <button
                className="mobile-menu__link"
                aria-current={pathname === href ? 'page' : undefined}
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => {
                  setMenuOpen(false)
                  navigate(href)
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className="mobile-menu__footer">
          <Link className="eyebrow" href="/about" tabIndex={menuOpen ? 0 : -1}>
            About Marla
          </Link>
          <a
            className="eyebrow"
            href="https://www.instagram.com/marlizzlle/"
            target="_blank"
            rel="noreferrer"
            tabIndex={menuOpen ? 0 : -1}
          >
            Instagram
          </a>
        </div>
      </div>
    </>
  )
}
