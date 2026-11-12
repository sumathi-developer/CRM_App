import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  MailIcon,
} from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import { formatDateTime } from '../../lead-generation/leadGenConstants';
import type { EmailMessageItem } from '../../../types/communication.types';
import { emailStatusTone } from '../communicationConstants';

interface NavGroup {
  id: string;
  label: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}

const COMMUNICATIONS_NAV_GROUPS: NavGroup[] = [
  {
    id: 'email-folders',
    label: 'Email & Folders',
    links: [
      { to: '/communications', label: 'Communication Center', end: true },
      { to: '/communications/emails', label: 'Emails' },
      { to: '/communications/inbox', label: 'Email Inbox' },
      { to: '/communications/sent', label: 'Sent Emails' },
      { to: '/communications/compose', label: 'Compose Email' },
    ],
  },
  {
    id: 'collaboration-templates',
    label: 'Collaboration & Templates',
    links: [
      { to: '/communications/comments', label: 'Internal Comments' },
      { to: '/communications/mentions', label: 'Mentions' },
      { to: '/communications/history', label: 'Communication History' },
      { to: '/communications/templates', label: 'Templates' },
    ],
  },
];

interface CommunicationsLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  activeEmail?: EmailMessageItem | null;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const CommunicationsLayout: React.FC<CommunicationsLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  activeEmail,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const flash = (location.state as { flash?: string } | null)?.flash;
  const [flashDismissed, setFlashDismissed] = useState(false);
  const successMessage = success || (flashDismissed ? null : flash) || null;

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnterGroup = (group: NavGroup) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setOpenDropdown(group.id);
  };

  const handleMouseLeaveGroup = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  const handleTriggerClick = (group: NavGroup) => {
    const activeItem = group.links.find((l) => isLinkActive(l.to, l.end));
    const target = activeItem ? activeItem.to : group.links[0]?.to;
    if (target && location.pathname !== target) {
      navigate(target);
    }
    setOpenDropdown(null);
  };

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
      const shellEl = document.getElementById('communications-module-shell');
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
    if (end || to === '/communications') {
      return location.pathname === to || location.pathname === `${to}/`;
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <div className="app-layout" id="communications-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation: Horizontal Dropdown Navigation */}
        <nav
          ref={navRef}
          className="lg-subnav ld-subnav ld-dropdown-nav"
          aria-label="Communications module navigation"
        >
          {COMMUNICATIONS_NAV_GROUPS.map((group) => {
            const activeItem = group.links.find((l) => isLinkActive(l.to, l.end));
            const isGroupActive = Boolean(activeItem);
            const isOpen = openDropdown === group.id;

            return (
              <div
                key={group.id}
                className="ld-nav-dropdown-wrapper"
                onMouseEnter={() => handleMouseEnterGroup(group)}
                onMouseLeave={handleMouseLeaveGroup}
              >
                <button
                  type="button"
                  className={`ld-nav-dropdown-trigger ${isGroupActive ? 'is-active' : ''} ${isOpen ? 'is-open' : ''}`}
                  onClick={() => handleTriggerClick(group)}
                  onFocus={() => handleMouseEnterGroup(group)}
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
                  <div
                    className="ld-nav-dropdown-menu"
                    role="menu"
                    onMouseEnter={() => {
                      if (hoverTimerRef.current) {
                        clearTimeout(hoverTimerRef.current);
                        hoverTimerRef.current = null;
                      }
                    }}
                    onMouseLeave={handleMouseLeaveGroup}
                  >
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

        {/* Active Email Context Strip */}
        {activeEmail && (
          <div className="lg-card ld-lead-context-strip">
            <div className="ld-context-main">
              <Link to="/communications/emails" className="ld-context-back">
                <ArrowLeftIcon size={15} />
                <span>All Emails</span>
              </Link>
              <div className="ld-context-info">
                <strong>{activeEmail.subject}</strong>
                <span className="lg-muted">
                  From: {activeEmail.senderName || activeEmail.sender} ·{' '}
                  {formatDateTime(activeEmail.createdAt)}
                </span>
              </div>
              <div className="lg-badge-row">
                <Badge tone="slate">{activeEmail.folder}</Badge>
                <Badge tone={emailStatusTone(activeEmail.status)}>
                  {activeEmail.status}
                </Badge>
              </div>
            </div>

            <div className="ld-context-links">
              <NavLink
                to={`/communications/emails/${activeEmail.id}`}
                end
                className={({ isActive }) =>
                  `ld-context-tab ${isActive ? 'is-active' : ''}`
                }
              >
                Email Details & Thread
              </NavLink>
              {activeEmail.isDraft && (
                <NavLink
                  to={`/communications/compose?draftId=${activeEmail.id}`}
                  className={({ isActive }) =>
                    `ld-context-tab ${isActive ? 'is-active' : ''}`
                  }
                >
                  Edit Draft
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            {breadcrumbs && <div className="lg-breadcrumbs">{breadcrumbs}</div>}
            <h1 className="lg-title">
              <span className="lg-title-icon">
                {icon || <MailIcon size={22} />}
              </span>
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

