import { getProjects } from '@/data/projects'
import ProjectCard from './ProjectCard'

export default async function ProjectGrid() {
  const projects = await getProjects()

  return (
    <div
      className="two-col-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '4rem 2.5rem',
        padding: '0 2.5rem 8rem',
      }}
    >
      {projects.map((project, i) => (
        <ProjectCard key={project.slug} project={project} index={i} />
      ))}
    </div>
  )
}
