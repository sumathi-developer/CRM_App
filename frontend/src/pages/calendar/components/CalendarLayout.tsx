import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { ArrowLeftIcon, CalendarIcon } from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import { formatDateTime, humanize } from '../../lead-generation/leadGenConstants';
import type { CalendarEventItem } from '../../../types/calendar.types';
import {
  calendarEventTone,
  isCalendarEventOverdue,
} from '../calendarConstants';

interface NavGroup {
  label: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}

const CALENDAR_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Calendar Views',
    links: [
      { to: '/calendar', label: 'Calendar', end: true },
      { to: '/calendar/month', label: 'Month View' },
      { to: '/calendar/week', label: 'Week View' },
      { to: '/calendar/day', label: 'Day View' },
      { to: '/calendar/schedule', label: 'Schedule View' },
    ],
  },
  {
    label: 'Scheduling & Alerts',
    links: [
      { to: '/calendar/create', label: 'Create Event' },
      { to: '/calendar/meeting-scheduling', label: 'Meeting Scheduling' },
      { to: '/calendar/reminders', label: 'Reminders' },
    ],
  },
];

interface CalendarLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  activeEvent?: CalendarEventItem | null;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const CalendarLayout: React.FC<CalendarLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  activeEvent,
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

  const overdue = activeEvent ? isCalendarEventOverdue(activeEvent) : false;

  return (
    <div className="app-layout" id="calendar-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation */}
        <nav className="lg-subnav ld-subnav" aria-label="Calendar module navigation">
          {CALENDAR_NAV_GROUPS.map((group) => (
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

        {/* Active Event Context Strip */}
        {activeEvent && (
          <div className="lg-card ld-lead-context-strip">
            <div className="ld-context-main">
              <Link
                to={`/calendar/events/${activeEvent.id}?category=${activeEvent.category}`}
                className="ld-context-back"
              >
                <ArrowLeftIcon size={15} />
                <span>Event Record</span>
              </Link>
              <div className="ld-context-info">
                <strong>{activeEvent.title}</strong>
                <span className="lg-muted">
                  Scheduled: {formatDateTime(activeEvent.start)} · Assignee:{' '}
                  {activeEvent.assignedTo?.name || 'Unassigned'}
                </span>
              </div>
              <div className="lg-badge-row">
                <Badge tone={calendarEventTone(activeEvent.type)}>
                  {humanize(activeEvent.type)}
                </Badge>
                <Badge tone={overdue ? 'red' : 'blue'}>
                  {overdue ? 'OVERDUE' : humanize(activeEvent.status)}
                </Badge>
              </div>
            </div>

            <div className="ld-context-links">
              <NavLink
                to={`/calendar/events/${activeEvent.id}`}
                end
                className={({ isActive }) =>
                  `ld-context-tab ${isActive ? 'is-active' : ''}`
                }
              >
                Event Details
              </NavLink>
              {activeEvent.category !== 'DEAL' && (
                <NavLink
                  to={`/calendar/events/${activeEvent.id}/edit?category=${activeEvent.category}`}
                  className={({ isActive }) =>
                    `ld-context-tab ${isActive ? 'is-active' : ''}`
                  }
                >
                  Edit Event
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
                {icon || <CalendarIcon size={22} />}
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

