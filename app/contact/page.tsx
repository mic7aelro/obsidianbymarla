import { Suspense } from 'react'
import ContactForm from '@/components/contact/ContactForm'

export const metadata = {
  title: 'Contact — Marla McLeod',
}

export default function ContactPage() {
  return (
    <div style={{ padding: '7rem 2.5rem 10rem', maxWidth: '700px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3rem, 8vw, 8rem)',
          fontWeight: 300,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          lineHeight: 1,
          marginBottom: '0.75rem',
        }}
      >
        Contact
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '2.5rem',
          marginBottom: '5rem',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '9px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: 0.4,
          }}
        >
          Miami
        </p>
        <a
          href="https://www.instagram.com/marlizzlle/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '9px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: 0.4,
          }}
        >
          Instagram
        </a>
      </div>

      <Suspense fallback={null}>
        <ContactForm />
      </Suspense>
    </div>
  )
}
