import './TechBadge.css';

interface TechBadgeProps {
  label: string;
  accentColor: string;
}

export function TechBadge({ label, accentColor }: TechBadgeProps) {
  return (
    <span
      className="tech-badge"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      {label}
    </span>
  );
}
