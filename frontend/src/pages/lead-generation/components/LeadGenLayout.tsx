import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { TargetIcon, ChevronDownIcon, CheckIcon } from '../../../components/common/Icons';
import { CHANNELS } from '../leadGenConstants';

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

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'capture',
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
    id: 'channels',
    label: 'Channels',
    links: CHANNELS.map((c) => ({ to: `/lead-generation/leads/${c.path}`, label: c.label })),
  },
  {
    id: 'automation',
    label: 'Automation',
    links: [
      { to: '/lead-generation/scoring', label: 'Scoring' },
      { to: '/lead-generation/qualification', label: 'Qualification' },
      { to: '/lead-generation/routing', label: 'Routing' },
      { to: '/lead-generation/assignment-rules', label: 'Assignment Rules' },
    ],
  },
  {
    id: 'analytics',
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
      const shellEl = document.getElementById('leadgen-module-shell');
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

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location.pathname, location.search]);

  const isLinkActive = (to: string, end?: boolean) => {
    if (end) {
      return location.pathname === to;
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <div className="app-layout" id="leadgen-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation: Horizontal Dropdown Navigation */}
        <nav
          ref={navRef}
          className="lg-subnav ld-subnav ld-dropdown-nav"
          aria-label="Lead generation navigation"
        >
          {NAV_GROUPS.map((group) => {
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
