import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { projects, getProjects } from '@/data/projects'
import ProjectGallery from '@/components/work/ProjectGallery'

export function generateStaticParams() {
  return projects.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = projects.find(p => p.slug === slug)
  if (!project) return {}
  return { title: `${project.title} — Marla McLeod` }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const allProjects = await getProjects()
  const project = allProjects.find(p => p.slug === slug)
  if (!project) notFound()

  const others = allProjects.filter(p => p.slug !== slug).slice(0, 3)

  return (
    <>
      {/* Full-bleed hero */}
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          background: '#111',
        }}
      >
        <Image
          src={project.image}
          alt={project.coverAlt}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', opacity: 0.85 }}
        />
        {/* Metadata overlay — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '2.5rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              opacity: 0.5,
              marginBottom: '0.5rem',
            }}
          >
            {project.category} — {project.year}
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 6rem)',
              fontWeight: 300,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            {project.title}
          </h1>
        </div>
      </div>

      {/* Gallery */}
      {project.images && project.images.length > 0 && (
        <ProjectGallery images={project.images} title={project.title} />
      )}

      {/* Next projects */}
      <div style={{ padding: '6rem 2.5rem 8rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '9px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: 0.4,
            marginBottom: '3rem',
          }}
        >
          More Work
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {others.map(p => (
            <Link key={p.slug} href={`/work/${p.slug}`} style={{ display: 'block' }}>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '3 / 4',
                  background: '#111',
                  marginBottom: '1rem',
                }}
              >
                <Image
                  src={p.image}
                  alt={p.coverAlt}
                  fill
                  sizes="33vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '9px',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  opacity: 0.5,
                }}
              >
                {p.title}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 2.5rem 6rem' }}>
        <Link
          href="/work"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            opacity: 0.45,
          }}
        >
          ← All Work
        </Link>
      </div>
    </>
  )
}
