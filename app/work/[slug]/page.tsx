import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { projects, getProjects } from '@/data/projects'
import ProjectGallery from '@/components/work/ProjectGallery'

export function generateStaticParams() {
  return projects.map(project => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = projects.find(item => item.slug === slug)
  if (!project) return {}
  return {
    title: project.title,
    description: project.coverAlt,
    openGraph: { images: [project.image] },
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const allProjects = await getProjects()
  const project = allProjects.find(item => item.slug === slug)
  if (!project) notFound()

  const others = allProjects.filter(item => item.slug !== slug).slice(0, 3)

  return (
    <>
      <header className="project-hero">
        <Image
          className="project-hero__image"
          src={project.image}
          alt={project.coverAlt}
          fill
          priority
          sizes="100vw"
        />
        <div className="project-hero__meta">
          <p className="project-hero__category">{project.category} / {project.year}</p>
          <h1 className="project-hero__title">{project.title}</h1>
        </div>
      </header>

      {project.images && project.images.length > 0 ? (
        <ProjectGallery images={project.images} title={project.title} />
      ) : (
        <p className="empty-state" style={{ paddingInline: 'var(--page-gutter)' }}>
          This story is being prepared for the archive.
        </p>
      )}

      <section className="more-work" aria-labelledby="more-work-title">
        <h2 id="more-work-title" className="more-work__heading">More work</h2>
        <div className="more-work__grid">
          {others.map(item => (
            <Link className="more-project" key={item.slug} href={`/work/${item.slug}`}>
              <div className="more-project__media">
                <Image
                  className="more-project__image"
                  src={item.image}
                  alt={item.coverAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <p className="more-project__title">{item.title}</p>
            </Link>
          ))}
        </div>
        <div className="back-link">
          <Link className="text-link" href="/work">All work</Link>
        </div>
      </section>
    </>
  )
}
