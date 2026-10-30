import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { TrendingUpIcon } from '../../../components/common/Icons';
import {
  ANALYTICS_SCREEN_META,
  type AnalyticsScreenSlug,
} from '../analyticsConstants';

const ANALYTICS_NAV_ITEMS: Array<{
  slug: AnalyticsScreenSlug;
  to: string;
  label: string;
}> = [
  { slug: 'sales', to: '/analytics/sales', label: 'Sales Analytics' },
  { slug: 'leads', to: '/analytics/leads', label: 'Lead Analytics' },
  {
    slug: 'lead-sources',
    to: '/analytics/lead-sources',
    label: 'Lead Source Analytics',
  },
  { slug: 'pipeline', to: '/analytics/pipeline', label: 'Pipeline Analytics' },
  { slug: 'revenue', to: '/analytics/revenue', label: 'Revenue Analytics' },
  {
    slug: 'conversion',
    to: '/analytics/conversion',
    label: 'Conversion Analytics',
  },
  {
    slug: 'activities',
    to: '/analytics/activities',
    label: 'Activity Analytics',
  },
  { slug: 'teams', to: '/analytics/teams', label: 'Team Analytics' },
  {
    slug: 'performance',
    to: '/analytics/performance',
    label: 'Performance Analytics',
  },
];

interface AnalyticsLayoutProps {
  screen: AnalyticsScreenSlug;
  actions?: React.ReactNode;
  filterBar?: React.ReactNode;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const AnalyticsLayout: React.FC<AnalyticsLayoutProps> = ({
  screen,
  actions,
  filterBar,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  children,
}) => {
  const location = useLocation();
  const meta = ANALYTICS_SCREEN_META[screen] || ANALYTICS_SCREEN_META.sales;

  return (
    <div className="app-layout" id="analytics-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Sub-Navigation across all 9 Analytics screens */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="CRM Analytics screens navigation"
        >
          <div className="lg-subnav-group">
            <span className="lg-subnav-label">Analytics</span>
            <div className="lg-subnav-links">
              {ANALYTICS_NAV_ITEMS.map((item) => {
                const isRootSales =
                  item.slug === 'sales' && location.pathname === '/analytics';
                return (
                  <NavLink
                    key={item.slug}
                    to={item.to}
                    className={({ isActive }) =>
                      `lg-subnav-link ${isActive || isRootSales ? 'is-active' : ''}`
                    }
                  >
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            <h1 className="lg-title">
              <span className="lg-title-icon">
                <TrendingUpIcon size={22} />
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

        {/* Filter & Comparison Controls Bar */}
        {filterBar}

        {children}
      </main>
    </div>
  );
};

