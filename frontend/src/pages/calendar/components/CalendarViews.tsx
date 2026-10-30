import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  CalendarEventItem,
  ReminderOffsetMinutes,
} from '../../../types/calendar.types';
import { Badge, SectionCard } from '../../lead-generation/components/Cards';
import { LoadingIndicator } from '../../../components/auth/LoadingIndicator';
import { EmptyState } from '../../../components/common/EmptyState';
import {
  formatDate,
  formatDateTime,
  humanize,
} from '../../lead-generation/leadGenConstants';
import {
  buildMonthGridDays,
  buildWeekDays,
  calendarEventTone,
  formatTimeOnly,
  getCalendarEventRelatedLinks,
  isCalendarEventOverdue,
  isSameCalendarDay,
  REMINDER_OFFSET_OPTIONS,
  toDateInputString,
  WEEKDAY_SHORT_LABELS,
} from '../calendarConstants';
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  ExternalLinkIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from '../../../components/common/Icons';

export interface SharedCalendarViewProps {
  focusDate: Date;
  events: CalendarEventItem[];
  isLoading: boolean;
  onSelectDate?: (date: Date) => void;
  onPreviewEvent: (event: CalendarEventItem) => void;
  onToggleComplete: (event: CalendarEventItem) => void;
  onDeleteEvent: (event: CalendarEventItem) => void;
  onCreateAtDate?: (dateIso: string) => void;
}

/* ============================================================================
   1. CALENDAR EVENT CARD
   ============================================================================ */

interface CalendarEventCardProps {
  event: CalendarEventItem;
  compact?: boolean;
  onPreview: (event: CalendarEventItem) => void;
  onToggleComplete: (event: CalendarEventItem) => void;
  onDelete: (event: CalendarEventItem) => void;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  compact = false,
  onPreview,
  onToggleComplete,
  onDelete,
}) => {
  const overdue = isCalendarEventOverdue(event);
  const isDone = (event.status || '').toUpperCase() === 'COMPLETED';
  const related = getCalendarEventRelatedLinks(event);

  if (compact) {
    return (
      <div
        className="ld-subcard"
        style={{
          padding: '0.55rem 0.7rem',
          borderLeft: `3px solid ${
            overdue
              ? '#dc2626'
              : isDone
                ? '#10b981'
                : event.type === 'MEETING'
                  ? '#8b5cf6'
                  : '#3b82f6'
          }`,
          cursor: 'pointer',
        }}
        onClick={() => onPreview(event)}
      >
        <div
          className="lg-badge-row"
          style={{ justifyContent: 'space-between', gap: '0.35rem' }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: isDone ? 'line-through' : undefined,
            }}
          >
            {event.allDay ? 'All Day' : formatTimeOnly(event.start)} · {event.title}
          </span>
          <Badge tone={calendarEventTone(event.type)}>
            {humanize(event.type)}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="ld-subcard">
      <div className="ld-subcard-top">
        <div className="lg-badge-row">
          <Badge tone={calendarEventTone(event.type)}>
            {humanize(event.type)}
          </Badge>
          <Badge tone={isDone ? 'green' : overdue ? 'red' : 'amber'}>
            {overdue ? 'OVERDUE' : humanize(event.status)}
          </Badge>
          {event.priority && (
            <Badge tone="slate">{humanize(event.priority)} Priority</Badge>
          )}
          <Link
            to={`/calendar/events/${event.id}?category=${event.category}`}
            className="lg-row-link"
            style={{
              fontSize: '0.98rem',
              textDecoration: isDone ? 'line-through' : undefined,
            }}
          >
            {event.title}
          </Link>
        </div>

        <div className="lg-row-actions">
          {event.category !== 'DEAL' && (
            <button
              type="button"
              className="auth-btn btn-secondary btn-size-small"
              onClick={() => onToggleComplete(event)}
            >
              <CheckCircleIcon size={14} />{' '}
              {isDone ? 'Reopen' : 'Complete'}
            </button>
          )}
          <button
            type="button"
            className="lg-icon-btn"
            title="Quick Preview"
            onClick={() => onPreview(event)}
          >
            <EyeIcon size={15} />
          </button>
          {event.category !== 'DEAL' && (
            <>
              <Link
                to={`/calendar/events/${event.id}/edit?category=${event.category}`}
                className="lg-icon-btn"
                title="Edit Event"
              >
                <EditIcon size={15} />
              </Link>
              <button
                type="button"
                className="lg-icon-btn danger"
                title="Delete Event"
                onClick={() => onDelete(event)}
              >
                <TrashIcon size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {event.description && (
        <p className="ld-subcard-body">{event.description}</p>
      )}

      <div className="ld-subcard-meta">
        <span>
          <ClockIcon size={13} />{' '}
          {event.allDay
            ? `All Day (${formatDate(event.start)})`
            : formatDateTime(event.start)}
        </span>
        <span>
          <UserIcon size={13} /> Assignee:{' '}
          {event.assignedTo?.name || 'Unassigned'}
        </span>
        {related.map((rec) => (
          <Link
            key={`${rec.entityType}-${rec.id}`}
            to={rec.path}
            className="lg-row-link"
          >
            <ExternalLinkIcon size={12} /> {rec.entityType}: {rec.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
   2. MONTH VIEW GRID
   ============================================================================ */

export const CalendarMonthGrid: React.FC<SharedCalendarViewProps> = ({
  focusDate,
  events,
  isLoading,
  onSelectDate,
  onPreviewEvent,
  onToggleComplete,
  onDeleteEvent,
  onCreateAtDate,
}) => {
  const [selectedDay, setSelectedDay] = useState<Date>(focusDate);

  const cells = useMemo(
    () => buildMonthGridDays(focusDate.getFullYear(), focusDate.getMonth() + 1),
    [focusDate],
  );

  const eventsByDateKey = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {};
    events.forEach((ev) => {
      const key = toDateInputString(new Date(ev.start));
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const selectedKey = toDateInputString(selectedDay);
  const selectedDayEvents = eventsByDateKey[selectedKey] || [];

  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="large" message="Loading monthly calendar..." />
      </div>
    );
  }

  return (
    <div className="ld-cards-stack">
      <div className="lg-card" style={{ padding: '1rem' }}>
        {/* Weekday header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '0.4rem',
            marginBottom: '0.5rem',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '0.82rem',
            color: '#64748b',
          }}
        >
          {WEEKDAY_SHORT_LABELS.map((dayLabel) => (
            <div key={dayLabel}>{dayLabel}</div>
          ))}
        </div>

        {/* 42-day grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '0.45rem',
          }}
        >
          {cells.map((cell) => {
            const dayEvents = eventsByDateKey[cell.dateKey] || [];
            const isSelected = isSameCalendarDay(cell.date, selectedDay);

            return (
              <div
                key={cell.dateKey}
                onClick={() => {
                  setSelectedDay(cell.date);
                  onSelectDate?.(cell.date);
                }}
                style={{
                  minHeight: '104px',
                  padding: '0.45rem',
                  borderRadius: '0.55rem',
                  border: isSelected
                    ? '2px solid #4f46e5'
                    : cell.isToday
                      ? '1.5px solid #3b82f6'
                      : '1px solid #e2e8f0',
                  background: cell.isCurrentMonth ? '#ffffff' : '#f8fafc',
                  opacity: cell.isCurrentMonth ? 1 : 0.6,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.28rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: cell.isToday ? 700 : 600,
                      color: cell.isToday ? '#2563eb' : '#1e293b',
                    }}
                  >
                    {cell.date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <Badge tone="blue">{dayEvents.length}</Badge>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.22rem',
                  }}
                >
                  {dayEvents.slice(0, 3).map((ev) => {
                    const isDone =
                      (ev.status || '').toUpperCase() === 'COMPLETED';
                    return (
                      <button
                        key={`${ev.category}-${ev.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewEvent(ev);
                        }}
                        style={{
                          textAlign: 'left',
                          fontSize: '0.73rem',
                          padding: '0.18rem 0.35rem',
                          borderRadius: '0.32rem',
                          border: 'none',
                          background: isDone
                            ? '#dcfce7'
                            : ev.type === 'MEETING'
                              ? '#ede9fe'
                              : '#dbeafe',
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                          textDecoration: isDone ? 'line-through' : undefined,
                        }}
                        title={`${ev.title} (${formatTimeOnly(ev.start)})`}
                      >
                        {ev.allDay ? '• ' : `${formatTimeOnly(ev.start)} `}
                        {ev.title}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#64748b',
                        fontWeight: 600,
                      }}
                    >
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Panel */}
      <SectionCard
        title={`Events on ${selectedDay.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })} (${selectedDayEvents.length})`}
        subtitle="Click any day cell above to inspect or schedule events for that date."
        actions={
          onCreateAtDate && (
            <button
              type="button"
              className="auth-btn btn-primary btn-size-small"
              onClick={() => onCreateAtDate(selectedKey)}
            >
              <PlusIcon size={14} /> Schedule on {selectedKey}
            </button>
          )
        }
      >
        {selectedDayEvents.length === 0 ? (
          <EmptyState
            title="No events scheduled for this day"
            description="Schedule a meeting, call, follow-up, or task on this date."
          />
        ) : (
          <div className="ld-cards-stack">
            {selectedDayEvents.map((ev) => (
              <CalendarEventCard
                key={`${ev.category}-${ev.id}`}
                event={ev}
                onPreview={onPreviewEvent}
                onToggleComplete={onToggleComplete}
                onDelete={onDeleteEvent}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

/* ============================================================================
   3. WEEK VIEW GRID
   ============================================================================ */

export const CalendarWeekGrid: React.FC<SharedCalendarViewProps> = ({
  focusDate,
  events,
  isLoading,
  onPreviewEvent,
  onToggleComplete,
  onDeleteEvent,
  onCreateAtDate,
}) => {
  const weekDays = useMemo(() => buildWeekDays(focusDate), [focusDate]);
  const today = new Date();

  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="large" message="Loading weekly calendar..." />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.75rem',
      }}
    >
      {weekDays.map((day) => {
        const key = toDateInputString(day);
        const isToday = isSameCalendarDay(day, today);
        const dayEvents = events.filter((ev) =>
          isSameCalendarDay(new Date(ev.start), day),
        );

        return (
          <div
            key={key}
            className="lg-card"
            style={{
              padding: '0.85rem',
              borderTop: isToday ? '3px solid #2563eb' : '3px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              minHeight: '320px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: isToday ? '#2563eb' : '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  {WEEKDAY_SHORT_LABELS[day.getDay()]}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {day.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>

              <div className="lg-badge-row">
                <Badge tone={isToday ? 'blue' : 'slate'}>
                  {dayEvents.length}
                </Badge>
                {onCreateAtDate && (
                  <button
                    type="button"
                    className="lg-icon-btn"
                    title={`Schedule event on ${key}`}
                    onClick={() => onCreateAtDate(key)}
                  >
                    <PlusIcon size={14} />
                  </button>
                )}
              </div>
            </div>

            {dayEvents.length === 0 ? (
              <p
                className="lg-muted"
                style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}
              >
                No scheduled events
              </p>
            ) : (
              <div className="ld-cards-stack">
                {dayEvents.map((ev) => (
                  <CalendarEventCard
                    key={`${ev.category}-${ev.id}`}
                    event={ev}
                    compact
                    onPreview={onPreviewEvent}
                    onToggleComplete={onToggleComplete}
                    onDelete={onDeleteEvent}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================================
   4. DAY TIMELINE VIEW
   ============================================================================ */

const DAY_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export const CalendarDayTimeline: React.FC<SharedCalendarViewProps> = ({
  focusDate,
  events,
  isLoading,
  onPreviewEvent,
  onToggleComplete,
  onDeleteEvent,
  onCreateAtDate,
}) => {
  const dayEvents = useMemo(
    () =>
      events.filter((ev) => isSameCalendarDay(new Date(ev.start), focusDate)),
    [events, focusDate],
  );

  const allDayEvents = dayEvents.filter((ev) => ev.allDay);
  const timedEvents = dayEvents.filter((ev) => !ev.allDay);

  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="large" message="Loading daily timeline..." />
      </div>
    );
  }

  const dateKey = toDateInputString(focusDate);

  return (
    <div className="ld-cards-stack">
      <SectionCard
        title={`All-Day Tasks & Milestones (${allDayEvents.length})`}
        subtitle="Tasks and deal closing dates scheduled for this day."
        actions={
          onCreateAtDate && (
            <button
              type="button"
              className="auth-btn btn-primary btn-size-small"
              onClick={() => onCreateAtDate(dateKey)}
            >
              <PlusIcon size={14} /> Add Event on {dateKey}
            </button>
          )
        }
      >
        {allDayEvents.length === 0 ? (
          <p className="lg-muted">No all-day tasks or milestones on this date.</p>
        ) : (
          <div className="ld-cards-stack">
            {allDayEvents.map((ev) => (
              <CalendarEventCard
                key={`${ev.category}-${ev.id}`}
                event={ev}
                onPreview={onPreviewEvent}
                onToggleComplete={onToggleComplete}
                onDelete={onDeleteEvent}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Hourly Day Schedule"
        subtitle="Chronological hourly slots for meetings, calls, follow-ups, and emails."
      >
        <div className="ld-cards-stack">
          {DAY_HOURS.map((hour) => {
            const slotEvents = timedEvents.filter((ev) => {
              const h = new Date(ev.start).getHours();
              if (hour === 8) return h <= 8;
              if (hour === 20) return h >= 20;
              return h === hour;
            });

            const hourLabel = `${String(hour).padStart(2, '0')}:00`;

            return (
              <div
                key={hour}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr',
                  gap: '0.85rem',
                  padding: '0.55rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    color: '#64748b',
                    paddingTop: '0.25rem',
                  }}
                >
                  {hourLabel}
                </div>

                <div>
                  {slotEvents.length === 0 ? (
                    <span className="lg-muted" style={{ fontSize: '0.8rem' }}>
                      Available slot
                    </span>
                  ) : (
                    <div className="ld-cards-stack">
                      {slotEvents.map((ev) => (
                        <CalendarEventCard
                          key={`${ev.category}-${ev.id}`}
                          event={ev}
                          onPreview={onPreviewEvent}
                          onToggleComplete={onToggleComplete}
                          onDelete={onDeleteEvent}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};

/* ============================================================================
   5. SCHEDULE / AGENDA VIEW
   ============================================================================ */

export const CalendarScheduleAgenda: React.FC<SharedCalendarViewProps> = ({
  events,
  isLoading,
  onPreviewEvent,
  onToggleComplete,
  onDeleteEvent,
}) => {
  const groupedByDate = useMemo(() => {
    const groups: Array<{ dateKey: string; dateObj: Date; items: CalendarEventItem[] }> =
      [];
    const map = new Map<
      string,
      { dateKey: string; dateObj: Date; items: CalendarEventItem[] }
    >();

    events.forEach((ev) => {
      const d = new Date(ev.start);
      const key = toDateInputString(d);
      if (!map.has(key)) {
        const entry = { dateKey: key, dateObj: d, items: [] };
        map.set(key, entry);
        groups.push(entry);
      }
      map.get(key)!.items.push(ev);
    });

    return groups;
  }, [events]);

  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="large" message="Loading schedule agenda..." />
      </div>
    );
  }

  if (groupedByDate.length === 0) {
    return (
      <div className="lg-card lg-state-box">
        <EmptyState
          title="No scheduled events in this range"
          description="Use the date navigation controls or schedule a new meeting, call, or task."
          action={
            <Link to="/calendar/create" className="auth-btn btn-primary">
              <PlusIcon size={15} /> Create Event
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="ld-cards-stack">
      {groupedByDate.map((group) => (
        <SectionCard
          key={group.dateKey}
          title={group.dateObj.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          subtitle={`${group.items.length} scheduled ${
            group.items.length === 1 ? 'event' : 'events'
          }`}
        >
          <div className="ld-cards-stack">
            {group.items.map((ev) => (
              <CalendarEventCard
                key={`${ev.category}-${ev.id}`}
                event={ev}
                onPreview={onPreviewEvent}
                onToggleComplete={onToggleComplete}
                onDelete={onDeleteEvent}
              />
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
};

/* ============================================================================
   6. EVENT QUICK PREVIEW DRAWER
   ============================================================================ */

interface CalendarEventQuickDrawerProps {
  event: CalendarEventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (event: CalendarEventItem) => void;
  onReminderChange?: (
    eventId: string,
    offsetMinutes: ReminderOffsetMinutes,
  ) => void;
}

export const CalendarEventQuickDrawer: React.FC<CalendarEventQuickDrawerProps> = ({
  event,
  isOpen,
  onClose,
  onToggleComplete,
  onReminderChange,
}) => {
  if (!isOpen || !event) return null;

  const overdue = isCalendarEventOverdue(event);
  const isDone = (event.status || '').toUpperCase() === 'COMPLETED';
  const related = getCalendarEventRelatedLinks(event);

  return (
    <div className="ld-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="ld-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Event preview: ${event.title}`}
      >
        <header className="ld-drawer-header">
          <div>
            <h3 className="ld-drawer-title">{event.title}</h3>
            <p className="ld-drawer-subtitle">
              {humanize(event.type)} · {formatDateTime(event.start)}
            </p>
          </div>
          <button
            type="button"
            className="lg-icon-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <XIcon size={18} />
          </button>
        </header>

        <div className="ld-drawer-body">
          <div className="ld-drawer-badges">
            <Badge tone={calendarEventTone(event.type)}>
              {humanize(event.type)}
            </Badge>
            <Badge tone={isDone ? 'green' : overdue ? 'red' : 'amber'}>
              {overdue ? 'OVERDUE' : humanize(event.status)}
            </Badge>
            {event.priority && (
              <Badge tone="slate">{humanize(event.priority)} Priority</Badge>
            )}
          </div>

          <div className="ld-drawer-section">
            <h4 className="ld-drawer-section-title">Event Schedule & Reminder</h4>
            <div className="ld-kv-list">
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <CalendarIcon size={13} /> Start Date & Time
                </span>
                <strong>{formatDateTime(event.start)}</strong>
              </div>
              {event.end && (
                <div className="ld-kv-row">
                  <span className="ld-kv-label">
                    <ClockIcon size={13} /> End / Completed
                  </span>
                  <span>{formatDateTime(event.end)}</span>
                </div>
              )}
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <UserIcon size={13} /> Assignee
                </span>
                <span>{event.assignedTo?.name || 'Unassigned'}</span>
              </div>
              {onReminderChange && (
                <div className="ld-kv-row">
                  <span className="ld-kv-label">Reminder Alert</span>
                  <select
                    className="lg-select ld-compact-select"
                    value={event.reminderMinutes ?? 15}
                    onChange={(e) =>
                      onReminderChange(
                        event.id,
                        Number(e.target.value) as ReminderOffsetMinutes,
                      )
                    }
                    aria-label="Event reminder timing"
                  >
                    {REMINDER_OFFSET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {event.description && (
            <div className="ld-drawer-section">
              <h4 className="ld-drawer-section-title">Description</h4>
              <p className="ld-subcard-body">{event.description}</p>
            </div>
          )}

          <div className="ld-drawer-section">
            <h4 className="ld-drawer-section-title">Related CRM Records</h4>
            {related.length === 0 ? (
              <p className="lg-muted">No linked Deal, Contact, or Lead.</p>
            ) : (
              <div className="ld-drawer-nav-grid">
                {related.map((rec) => (
                  <Link
                    key={`${rec.entityType}-${rec.id}`}
                    to={rec.path}
                    className="ld-drawer-nav-btn"
                    onClick={onClose}
                  >
                    <ExternalLinkIcon size={14} /> {rec.entityType}: {rec.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="ld-drawer-footer">
          {event.category !== 'DEAL' && (
            <button
              type="button"
              className="auth-btn btn-primary"
              onClick={() => {
                onToggleComplete(event);
                onClose();
              }}
            >
              <CheckCircleIcon size={15} />{' '}
              {isDone ? 'Reopen Event' : 'Mark Complete'}
            </button>
          )}
          {event.category !== 'DEAL' && (
            <Link
              to={`/calendar/events/${event.id}/edit?category=${event.category}`}
              className="auth-btn btn-secondary"
              onClick={onClose}
            >
              Edit Event
            </Link>
          )}
          <Link
            to={`/calendar/events/${event.id}?category=${event.category}`}
            className="auth-btn btn-secondary"
            onClick={onClose}
          >
            <ArrowRightIcon size={14} /> Event Details
          </Link>
        </footer>
      </aside>
    </div>
  );
};

