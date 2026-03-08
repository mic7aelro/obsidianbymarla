'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Project } from '@/types/project'

gsap.registerPlugin(ScrollTrigger)

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 40,
        duration: 1.2,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
        delay: (index % 2) * 0.15,
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 88%',
          once: true,
        },
      })
    }, cardRef)

    return () => ctx.revert()
  }, [index])

  return (
    <div ref={cardRef}>
      <Link
        href={`/work/${project.slug}`}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3 / 4',
            background: '#111',
            overflow: 'hidden',
          }}
        >
          <Image
            src={project.image}
            alt={project.coverAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
            onError={() => {}} // silently use #111 placeholder
          />
        </div>

        <div style={{ marginTop: '1rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: 0.5,
              margin: '0 0 0.35rem',
            }}
          >
            {project.category} — {project.year}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 300,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {project.title}
          </p>
        </div>
      </Link>
    </div>
  )
}
