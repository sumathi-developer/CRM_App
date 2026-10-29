import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { TargetIcon, ArrowLeftIcon } from '../../../components/common/Icons';
import { Badge, ScorePill } from '../../lead-generation/components/Cards';
import { formatCurrency, humanize } from '../../lead-generation/leadGenConstants';
import { leadFullName, statusTone } from '../leadConstants';
import type { Lead } from '../../../types/lead.types';

interface NavGroup {
  label: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}

const LEADS_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Views',
    links: [
      { to: '/leads', label: 'All Leads', end: true },
      { to: '/leads/my', label: 'My Leads' },
      { to: '/leads/list', label: 'Lead List' },
      { to: '/leads/board', label: 'Lead Board' },
      { to: '/leads/table', label: 'Lead Table' },
    ],
  },
  {
    label: 'Management',
    links: [
      { to: '/leads/create', label: 'Create Lead' },
      { to: '/leads/assignment', label: 'Assignment' },
      { to: '/leads/qualification', label: 'Qualification' },
      { to: '/leads/scoring', label: 'Scoring' },
      { to: '/leads/conversion', label: 'Conversion' },
    ],
  },
  {
    label: 'Engagement',
    links: [
      { to: '/leads/activities', label: 'Activities' },
      { to: '/leads/notes', label: 'Notes' },
      { to: '/leads/documents', label: 'Documents' },
    ],
  },
  {
    label: 'Operations',
    links: [
      { to: '/leads/import', label: 'Import' },
      { to: '/leads/export', label: 'Export' },
      { to: '/leads/settings', label: 'Settings' },
    ],
  },
];

interface LeadsLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  activeLead?: Lead | null;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const LeadsLayout: React.FC<LeadsLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  activeLead,
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
    <div className="app-layout" id="leads-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation */}
        <nav className="lg-subnav ld-subnav" aria-label="Leads module navigation">
          {LEADS_NAV_GROUPS.map((group) => (
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

        {/* Active Lead Context Strip when inspecting a specific lead's sub-screen */}
        {activeLead && (
          <div className="lg-card ld-lead-context-strip">
            <div className="ld-context-main">
              <Link to={`/leads/${activeLead.id}`} className="ld-context-back">
                <ArrowLeftIcon size={15} />
                <span>Lead Profile</span>
              </Link>
              <div className="ld-context-info">
                <strong>{activeLead.title}</strong>
                <span className="lg-muted">
                  {leadFullName(activeLead)} · {activeLead.companyName || activeLead.email}
                </span>
              </div>
              <div className="lg-badge-row">
                <Badge tone={statusTone(activeLead.status)}>{humanize(activeLead.status)}</Badge>
                <ScorePill score={activeLead.leadScore} />
                <span className="ld-context-value">{formatCurrency(activeLead.estimatedValue)}</span>
              </div>
            </div>

            <div className="ld-context-links">
              <NavLink
                to={`/leads/${activeLead.id}`}
                end
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Details
              </NavLink>
              <NavLink
                to={`/leads/${activeLead.id}/edit`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Edit
              </NavLink>
              <NavLink
                to={`/leads/${activeLead.id}/assignment`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Assignment
              </NavLink>
              <NavLink
                to={`/leads/${activeLead.id}/qualification`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Qualification
              </NavLink>
              <NavLink
                to={`/leads/${activeLead.id}/scoring`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Scoring
              </NavLink>
              <NavLink
                to={`/leads/${activeLead.id}/activities`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Activities
              </NavLink>
              <NavLink
                to={`/leads/${activeLead.id}/notes`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Notes
              </NavLink>
              <NavLink
                to={`/leads/${activeLead.id}/documents`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Documents
              </NavLink>
              <NavLink
                to={`/leads/${activeLead.id}/convert`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Convert
              </NavLink>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            {breadcrumbs && <div className="lg-breadcrumbs">{breadcrumbs}</div>}
            <h1 className="lg-title">
              <span className="lg-title-icon">{icon || <TargetIcon size={22} />}</span>
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

