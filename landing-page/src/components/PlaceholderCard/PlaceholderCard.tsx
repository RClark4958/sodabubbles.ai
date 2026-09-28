import type { Project } from '../../types';
import './PlaceholderCard.css';

interface PlaceholderCardProps {
  project: Project;
}

export function PlaceholderCard({ project }: PlaceholderCardProps) {
  return (
    <article className="placeholder-card">
      <span className="placeholder-card__icon">{project.icon}</span>
      <h3 className="placeholder-card__name">{project.name}</h3>
      <p className="placeholder-card__tagline">{project.tagline}</p>
    </article>
  );
}
