'use client'

import { Suspense } from 'react'
import ContactForm from '@/components/contact/ContactForm'

export default function ContactPage() {
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
          justifyContent: 'center',
          gap: '2rem',
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
            Contact
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              lineHeight: 1.8,
              opacity: 0.55,
              maxWidth: '360px',
              marginBottom: '2.5rem',
            }}
          >
            Available for editorial, wedding, commercial, and personal styling work.
            Custom packages on request.
          </p>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              opacity: 0.35,
            }}
          >
            Services available in the Greater Miami area
          </p>
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
