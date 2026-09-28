import type { HealthStatus } from '../../types';
import './StatusIndicator.css';

interface StatusIndicatorProps {
  status: HealthStatus;
}

const STATUS_LABELS: Record<HealthStatus, string> = {
  online: 'Online',
  degraded: 'Degraded',
  offline: 'Offline',
  checking: 'Checking...',
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <span className={`status-indicator status-${status}`}>
      <span className="status-dot" />
      <span className="status-label">{STATUS_LABELS[status]}</span>
    </span>
  );
}
