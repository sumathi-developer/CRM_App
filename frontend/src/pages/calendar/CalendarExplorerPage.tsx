import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { calendarService } from '../../services/calendar.service';
import type {
  CalendarEventItem,
  CalendarSummaryResponse,
  CalendarUserRef,
  CalendarViewMode,
  ReminderOffsetMinutes,
} from '../../types/calendar.types';
import { CalendarLayout } from './components/CalendarLayout';
import {
  CalendarDayTimeline,
  CalendarEventQuickDrawer,
  CalendarMonthGrid,
  CalendarScheduleAgenda,
  CalendarWeekGrid,
} from './components/CalendarViews';
import {
  buildWeekDays,
  CALENDAR_EVENT_TYPE_OPTIONS,
  formatCalendarHeaderRange,
  stepCalendarDate,
  toDateInputString,
} from './calendarConstants';
import { ACTIVITY_RECORD_STATUS_OPTIONS } from '../activities/activityConstants';
import { StatCard } from '../lead-generation/components/Cards';
import { FilterBar, SearchInput } from '../lead-generation/components/FilterBar';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
} from '../../components/common/Icons';

export interface CalendarExplorerPageProps {
  forcedView?: CalendarViewMode;
}

export const CalendarExplorerPage: React.FC<CalendarExplorerPageProps> = ({
  forcedView,
}) => {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<CalendarViewMode>(
    forcedView || 'month',
  );
  const [focusDate, setFocusDate] = useState<Date>(() => new Date());

  useEffect(() => {
    if (forcedView) {
      setViewMode(forcedView);
    }
  }, [forcedView]);

  const [users, setUsers] = useState<CalendarUserRef[]>([]);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [summary, setSummary] = useState<CalendarSummaryResponse>({
    todayCount: 0,
    weekCount: 0,
    overdueCount: 0,
    upcomingMeetingsCount: 0,
    todayEvents: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const [previewEvent, setPreviewEvent] = useState<CalendarEventItem | null>(
    null,
  );
  const [deletingEvent, setDeletingEvent] = useState<CalendarEventItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // In-memory cache for instant transitions across views and dates
  const eventsCacheRef = React.useRef<Map<string, CalendarEventItem[]>>(new Map());

  useEffect(() => {
    let active = true;
    calendarService
      .getAssignableUsers()
      .then((list) => {
        if (active) setUsers(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Fetch KPI summary asynchronously in background without blocking calendar views
  const loadSummaryData = useCallback(async () => {
    try {
      const res = await calendarService.getSummary(userFilter || undefined);
      setSummary(res);
    } catch {
      // Non-fatal summary fallback
    }
  }, [userFilter]);

  useEffect(() => {
    loadSummaryData();
  }, [loadSummaryData]);

  const focusYear = focusDate.getFullYear();
  const focusMonth = focusDate.getMonth() + 1;
  const focusDateIso = toDateInputString(focusDate);

  const loadCalendarData = useCallback(
    async (forceFresh = false) => {
      const cacheKey = `${viewMode}:${focusYear}-${focusMonth}:${focusDateIso}:${userFilter}`;
      const cached = !forceFresh ? eventsCacheRef.current.get(cacheKey) : undefined;

      if (cached) {
        // Instant render from cache (0ms perceived latency)
        setEvents(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      setError(null);
      try {
        let eventsPromise: Promise<CalendarEventItem[]>;

        if (viewMode === 'month') {
          eventsPromise = calendarService
            .getMonthView({
              year: focusYear,
              month: focusMonth,
              userId: userFilter || undefined,
            })
            .then((r) => r.events);
        } else if (viewMode === 'week') {
          eventsPromise = calendarService
            .getWeekView({
              date: focusDateIso,
              userId: userFilter || undefined,
            })
            .then((r) => r.events);
        } else if (viewMode === 'day') {
          eventsPromise = calendarService
            .getDayView({
              date: focusDateIso,
              userId: userFilter || undefined,
            })
            .then((r) => r.events);
        } else {
          // Schedule view: 30-day window starting from beginning of current week
          const weekDays = buildWeekDays(new Date(focusDateIso));
          const start = weekDays[0];
          const end = new Date(start);
          end.setDate(start.getDate() + 30);
          end.setHours(23, 59, 59, 999);
          eventsPromise = calendarService.getEvents({
            start: start.toISOString(),
            end: end.toISOString(),
            userId: userFilter || undefined,
          });
        }

        const eventList = await eventsPromise;
        eventsCacheRef.current.set(cacheKey, eventList);
        setEvents(eventList);
      } catch (err: any) {
        if (!cached) {
          setError(err?.message || 'Failed to load calendar events.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [viewMode, focusYear, focusMonth, focusDateIso, userFilter],
  );

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      if (typeFilter && (ev.type || '').toUpperCase() !== typeFilter) {
        return false;
      }
      if (statusFilter && (ev.status || '').toUpperCase() !== statusFilter) {
        return false;
      }
      if (q) {
        const hay = [
          ev.title,
          ev.description || '',
          ev.type,
          ev.assignedTo?.name || '',
          ev.contact?.firstName || '',
          ev.contact?.lastName || '',
          ev.deal?.title || '',
          ev.lead?.title || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, search, typeFilter, statusFilter]);

  const handleToggleComplete = async (event: CalendarEventItem) => {
    try {
      const updated = await calendarService.toggleEventComplete(event);
      setBannerMessage(
        updated.status === 'COMPLETED'
          ? `Marked "${event.title}" as completed.`
          : `Reopened "${event.title}".`,
      );
      eventsCacheRef.current.clear();
      await Promise.all([loadCalendarData(true), loadSummaryData()]);
    } catch (err: any) {
      setError(err?.message || 'Failed to update event status.');
    }
  };

  const handleReminderChange = (
    eventId: string,
    offsetMinutes: ReminderOffsetMinutes,
  ) => {
    calendarService.setEventReminderOffset(eventId, offsetMinutes);
    setPreviewEvent((prev) =>
      prev && prev.id === eventId
        ? { ...prev, reminderMinutes: offsetMinutes }
        : prev,
    );
    setBannerMessage('Event reminder preference updated.');
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      await calendarService.deleteEvent(
        deletingEvent.id,
        deletingEvent.category,
      );
      setBannerMessage(`Deleted event "${deletingEvent.title}".`);
      setDeletingEvent(null);
      eventsCacheRef.current.clear();
      await Promise.all([loadCalendarData(true), loadSummaryData()]);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete event.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(
    search || typeFilter || statusFilter || userFilter,
  );

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setUserFilter('');
  };

  const pageTitle = useMemo(() => {
    if (forcedView === 'day') return 'Day View';
    if (forcedView === 'week') return 'Week View';
    if (forcedView === 'month') return 'Month View';
    if (forcedView === 'schedule') return 'Schedule View';
    return 'Calendar';
  }, [forcedView]);

  const pageSubtitle = useMemo(() => {
    if (forcedView === 'day') {
      return 'Hourly daily schedule and all-day tasks for focused day planning.';
    }
    if (forcedView === 'week') {
      return '7-day weekly calendar board across meetings, calls, tasks, and deal milestones.';
    }
    if (forcedView === 'month') {
      return 'Full monthly calendar grid with daily event counts and selected-day agenda.';
    }
    if (forcedView === 'schedule') {
      return 'Chronological itinerary of upcoming meetings, calls, follow-ups, tasks, and deal closings.';
    }
    return 'Navigate dates, switch between Month, Week, Day, and Schedule views, and manage scheduled CRM events.';
  }, [forcedView]);

  return (
    <CalendarLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          {/* View Mode Switcher */}
          <div
            className="ld-view-switcher"
            role="group"
            aria-label="Calendar view mode"
          >
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'schedule' ? 'active' : ''}`}
              onClick={() => setViewMode('schedule')}
            >
              Schedule
            </button>
          </div>

          <Link
            to="/calendar/meeting-scheduling"
            className="auth-btn btn-secondary btn-size-small"
          >
            <ClockIcon size={15} /> Schedule Meeting
          </Link>

          <Link
            to={`/calendar/create?date=${focusDateIso}`}
            className="auth-btn btn-primary btn-size-small"
          >
            <PlusIcon size={15} /> Create Event
          </Link>
        </div>
      }
    >
      {/* KPI Summary Cards */}
      <div className="lg-stat-grid">
        <StatCard
          label="Today's Schedule"
          value={summary.todayCount}
          hint="Events scheduled for today"
          tone="blue"
          icon={<CalendarIcon size={18} />}
        />
        <StatCard
          label="This Week"
          value={summary.weekCount}
          hint="Total events in current week"
          tone="purple"
          icon={<ActivityIcon size={18} />}
        />
        <StatCard
          label="Upcoming Meetings"
          value={summary.upcomingMeetingsCount}
          hint="Scheduled client & team meetings"
          tone="green"
          icon={<ClockIcon size={18} />}
        />
        <StatCard
          label="Overdue Events"
          value={summary.overdueCount}
          hint="Past due and still pending"
          tone={summary.overdueCount > 0 ? 'red' : 'slate'}
          icon={<AlertCircleIcon size={18} />}
        />
      </div>

      {/* Date Navigation Bar */}
      <div className="lg-card ld-cal-nav-toolbar">
        {/* Left: Nav Buttons & Jump to Date */}
        <div className="ld-cal-nav-left">
          <button
            type="button"
            className="ld-cal-nav-btn"
            onClick={() =>
              setFocusDate((prev) => stepCalendarDate(prev, viewMode, -1))
            }
            aria-label="Previous period"
          >
            <ArrowLeftIcon size={14} /> Prev
          </button>
          <button
            type="button"
            className="ld-cal-nav-btn"
            onClick={() => setFocusDate(new Date())}
            aria-label="Jump to today"
          >
            Today
          </button>
          <button
            type="button"
            className="ld-cal-nav-btn"
            onClick={() =>
              setFocusDate((prev) => stepCalendarDate(prev, viewMode, 1))
            }
            aria-label="Next period"
          >
            Next <ArrowRightIcon size={14} />
          </button>

          <div className="ld-cal-nav-divider" />

          <input
            type="date"
            className="ld-cal-nav-date-input"
            value={focusDateIso}
            onChange={(e) => {
              if (e.target.value) {
                setFocusDate(new Date(`${e.target.value}T12:00:00`));
              }
            }}
            aria-label="Jump to date"
          />
        </div>

        {/* Center: Period Range Title */}
        <div className="ld-cal-nav-center">
          <CalendarIcon size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <strong className="ld-cal-nav-title">
            {formatCalendarHeaderRange(focusDate, viewMode)}
          </strong>
        </div>

        {/* Right: Scheduled Events Badge */}
        <div className="ld-cal-nav-right">
          <span className="ld-cal-nav-badge">
            <span className="ld-cal-nav-dot" />
            Showing {filteredEvents.length} scheduled{' '}
            {filteredEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        onRefresh={loadCalendarData}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <SearchInput
          value={search}
          onChange={(val: string) => setSearch(val)}
          placeholder="Search events, meetings, contacts, deals..."
        />

        <select
          className="lg-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by event type"
        >
          <option value="">All Event Types</option>
          {CALENDAR_EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="lg-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by event status"
        >
          <option value="">All Statuses</option>
          {ACTIVITY_RECORD_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="lg-select"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          aria-label="Filter by user calendar"
        >
          <option value="">My / All Assigned Events</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </FilterBar>

      {/* Active View */}
      {viewMode === 'month' && (
        <CalendarMonthGrid
          focusDate={focusDate}
          events={filteredEvents}
          isLoading={isLoading}
          onSelectDate={(d) => setFocusDate(d)}
          onPreviewEvent={(ev) => setPreviewEvent(ev)}
          onToggleComplete={handleToggleComplete}
          onDeleteEvent={(ev) => setDeletingEvent(ev)}
          onCreateAtDate={(dateStr) =>
            navigate(`/calendar/create?date=${dateStr}`)
          }
        />
      )}

      {viewMode === 'week' && (
        <CalendarWeekGrid
          focusDate={focusDate}
          events={filteredEvents}
          isLoading={isLoading}
          onPreviewEvent={(ev) => setPreviewEvent(ev)}
          onToggleComplete={handleToggleComplete}
          onDeleteEvent={(ev) => setDeletingEvent(ev)}
          onCreateAtDate={(dateStr) =>
            navigate(`/calendar/create?date=${dateStr}`)
          }
        />
      )}

      {viewMode === 'day' && (
        <CalendarDayTimeline
          focusDate={focusDate}
          events={filteredEvents}
          isLoading={isLoading}
          onPreviewEvent={(ev) => setPreviewEvent(ev)}
          onToggleComplete={handleToggleComplete}
          onDeleteEvent={(ev) => setDeletingEvent(ev)}
          onCreateAtDate={(dateStr) =>
            navigate(`/calendar/create?date=${dateStr}`)
          }
        />
      )}

      {viewMode === 'schedule' && (
        <CalendarScheduleAgenda
          focusDate={focusDate}
          events={filteredEvents}
          isLoading={isLoading}
          onPreviewEvent={(ev) => setPreviewEvent(ev)}
          onToggleComplete={handleToggleComplete}
          onDeleteEvent={(ev) => setDeletingEvent(ev)}
        />
      )}

      <CalendarEventQuickDrawer
        event={previewEvent}
        isOpen={Boolean(previewEvent)}
        onClose={() => setPreviewEvent(null)}
        onToggleComplete={handleToggleComplete}
        onReminderChange={handleReminderChange}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingEvent)}
        title="Delete Calendar Event"
        message={`Are you sure you want to permanently delete "${deletingEvent?.title || 'this event'}"?`}
        confirmLabel="Delete Event"
        isLoading={isDeleting}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleConfirmDelete}
      />
    </CalendarLayout>
  );
};

export default CalendarExplorerPage;

