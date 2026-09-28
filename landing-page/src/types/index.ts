export interface ProjectHealth {
  proxySlug: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: 'live' | 'coming-soon';
  accentColor: string;
  interfaceType: string;
  techStack: string[];
  health?: ProjectHealth;
  url?: string;
  githubUrl?: string;
  icon?: string;
  tryable?: boolean;
  tryPlaceholder?: string;
  demoWidget?: 'stats-playback' | 'chat-demo' | 'trace-playback';
  /** Label for the primary link; defaults to "Open App →" */
  urlLabel?: string;
}

export interface ChatProxyResponse {
  response: string;
  citations?: { headline: string; date?: string; section?: string }[];
  confidence?: number;
  disclaimer?: string;
  error?: string;
}

export type HealthStatus = 'online' | 'degraded' | 'offline' | 'checking';

export interface HealthResponse {
  status: 'online' | 'degraded' | 'offline';
  checkedAt: string;
}
