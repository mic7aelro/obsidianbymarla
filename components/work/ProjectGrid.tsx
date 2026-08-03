import { getProjects } from '@/data/projects'
import ProjectCard from './ProjectCard'

export default async function ProjectGrid() {
  const projects = await getProjects()

  return (
    <div className="project-grid">
      {projects.length > 0 ? (
        projects.map((project, i) => (
          <ProjectCard key={project.slug} project={project} index={i} />
        ))
      ) : (
        <p className="empty-state">New work is being prepared. Please check back soon.</p>
      )}
    </div>
  )
}
