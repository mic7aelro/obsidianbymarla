'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Project } from '@/types/project'

gsap.registerPlugin(ScrollTrigger)

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLElement>(null)
  const imageSrc = project.imageVersion
    ? `${project.image}${project.image.includes('?') ? '&' : '?'}v=${project.imageVersion}`
    : project.image

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 36,
        duration: 1.15,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
        delay: (index % 2) * 0.08,
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 90%',
          once: true,
        },
      })
    }, cardRef)

    return () => ctx.revert()
  }, [index])

  return (
    <article className="project-card" ref={cardRef}>
      <Link href={`/work/${project.slug}`} aria-label={`View ${project.title}`}>
        <div className="project-card__media">
          <Image
            className="project-card__image"
            src={imageSrc}
            alt={project.coverAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        </div>
        <div className="project-meta">
          <h2 className="project-meta__title">{project.title}</h2>
          <p className="project-meta__detail">{project.category} / {project.year}</p>
        </div>
      </Link>
    </article>
  )
}
