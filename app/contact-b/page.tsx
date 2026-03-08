'use client'

import { Suspense } from 'react'
import ContactForm from '@/components/contact/ContactForm'

// Option B — Centered narrow column
// Everything in a ~480px column, centered
// Psalm quote above the form, nothing on the sides
// Intimate, focused, editorial

export default function ContactBPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12rem 2.5rem 10rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Quote */}
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '0.04em',
            lineHeight: 1.6,
            opacity: 0.45,
            marginBottom: '0.75rem',
          }}
        >
          &ldquo;I praise you, for I am fearfully and wonderfully made.&rdquo;
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '8px',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            opacity: 0.25,
            marginBottom: '5rem',
          }}
        >
          Psalm 139:14
        </p>

        {/* Location + Instagram */}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            marginBottom: '4rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              opacity: 0.3,
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
              opacity: 0.3,
              textDecoration: 'none',
              transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
          >
            Instagram
          </a>
        </div>

        {/* Form */}
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  )
}
