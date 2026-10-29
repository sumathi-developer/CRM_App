import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { DollarSignIcon, ArrowLeftIcon } from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import { formatCurrency } from '../../lead-generation/leadGenConstants';
import { dealStatusTone, probabilityTone } from '../../pipelines/pipelineConstants';
import type { Deal } from '../../../types/deal.types';

interface NavGroup {
  label: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}

const DEALS_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Views',
    links: [
      { to: '/deals', label: 'All Deals', end: true },
      { to: '/deals/my', label: 'My Deals' },
      { to: '/deals/list', label: 'Deal List' },
      { to: '/deals/board', label: 'Deal Board' },
      { to: '/deals/table', label: 'Deal Table' },
    ],
  },
  {
    label: 'Outcomes',
    links: [
      { to: '/deals/won', label: 'Won Deals' },
      { to: '/deals/lost', label: 'Lost Deals' },
      { to: '/deals/create', label: 'Create Deal' },
    ],
  },
  {
    label: 'Engagement',
    links: [
      { to: '/deals/activities', label: 'Activities' },
      { to: '/deals/notes', label: 'Notes' },
      { to: '/deals/documents', label: 'Documents' },
    ],
  },
  {
    label: 'Configuration',
    links: [{ to: '/deals/settings', label: 'Deal Settings' }],
  },
];

interface DealsLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  activeDeal?: Deal | null;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const DealsLayout: React.FC<DealsLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  activeDeal,
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
    <div className="app-layout" id="deals-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation */}
        <nav className="lg-subnav ld-subnav" aria-label="Deals module navigation">
          {DEALS_NAV_GROUPS.map((group) => (
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

        {/* Active Deal Context Strip */}
        {activeDeal && (
          <div className="lg-card ld-lead-context-strip">
            <div className="ld-context-main">
              <Link to={`/deals/${activeDeal.id}`} className="ld-context-back">
                <ArrowLeftIcon size={15} />
                <span>Deal Profile</span>
              </Link>
              <div className="ld-context-info">
                <strong>{activeDeal.title}</strong>
                <span className="lg-muted">
                  {activeDeal.organization?.name ||
                    (activeDeal.contact
                      ? `${activeDeal.contact.firstName} ${activeDeal.contact.lastName}`
                      : 'Direct Opportunity')}{' '}
                  · {activeDeal.pipeline?.name || 'Default Pipeline'}
                </span>
              </div>
              <div className="lg-badge-row">
                <Badge tone={dealStatusTone(activeDeal.status)}>{activeDeal.status}</Badge>
                {activeDeal.stage?.name && (
                  <Badge tone="blue">{activeDeal.stage.name}</Badge>
                )}
                <Badge tone={probabilityTone(activeDeal.probability)}>
                  {activeDeal.probability}% Prob
                </Badge>
                <span className="ld-context-value">{formatCurrency(activeDeal.value)}</span>
              </div>
            </div>

            <div className="ld-context-links">
              <NavLink
                to={`/deals/${activeDeal.id}`}
                end
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Details
              </NavLink>
              <NavLink
                to={`/deals/${activeDeal.id}/edit`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Edit
              </NavLink>
              <NavLink
                to={`/deals/${activeDeal.id}/activities`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Activities
              </NavLink>
              <NavLink
                to={`/deals/${activeDeal.id}/notes`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Notes
              </NavLink>
              <NavLink
                to={`/deals/${activeDeal.id}/documents`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Documents
              </NavLink>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            {breadcrumbs && <div className="lg-breadcrumbs">{breadcrumbs}</div>}
            <h1 className="lg-title">
              <span className="lg-title-icon">{icon || <DollarSignIcon size={22} />}</span>
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

