import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { DealsIcon, ArrowLeftIcon, ChevronDownIcon, CheckIcon } from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import { formatCurrency } from '../../lead-generation/leadGenConstants';
import { dealStatusTone, probabilityTone } from '../../pipelines/pipelineConstants';
import type { Deal } from '../../../types/deal.types';

interface NavLinkItem {
  to: string;
  label: string;
  end?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  links: NavLinkItem[];
}

const DEALS_NAV_GROUPS: NavGroup[] = [
  {
    id: 'views',
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
    id: 'outcomes',
    label: 'Outcomes',
    links: [
      { to: '/deals/won', label: 'Won Deals' },
      { to: '/deals/lost', label: 'Lost Deals' },
      { to: '/deals/create', label: 'Create Deal' },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    links: [
      { to: '/deals/activities', label: 'Activities' },
      { to: '/deals/notes', label: 'Notes' },
      { to: '/deals/documents', label: 'Documents' },
    ],
  },
  {
    id: 'configuration',
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

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  // Ensure the page always opens at the very top of the page
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScroll = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      } catch {
        window.scrollTo(0, 0);
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const shellEl = document.getElementById('deals-module-shell');
      if (shellEl) {
        shellEl.scrollTop = 0;
      }
      const mainEl = document.querySelector('.app-main-content');
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
    };

    resetScroll();
    const rafId = requestAnimationFrame(resetScroll);
    const t1 = setTimeout(resetScroll, 50);
    const t2 = setTimeout(resetScroll, 150);
    const t3 = setTimeout(resetScroll, 300);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname, location.search]);

  const isLinkActive = (to: string, end?: boolean) => {
    if (end) {
      return location.pathname === to;
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <div className="app-layout" id="deals-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation: Horizontal Dropdown Navigation */}
        <nav
          ref={navRef}
          className="lg-subnav ld-subnav ld-dropdown-nav"
          aria-label="Deals module navigation"
        >
          {DEALS_NAV_GROUPS.map((group) => {
            const activeItem = group.links.find((l) => isLinkActive(l.to, l.end));
            const isGroupActive = Boolean(activeItem);
            const isOpen = openDropdown === group.id;

            return (
              <div key={group.id} className="ld-nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`ld-nav-dropdown-trigger ${isGroupActive ? 'is-active' : ''} ${isOpen ? 'is-open' : ''}`}
                  onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  <span className="ld-nav-dropdown-label">{group.label}</span>
                  {activeItem && (
                    <span className="ld-nav-dropdown-active-badge">
                      {activeItem.label}
                    </span>
                  )}
                  <ChevronDownIcon
                    size={14}
                    className={`ld-nav-dropdown-chevron ${isOpen ? 'is-open' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="ld-nav-dropdown-menu" role="menu">
                    {group.links.map((link) => {
                      const isActive = isLinkActive(link.to, link.end);
                      return (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          end={link.end}
                          className={`ld-nav-dropdown-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => setOpenDropdown(null)}
                          role="menuitem"
                        >
                          <span className="ld-nav-dropdown-item-label">{link.label}</span>
                          {isActive && (
                            <CheckIcon size={14} className="ld-nav-dropdown-check" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
              <span className="lg-title-icon">{icon || <DealsIcon size={22} />}</span>
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

