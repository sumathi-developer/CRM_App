import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { TargetIcon } from '../../../components/common/Icons';
import { CHANNELS } from '../leadGenConstants';

interface NavGroup {
  label: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Capture',
    links: [
      { to: '/lead-generation', label: 'Overview', end: true },
      { to: '/lead-generation/sources', label: 'Lead Sources' },
      { to: '/lead-generation/forms', label: 'Web Forms' },
      { to: '/lead-generation/capture-forms', label: 'Capture Forms' },
      { to: '/lead-generation/manual-capture', label: 'Manual Capture' },
    ],
  },
  {
    label: 'Channels',
    links: CHANNELS.map((c) => ({ to: `/lead-generation/leads/${c.path}`, label: c.label })),
  },
  {
    label: 'Automation',
    links: [
      { to: '/lead-generation/scoring', label: 'Scoring' },
      { to: '/lead-generation/qualification', label: 'Qualification' },
      { to: '/lead-generation/routing', label: 'Routing' },
      { to: '/lead-generation/assignment-rules', label: 'Assignment Rules' },
    ],
  },
  {
    label: 'Analytics',
    links: [
      { to: '/lead-generation/analytics', label: 'Generation', end: true },
      { to: '/lead-generation/analytics/sources', label: 'Sources' },
    ],
  },
];

interface LeadGenLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  error?: string | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

/** Shared page shell: top navbar, module sub-navigation, header and alert banners. */
export const LeadGenLayout: React.FC<LeadGenLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
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
    <div className="app-layout">
      <Navbar />

      <main className="app-main-content lg-page">
        <nav className="lg-subnav" aria-label="Lead generation navigation">
          {NAV_GROUPS.map((group) => (
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
