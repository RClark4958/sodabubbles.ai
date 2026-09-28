import { projects } from '../../data/projects';
import { ProjectCard } from '../ProjectCard/ProjectCard';
import { PlaceholderCard } from '../PlaceholderCard/PlaceholderCard';
import './ProjectGrid.css';

export function ProjectGrid() {
  return (
    <section className="project-grid">
      {projects.map((project) =>
        project.status === 'live' ? (
          <ProjectCard key={project.id} project={project} />
        ) : (
          <PlaceholderCard key={project.id} project={project} />
        )
      )}
    </section>
  );
}
