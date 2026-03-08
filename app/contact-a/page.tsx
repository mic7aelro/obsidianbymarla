'use client'

import { Suspense } from 'react'
import ContactForm from '@/components/contact/ContactForm'

// Option A — Split layout
// Left: editorial identity (title, location, Instagram, prose)
// Right: form
// Equal columns, full viewport height

export default function ContactAPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      {/* Left — identity */}
      <div
        style={{
          padding: '10rem 4rem 6rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3.5rem, 7vw, 9rem)',
              fontWeight: 300,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 0.9,
              marginBottom: '3rem',
            }}
          >
            Let&apos;s<br />Work<br />Together
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              lineHeight: 1.8,
              opacity: 0.55,
              maxWidth: '360px',
              marginBottom: '4rem',
            }}
          >
            Available for editorial, wedding, commercial, and personal styling work.
            Custom packages on request.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              opacity: 0.35,
            }}
          >
            New York
          </p>
          <a
            href="https://www.instagram.com/marlizzlle/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#fff',
              opacity: 0.35,
              textDecoration: 'none',
              transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
          >
            Instagram
          </a>
        </div>
      </div>

      {/* Right — form */}
      <div
        style={{
          padding: '10rem 2.5rem 6rem 4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  )
}
