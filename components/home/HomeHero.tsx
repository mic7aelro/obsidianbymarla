'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'

export default function HomeHero() {
  const quoteRef = useRef<HTMLQuoteElement>(null)
  const statementRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const portraitRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 })

      tl.from(quoteRef.current, {
        opacity: 0,
        y: 30,
        duration: 1.6,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
      })
        .from(
          statementRef.current,
          { opacity: 0, y: 20, duration: 1.4, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          '-=1.0'
        )
        .from(
          ctaRef.current,
          { opacity: 0, y: 16, duration: 1.2, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          '-=0.8'
        )
        .from(
          portraitRef.current,
          { opacity: 0, duration: 1.6, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          '-=1.8'
        )
    })

    return () => ctx.revert()
  }, [])

  return (
    <div
      className="two-col-grid"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        overflow: 'hidden',
      }}
    >
      {/* Left — text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(2rem, 6vw, 6rem)',
          overflowY: 'auto',
        }}
      >
        <blockquote
          ref={quoteRef}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.4rem, 4vw, 3.5rem)',
            fontWeight: 300,
            lineHeight: 1.2,
            letterSpacing: '0.04em',
            color: '#fff',
            marginBottom: '3rem',
            fontStyle: 'italic',
          }}
        >
          &ldquo;I praise you, for I am fearfully and wonderfully made. Wonderful are your works; my
          soul knows it very well.&rdquo;
          <cite
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              fontStyle: 'normal',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: 0.45,
              marginTop: '1.25rem',
            }}
          >
            Psalm 139:14
          </cite>
        </blockquote>

        <div ref={statementRef} className="prose" style={{ marginBottom: '3rem' }}>
          <p style={{ marginBottom: '1em' }}>
            My work in most ways is an encapsulation of the beauty of what it is to be human. In a
            world where perfection is at the precipice I want to show people that it is our
            imperfections that create beauty. That we are divinely and wonderfully made.
          </p>
          <p>
            When I first started taking pictures of my friends, my ultimate goal was to show them
            how beautiful they were just being their natural self unposed and care free. In my work
            I try not to impose my desires for a perfect picture and just let the moment be. Entrust
            my instincts to capture the subject at just the right moment and allow the beauty
            that&apos;s already there to reveal itself.
          </p>
        </div>

        <Link
          ref={ctaRef}
          href="/work"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#fff',
            opacity: 0.6,
            display: 'inline-block',
            transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
        >
          View Work &rarr;
        </Link>
      </div>

      {/* Right — portrait, full height */}
      <div
        ref={portraitRef}
        className="desktop-only"
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        <Image
          src="/images/marla-pfp.jpg"
          alt="Marla Chelsea McLeod"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>
    </div>
  )
}
