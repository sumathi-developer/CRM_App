import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { ActivityIcon, ArrowLeftIcon } from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import { formatDateTime, humanize } from '../../lead-generation/leadGenConstants';
import type { ActivityRecord } from '../../../types/activity.types';
import {
  activityRecordPriorityTone,
  activityRecordStatusTone,
  activityTypeTone,
  isActivityOverdue,
} from '../activityConstants';

interface NavGroup {
  label: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}

const ACTIVITIES_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Scopes',
    links: [
      { to: '/activities', label: 'All Activities', end: true },
      { to: '/activities/my', label: 'My Activities' },
    ],
  },
  {
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
    label: 'Status & Schedule',
    links: [
      { to: '/activities/completed', label: 'Completed' },
      { to: '/activities/overdue', label: 'Overdue' },
    ],
  },
  {
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

  const overdue = activeActivity ? isActivityOverdue(activeActivity) : false;

  return (
    <div className="app-layout" id="activities-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation */}
        <nav className="lg-subnav ld-subnav" aria-label="Activities module navigation">
          {ACTIVITIES_NAV_GROUPS.map((group) => (
            <div key={group.label} className="lg-subnav-group">
              <span className="lg-subnav-label">{group.label}</span>
              <div className="lg-subnav-links">
                {group.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `lg-subnav-link ${isActive ? 'is-active' : ''}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
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

