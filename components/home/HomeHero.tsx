'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { useTransition } from '@/providers/PageTransitionProvider'
import { mediaUrl } from '@/lib/media'

export default function HomeHero() {
  const rootRef = useRef<HTMLDivElement>(null)
  const { navigate } = useTransition()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.2 })
        .from('[data-home-quote]', {
          opacity: 0,
          y: 24,
          duration: 1.4,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
        })
        .from(
          '[data-home-statement]',
          { opacity: 0, y: 16, duration: 1.2, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          '-=0.9'
        )
        .from(
          '[data-home-cta]',
          { opacity: 0, y: 10, duration: 1, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          '-=0.75'
        )
        .from(
          '[data-home-image]',
          { opacity: 0, scale: 1.015, duration: 1.6, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          '-=1.5'
        )
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={rootRef} className="original-home" aria-label="Marla McLeod introduction">
      <div className="original-home__copy">
        <div className="original-home__content">
          <blockquote className="original-home__quote" data-home-quote>
            “I praise you, for I am fearfully and wonderfully made. Wonderful are your works; my
            soul knows it very well.”
            <cite>Psalm 139:14</cite>
          </blockquote>

          <div className="original-home__statement" data-home-statement>
            <p>
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

          <button className="text-link" data-home-cta onClick={() => navigate('/work')}>
            View work
          </button>
        </div>
      </div>

      <div className="original-home__media" data-home-image>
        <Image
          className="original-home__image"
          src={mediaUrl('/images/marla-pfp.jpg')}
          alt="Marla Chelsea McLeod"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 50vw"
        />
      </div>
    </section>
  )
}
