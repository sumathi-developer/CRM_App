import React from 'react';
import type { Tone } from '../leadGenConstants';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: Tone;
}

/** Analytics KPI card. */
export const StatCard: React.FC<StatCardProps> = ({ label, value, hint, icon, tone = 'blue' }) => (
  <div className={`lg-card lg-stat-card tone-${tone}`}>
    {icon && <div className="lg-stat-icon">{icon}</div>}
    <div className="lg-stat-body">
      <span className="lg-stat-label">{label}</span>
      <span className="lg-stat-value">{value}</span>
      {hint && <span className="lg-stat-hint">{hint}</span>}
    </div>
  </div>
);

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  title?: string;
}

/** Generic coloured pill used for statuses, types and flags. */
export const Badge: React.FC<BadgeProps> = ({ tone = 'slate', children, title }) => (
  <span className={`lg-badge tone-${tone}`} title={title}>
    {children}
  </span>
);

interface ScorePillProps {
  score?: number | null;
}

export const ScorePill: React.FC<ScorePillProps> = ({ score }) => {
  const s = Number(score || 0);
  const tone: Tone = s >= 70 ? 'green' : s >= 40 ? 'amber' : 'slate';
  return <Badge tone={tone}>{s}</Badge>;
};

interface SectionCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Titled content card used on overview, analytics and details screens. */
export const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, actions, children, className = '' }) => (
  <section className={`lg-card lg-section-card ${className}`}>
    <div className="lg-section-head">
      <div>
        <h2 className="lg-section-title">{title}</h2>
        {subtitle && <p className="lg-section-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="lg-section-actions">{actions}</div>}
    </div>
    {children}
  </section>
);
