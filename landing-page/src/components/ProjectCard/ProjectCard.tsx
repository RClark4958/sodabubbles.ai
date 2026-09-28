import { useState } from 'react';
import type { Project } from '../../types';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { StatusIndicator } from '../StatusIndicator/StatusIndicator';
import { TechBadge } from '../TechBadge/TechBadge';
import { TryItWidget } from '../TryItWidget/TryItWidget';
import { StatsPlayback } from '../StatsPlayback/StatsPlayback';
import { DemoChat } from '../DemoChat/DemoChat';
import { TracePlayback } from '../TracePlayback/TracePlayback';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const healthStatus = useHealthCheck(project.health?.proxySlug);
  const [showTryIt, setShowTryIt] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  return (
    <article
      className="project-card"
      style={{ '--accent': project.accentColor } as React.CSSProperties}
    >
      <div className="project-card__header">
        <span className="project-card__icon">{project.icon}</span>
        <div className="project-card__title-group">
          <h3 className="project-card__name">{project.name}</h3>
          <span className="project-card__interface">{project.interfaceType}</span>
        </div>
        {project.health && <StatusIndicator status={healthStatus} />}
      </div>

      <p className="project-card__tagline">{project.tagline}</p>
      <p className="project-card__description">{project.description}</p>

      <div className="project-card__tech">
        {project.techStack.map((tech) => (
          <TechBadge key={tech} label={tech} accentColor={project.accentColor} />
        ))}
      </div>

      <div className="project-card__footer">
        <div className="project-card__actions">
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card__link"
            >
              {project.urlLabel ?? 'Open App \u2192'}
            </a>
          )}
          {project.tryable && (
            <button
              className={`project-card__link project-card__try-btn ${showTryIt ? 'project-card__try-btn--active' : ''}`}
              onClick={() => setShowTryIt(!showTryIt)}
            >
              {showTryIt ? 'Close' : 'Try It'}
            </button>
          )}
          {project.demoWidget && (
            <button
              className={`project-card__link project-card__try-btn ${showDemo ? 'project-card__try-btn--active' : ''}`}
              onClick={() => setShowDemo(!showDemo)}
            >
              {showDemo ? 'Close' : 'Demo'}
            </button>
          )}
        </div>

        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="project-card__github"
            aria-label={`${project.name} on GitHub`}
          >
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        )}
      </div>

      {showTryIt && project.tryable && (
        <TryItWidget
          projectSlug={project.id}
          placeholder={project.tryPlaceholder}
          accentColor={project.accentColor}
        />
      )}

      {showDemo && project.demoWidget === 'stats-playback' && (
        <StatsPlayback accentColor={project.accentColor} />
      )}

      {showDemo && project.demoWidget === 'chat-demo' && (
        <DemoChat accentColor={project.accentColor} />
      )}

      {showDemo && project.demoWidget === 'trace-playback' && (
        <TracePlayback accentColor={project.accentColor} />
      )}
    </article>
  );
}
