import React from 'react';
import { NavLink } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { SearchIcon } from '../../../components/common/Icons';
import { SEARCH_SCOPE_META } from '../searchConstants';
import type { SearchScopeSlug } from '../../../types/search.types';

const SEARCH_NAV_ITEMS: Array<{
  slug: SearchScopeSlug;
  to: string;
  label: string;
  end?: boolean;
}> = [
  { slug: 'all', to: '/search', label: 'Search All', end: true },
  { slug: 'leads', to: '/search/leads', label: 'Leads' },
  { slug: 'contacts', to: '/search/contacts', label: 'Contacts' },
  { slug: 'companies', to: '/search/companies', label: 'Companies' },
  { slug: 'deals', to: '/search/deals', label: 'Deals' },
  { slug: 'activities', to: '/search/activities', label: 'Activities' },
  { slug: 'documents', to: '/search/documents', label: 'Documents' },
  { slug: 'notes', to: '/search/notes', label: 'Notes' },
  { slug: 'users', to: '/search/users', label: 'Users' },
];

interface SearchLayoutProps {
  scope: SearchScopeSlug;
  queryParam?: string;
  counts?: Record<string, number>;
  actions?: React.ReactNode;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const SearchLayout: React.FC<SearchLayoutProps> = ({
  scope,
  queryParam,
  counts,
  actions,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  children,
}) => {
  const meta = SEARCH_SCOPE_META[scope] || SEARCH_SCOPE_META.all;
  const qs = queryParam?.trim()
    ? `?q=${encodeURIComponent(queryParam.trim())}`
    : '';

  return (
    <div className="app-layout" id="global-search-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Category Sub-Navigation */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="Global Search categories navigation"
        >
          <div className="lg-subnav-group">
            <span className="lg-subnav-label">Search Scope</span>
            <div className="lg-subnav-links">
              {SEARCH_NAV_ITEMS.map((item) => {
                const entityType = SEARCH_SCOPE_META[item.slug]?.entityType;
                const count =
                  entityType && counts && counts[entityType] !== undefined
                    ? counts[entityType]
                    : undefined;

                return (
                  <NavLink
                    key={item.slug}
                    to={`${item.to}${qs}`}
                    end={item.end}
                    className={({ isActive }) =>
                      `lg-subnav-link ${isActive ? 'is-active' : ''}`
                    }
                  >
                    <span>{item.label}</span>
                    {count !== undefined && count > 0 && (
                      <span
                        style={{
                          marginLeft: '0.35rem',
                          padding: '0.05rem 0.4rem',
                          borderRadius: '999px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: 'rgba(59, 130, 246, 0.14)',
                          color: '#2563eb',
                        }}
                      >
                        {count}
                      </span>
                    )}
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
                <SearchIcon size={22} />
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

        {children}
      </main>
    </div>
  );
};

