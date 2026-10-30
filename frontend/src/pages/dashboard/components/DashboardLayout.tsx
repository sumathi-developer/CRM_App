import React from 'react';
import { NavLink } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { BarChart2Icon } from '../../../components/common/Icons';
import { DASHBOARD_SCREEN_META } from '../dashboardConstants';
import type { DashboardScreenSlug } from '../../../types/dashboard.types';

const DASHBOARD_NAV_ITEMS: Array<{
  slug: DashboardScreenSlug;
  to: string;
  label: string;
  end?: boolean;
}> = [
  { slug: 'overview', to: '/dashboard', label: 'Overview Dashboard', end: true },
  { slug: 'sales', to: '/dashboard/sales', label: 'Sales Dashboard' },
  { slug: 'leads', to: '/dashboard/leads', label: 'Lead Dashboard' },
  { slug: 'revenue', to: '/dashboard/revenue', label: 'Revenue Dashboard' },
  { slug: 'teams', to: '/dashboard/teams', label: 'Team Performance' },
  { slug: 'custom', to: '/dashboard/custom', label: 'Custom Dashboard' },
];

interface DashboardLayoutProps {
  screen: DashboardScreenSlug;
  actions?: React.ReactNode;
  filterBar?: React.ReactNode;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  screen,
  actions,
  filterBar,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  children,
}) => {
  const meta = DASHBOARD_SCREEN_META[screen] || DASHBOARD_SCREEN_META.overview;

  return (
    <div className="app-layout" id="dashboard-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Dashboard Sub-Navigation */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="CRM Dashboard module navigation"
        >
          <div className="lg-subnav-group">
            <span className="lg-subnav-label">Dashboards</span>
            <div className="lg-subnav-links">
              {DASHBOARD_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.slug}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `lg-subnav-link ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            <h1 className="lg-title">
              <span className="lg-title-icon">
                <BarChart2Icon size={22} />
              </span>
              <span>{meta.label}</span>
            </h1>
            <p className="lg-subtitle">{meta.subtitle}</p>
          </div>
          {actions && <div className="lg-header-actions">{actions}</div>}
        </header>

        {/* Alert Banners */}
        {error && (
          <div className="lg-alert-wrap">
            <ErrorMessage error={error} onDismiss={onDismissError} />
          </div>
        )}
        {success && (
          <div className="lg-alert-wrap">
            <SuccessMessage message={success} onDismiss={onDismissSuccess} />
          </div>
        )}

        {/* Filter Bar */}
        {filterBar}

        {children}
      </main>
    </div>
  );
};

