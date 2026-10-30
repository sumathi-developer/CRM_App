import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { calendarService } from '../../services/calendar.service';
import type {
  CalendarEventCategory,
  CalendarEventItem,
  ReminderOffsetMinutes,
} from '../../types/calendar.types';
import { CalendarLayout } from './components/CalendarLayout';
import {
  Badge,
  SectionCard,
} from '../lead-generation/components/Cards';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  EditIcon,
  TrashIcon,
  UserIcon,
} from '../../components/common/Icons';
import {
  REMINDER_OFFSET_OPTIONS,
  calendarEventTone,
  formatTimeOnly,
  getCalendarEventRelatedLinks,
  isCalendarEventOverdue,
} from './calendarConstants';

export const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryParam = searchParams.get('category') as CalendarEventCategory | null;

  const [event, setEvent] = useState<CalendarEventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState(false);
  const [reminderSavedNotice, setReminderSavedNotice] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await calendarService.getEventById(id, categoryParam || undefined);
      setEvent(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load calendar event details.');
    } finally {
      setLoading(false);
    }
  }, [id, categoryParam]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleToggleComplete = async () => {
    if (!event || event.category === 'DEAL') return;
    setBusyAction(true);
    setError('');
    try {
      const updated = await calendarService.toggleEventComplete(event);
      setEvent(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to update event completion status.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleReminderChange = (offset: ReminderOffsetMinutes) => {
    if (!event) return;
    calendarService.setEventReminderOffset(event.id, offset);
    setEvent({ ...event, reminderMinutes: offset });
    setReminderSavedNotice('Reminder preference updated');
    setTimeout(() => setReminderSavedNotice(''), 2500);
  };

  const handleConfirmDelete = async () => {
    if (!event) return;
    setDeleting(true);
    try {
      await calendarService.deleteEvent(event.id, event.category);
      navigate('/calendar');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete calendar event.');
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <CalendarLayout
        title="Event Details"
        subtitle="Loading event schedule and linked CRM records..."
      >
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          Loading event details...
        </div>
      </CalendarLayout>
    );
  }

  if (!event) {
    return (
      <CalendarLayout
        title="Event Not Found"
        subtitle="The requested calendar event could not be loaded."
      >
        <ErrorMessage error={error} />
        <EmptyState
          title="Calendar event not found"
          description="It may have been deleted or rescheduled."
          action={
            <Link
              to="/calendar"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Back to Calendar
            </Link>
          }
        />
      </CalendarLayout>
    );
  }

  const completed = (event.status || '').toUpperCase() === 'COMPLETED';
  const overdue = isCalendarEventOverdue(event);
  const relatedLinks = getCalendarEventRelatedLinks(event);
  const canEdit = event.category !== 'DEAL';

  return (
    <CalendarLayout
      title={event.title}
      subtitle={`${event.type} • Scheduled for ${formatDateTime(event.start)}`}
      activeEvent={event}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                disabled={busyAction}
                onClick={handleToggleComplete}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                  completed
                    ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <CheckIcon size={14} />
                {completed ? 'Reopen Event' : 'Mark Completed'}
              </button>
              <Link
                to={`/calendar/events/${event.id}/edit?category=${event.category}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <EditIcon size={14} />
                Edit Event
              </Link>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                <TrashIcon size={14} />
                Delete
              </button>
            </>
          )}
          <Link
            to={`/activities/${event.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            Open in Activities →
          </Link>
        </div>
      }
    >
      <ErrorMessage error={error} />

      {overdue && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircleIcon size={16} />
            <span>
              This scheduled event is past its start time ({formatDateTime(event.start)}) and has not been marked completed.
            </span>
          </div>
          {canEdit && (
            <button
              type="button"
              disabled={busyAction}
              onClick={handleToggleComplete}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Complete Now
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="Event Overview & Agenda"
            subtitle="Complete schedule, status, and meeting description"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone={calendarEventTone(event.type)}>{event.type}</Badge>
              <Badge
                tone={
                  completed
                    ? 'green'
                    : overdue
                      ? 'red'
                      : event.status === 'IN_PROGRESS'
                        ? 'blue'
                        : 'amber'
                }
              >
                {overdue ? 'OVERDUE' : event.status}
              </Badge>
              {event.priority && (
                <Badge tone="slate">Priority: {event.priority}</Badge>
              )}
              <Badge tone="slate">Category: {event.category}</Badge>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Agenda / Notes
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-800">
                {event.description || 'No description or meeting agenda provided.'}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <CalendarIcon size={14} />
                  <span>Scheduled Start</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDateTime(event.start)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {event.allDay ? 'All-day event' : `Starts at ${formatTimeOnly(event.start)}`}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <ClockIcon size={14} />
                  <span>End / Completion Time</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {event.end ? formatDateTime(event.end) : 'Not specified'}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {completed ? 'Event marked as completed' : 'Currently active on calendar'}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Related CRM Records"
            subtitle="Open associated Deal, Contact, or Lead records"
          >
            {relatedLinks.length === 0 ? (
              <p className="text-xs text-gray-500">
                No CRM Deal, Contact, or Lead is linked to this event.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {relatedLinks.map((rel) => (
                  <Link
                    key={`${rel.entityType}-${rel.id}`}
                    to={rel.path}
                    className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        tone={
                          rel.entityType === 'Deal'
                            ? 'purple'
                            : rel.entityType === 'Contact'
                              ? 'blue'
                              : 'amber'
                        }
                      >
                        {rel.entityType}
                      </Badge>
                      <span className="text-xs text-gray-400 group-hover:text-blue-600">
                        ↗
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-700">
                        {rel.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        Click to view {rel.entityType.toLowerCase()} record
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Reminder Controls"
            subtitle="Configure alert timing before event start"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <ClockIcon size={15} />
                <span>Lead-time notification offset:</span>
              </div>
              <select
                value={event.reminderMinutes ?? 15}
                onChange={(e) =>
                  handleReminderChange(Number(e.target.value) as ReminderOffsetMinutes)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:border-blue-500 focus:outline-none"
              >
                {REMINDER_OFFSET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {reminderSavedNotice && (
                <p className="text-xs font-medium text-emerald-600">
                  {reminderSavedNotice}
                </p>
              )}

              <div className="pt-2">
                <Link
                  to="/calendar/reminders"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                >
                  Manage all active reminders →
                </Link>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Assignment & Ownership"
            subtitle="Team member responsible for this event"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <UserIcon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {event.assignedTo
                    ? event.assignedTo.name || event.assignedTo.email || 'Assigned User'
                    : 'Unassigned'}
                </p>
                {event.assignedTo?.email && (
                  <p className="text-xs text-gray-500">{event.assignedTo.email}</p>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Calendar Event"
        message={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        confirmLabel="Delete Event"
        isLoading={deleting}
      />
    </CalendarLayout>
  );
};

export default EventDetailsPage;
