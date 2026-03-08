import Link from 'next/link'
import { services } from '@/data/services'

export const metadata = {
  title: 'Services — Marla McLeod',
}

export default function ServicesPage() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'start',
      }}
    >
      {/* Left — sticky identity */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          padding: '10rem 4rem 6rem 2.5rem',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3rem, 8vw, 8rem)',
            fontWeight: 300,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1,
            marginBottom: '2rem',
          }}
        >
          Services
        </h1>

        <p className="prose" style={{ marginBottom: '3rem' }}>
          Every project is different. Whether you need a photographer who will disappear into the
          room or a stylist who builds your visual identity from the ground up, custom packages are
          available. Reach out with what you have in mind.
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
          Custom packages available on request
        </p>
      </div>

      {/* Right — service list */}
      <div
        style={{
          padding: '10rem 2.5rem 6rem 4rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {services.map(category => (
            <div key={category.title}>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '9px',
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  opacity: 0.4,
                  marginBottom: '2rem',
                }}
              >
                {category.title}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {category.packages.map(pkg => (
                  <div
                    key={pkg.name}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '1rem',
                      alignItems: 'start',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      paddingTop: '1.75rem',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.1rem',
                          fontWeight: 300,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          marginBottom: '0.4rem',
                        }}
                      >
                        {pkg.name}
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '12px',
                          opacity: 0.5,
                          lineHeight: 1.6,
                        }}
                      >
                        {pkg.details}
                      </p>
                    </div>
                    <p
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '11px',
                        letterSpacing: '0.1em',
                        opacity: 0.8,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pkg.price}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem' }}>
                <Link
                  href={`/contact?service=${encodeURIComponent(category.title)}`}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '9px',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    opacity: 0.4,
                    transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  Book this →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
