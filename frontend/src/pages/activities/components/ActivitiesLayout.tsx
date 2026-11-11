import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import {
  ActivityIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  CheckIcon,
} from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import { formatDateTime, humanize } from '../../lead-generation/leadGenConstants';
import type { ActivityRecord } from '../../../types/activity.types';
import {
  activityRecordPriorityTone,
  activityRecordStatusTone,
  activityTypeTone,
  isActivityOverdue,
} from '../activityConstants';

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

const ACTIVITIES_NAV_GROUPS: NavGroup[] = [
  {
    id: 'scope',
    label: 'Scope',
    links: [
      { to: '/activities', label: 'All Activities', end: true },
      { to: '/activities/my', label: 'My Activities' },
    ],
  },
  {
    id: 'types',
    label: 'Activity Types',
    links: [
      { to: '/activities/tasks', label: 'Tasks' },
      { to: '/activities/calls', label: 'Calls' },
      { to: '/activities/meetings', label: 'Meetings' },
      { to: '/activities/follow-ups', label: 'Follow-ups' },
      { to: '/activities/emails', label: 'Emails' },
    ],
  },
  {
    id: 'status',
    label: 'Status & Schedule',
    links: [
      { to: '/activities/completed', label: 'Completed' },
      { to: '/activities/overdue', label: 'Overdue' },
    ],
  },
  {
    id: 'actions',
    label: 'Actions',
    links: [{ to: '/activities/create', label: 'Create Activity' }],
  },
];

interface ActivitiesLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  activeActivity?: ActivityRecord | null;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const ActivitiesLayout: React.FC<ActivitiesLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  activeActivity,
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

  const isLinkActive = (to: string, end?: boolean) => {
    if (end) {
      return location.pathname === to;
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const overdue = activeActivity ? isActivityOverdue(activeActivity) : false;

  return (
    <div className="app-layout" id="activities-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation: Horizontal Dropdown Navigation */}
        <nav
          ref={navRef}
          className="lg-subnav ld-subnav ld-dropdown-nav"
          aria-label="Activities module navigation"
        >
          {ACTIVITIES_NAV_GROUPS.map((group) => {
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

        {/* Active Activity Context Strip */}
        {activeActivity && (
          <div className="lg-card ld-lead-context-strip">
            <div className="ld-context-main">
              <Link
                to={`/activities/${activeActivity.id}?source=${activeActivity.recordSource}`}
                className="ld-context-back"
              >
                <ArrowLeftIcon size={15} />
                <span>Activity Record</span>
              </Link>
              <div className="ld-context-info">
                <strong>{activeActivity.subject}</strong>
                <span className="lg-muted">
                  {activeActivity.scheduledAt
                    ? `Due: ${formatDateTime(activeActivity.scheduledAt)}`
                    : 'No due date set'}{' '}
                  · Assignee: {activeActivity.assignedTo?.name || 'Unassigned'}
                </span>
              </div>
              <div className="lg-badge-row">
                <Badge tone={activityTypeTone(activeActivity.type)}>
                  {humanize(activeActivity.type)}
                </Badge>
                <Badge tone={activityRecordStatusTone(activeActivity.status, overdue)}>
                  {overdue ? 'OVERDUE' : humanize(activeActivity.status)}
                </Badge>
                <Badge tone={activityRecordPriorityTone(activeActivity.priority)}>
                  {humanize(activeActivity.priority)} Priority
                </Badge>
              </div>
            </div>

            <div className="ld-context-links">
              <NavLink
                to={`/activities/${activeActivity.id}`}
                end
                className={({ isActive }) =>
                  `ld-context-tab ${isActive ? 'is-active' : ''}`
                }
              >
                Details
              </NavLink>
              <NavLink
                to={`/activities/${activeActivity.id}/edit?source=${activeActivity.recordSource}`}
                className={({ isActive }) =>
                  `ld-context-tab ${isActive ? 'is-active' : ''}`
                }
              >
                Edit Activity
              </NavLink>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            {breadcrumbs && <div className="lg-breadcrumbs">{breadcrumbs}</div>}
            <h1 className="lg-title">
              <span className="lg-title-icon">{icon || <ActivityIcon size={22} />}</span>
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

