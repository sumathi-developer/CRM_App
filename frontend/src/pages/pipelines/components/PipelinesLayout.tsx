import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { TrendingUpIcon, ArrowLeftIcon } from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import type { Pipeline } from '../../../types/pipeline.types';

interface NavGroup {
  label: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}

const PIPELINES_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Pipeline Views',
    links: [
      { to: '/pipelines', label: 'Pipeline Overview', end: true },
      { to: '/pipelines/board', label: 'Pipeline Board' },
      { to: '/pipelines/list', label: 'Pipeline List' },
      { to: '/pipelines/table', label: 'Pipeline Table' },
      { to: '/pipelines/selector', label: 'Pipeline Selector' },
    ],
  },
  {
    label: 'Stages & Probability',
    links: [
      { to: '/pipelines/stages', label: 'Pipeline Stages' },
      { to: '/pipelines/stage-management', label: 'Stage Management' },
      { to: '/pipelines/probability', label: 'Stage Probability' },
    ],
  },
  {
    label: 'Configuration',
    links: [
      { to: '/pipelines/create', label: 'Create Pipeline' },
      { to: '/pipelines/settings', label: 'Pipeline Settings' },
    ],
  },
];

interface PipelinesLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  activePipeline?: Pipeline | null;
  pipelines?: Pipeline[];
  onSelectPipelineId?: (pipelineId: string) => void;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const PipelinesLayout: React.FC<PipelinesLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  activePipeline,
  pipelines = [],
  onSelectPipelineId,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  children,
}) => {
  const location = useLocation();
  const flash = (location.state as { flash?: string } | null)?.flash;
  const [flashDismissed, setFlashDismissed] = useState(false);
  const successMessage = success || (flashDismissed ? null : flash) || null;

  return (
    <div className="app-layout" id="pipelines-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation */}
        <nav className="lg-subnav ld-subnav" aria-label="Sales Pipeline module navigation">
          {PIPELINES_NAV_GROUPS.map((group) => (
            <div key={group.label} className="lg-subnav-group">
              <span className="lg-subnav-label">{group.label}</span>
              <div className="lg-subnav-links">
                {group.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) => `lg-subnav-link ${isActive ? 'is-active' : ''}`}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Active Pipeline Context & Selector Strip */}
        {activePipeline && (
          <div className="lg-card ld-lead-context-strip">
            <div className="ld-context-main">
              <Link to="/pipelines/selector" className="ld-context-back">
                <ArrowLeftIcon size={15} />
                <span>Pipelines</span>
              </Link>

              {pipelines.length > 1 && onSelectPipelineId ? (
                <select
                  className="lg-select ld-compact-select"
                  value={activePipeline.id}
                  onChange={(e) => onSelectPipelineId(e.target.value)}
                  aria-label="Select active sales pipeline"
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="ld-context-info">
                  <strong>{activePipeline.name}</strong>
                  {activePipeline.description && (
                    <span className="lg-muted">{activePipeline.description}</span>
                  )}
                </div>
              )}

              <div className="lg-badge-row">
                {activePipeline.isDefault && <Badge tone="green">Default Pipeline</Badge>}
                <Badge tone="blue">{activePipeline.stages?.length ?? 0} Stages</Badge>
              </div>
            </div>

            <div className="ld-context-links">
              <NavLink
                to={`/pipelines/${activePipeline.id}/board`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Board
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/list`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                List
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/table`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Table
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/stages`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Stages
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/stage-management`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Stage Management
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/probability`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Stage Probability
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/edit`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Edit Pipeline
              </NavLink>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            {breadcrumbs && <div className="lg-breadcrumbs">{breadcrumbs}</div>}
            <h1 className="lg-title">
              <span className="lg-title-icon">{icon || <TrendingUpIcon size={22} />}</span>
              <span>{title}</span>
            </h1>
            {subtitle && <p className="lg-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="lg-header-actions">{actions}</div>}
        </header>

        {/* Alert Banners */}
        {error && (
          <div className="lg-alert-wrap">
            <ErrorMessage error={error} onDismiss={onDismissError} />
          </div>
        )}
        {successMessage && (
          <div className="lg-alert-wrap">
            <SuccessMessage
              message={successMessage}
              onDismiss={() => {
                setFlashDismissed(true);
                onDismissSuccess?.();
              }}
            />
          </div>
        )}

        {children}
      </main>
    </div>
  );
};

