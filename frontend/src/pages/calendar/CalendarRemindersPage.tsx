import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { calendarService } from '../../services/calendar.service';
import type {
  CalendarReminderRecord,
  CrmNotificationItem,
  ReminderOffsetMinutes,
} from '../../types/calendar.types';
import { CalendarLayout } from './components/CalendarLayout';
import {
  Badge,
  SectionCard,
  StatCard,
} from '../lead-generation/components/Cards';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  ActivityIcon,
  AlertCircleIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  RefreshCwIcon,
} from '../../components/common/Icons';
import {
  REMINDER_OFFSET_OPTIONS,
  calendarEventTone,
} from './calendarConstants';

export const CalendarRemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<CalendarReminderRecord[]>([]);
  const [notifications, setNotifications] = useState<CrmNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRemindersAndNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [remList, notifList] = await Promise.all([
        calendarService.getUpcomingReminders(),
        calendarService.getNotifications(),
      ]);
      setReminders(remList);
      setNotifications(notifList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load calendar reminders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRemindersAndNotifications();
  }, [loadRemindersAndNotifications]);

  const handleOffsetChange = (
    eventId: string,
    offsetMinutes: ReminderOffsetMinutes,
  ) => {
    calendarService.setEventReminderOffset(eventId, offsetMinutes);
    loadRemindersAndNotifications();
  };

  const handleSnooze = (eventId: string, minutes = 15) => {
    calendarService.snoozeReminder(eventId, minutes);
    loadRemindersAndNotifications();
  };

  const handleDismiss = (eventId: string) => {
    calendarService.dismissReminder(eventId);
    loadRemindersAndNotifications();
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await calendarService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // ignore if notification endpoint is read-only
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await calendarService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const nowMs = Date.now();
  const dueSoonCount = reminders.filter((r) => {
    const startMs = new Date(r.eventStart).getTime();
    return startMs >= nowMs && startMs - nowMs <= 24 * 60 * 60 * 1000;
  }).length;
  const pastDueCount = reminders.filter(
    (r) => new Date(r.eventStart).getTime() < nowMs,
  ).length;
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  return (
    <CalendarLayout
      title="Calendar Reminders & Alerts"
      subtitle="Manage lead-time reminders, snooze upcoming alerts, and review system notifications"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadRemindersAndNotifications}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCwIcon size={14} />
            Refresh
          </button>
          <Link
            to="/calendar/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            <PlusIcon size={14} />
            Create Event with Reminder
          </Link>
        </div>
      }
    >
      <ErrorMessage error={error} />

      <div className="lg-stat-grid">
        <StatCard
          label="Active Event Reminders"
          value={reminders.length}
          hint="Scheduled over next 14 days"
          tone="blue"
          icon={<CalendarIcon size={18} />}
        />
        <StatCard
          label="Due Within 24 Hours"
          value={dueSoonCount}
          hint="Upcoming high-priority alerts"
          tone="amber"
          icon={<ClockIcon size={18} />}
        />
        <StatCard
          label="Overdue Event Alerts"
          value={pastDueCount}
          hint="Past scheduled start time"
          tone={pastDueCount > 0 ? 'red' : 'green'}
          icon={<AlertCircleIcon size={18} />}
        />
        <StatCard
          label="Unread CRM Alerts"
          value={unreadNotifications}
          hint="System & activity notifications"
          tone="purple"
          icon={<ActivityIcon size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Scheduled Event Reminders"
            subtitle="Adjust reminder lead time, snooze by 15 minutes, or dismiss alerts"
          >
            {loading ? (
              <div className="py-12 text-center text-sm text-gray-500">
                Loading reminders...
              </div>
            ) : reminders.length === 0 ? (
              <EmptyState
                title="No active event reminders"
                description="Schedule a meeting or activity to configure upcoming reminder alerts."
                action={
                  <Link
                    to="/calendar/create"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <PlusIcon size={14} />
                    Schedule Event
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {reminders.map((rem) => {
                  const isOverdue = new Date(rem.eventStart).getTime() < nowMs;
                  return (
                    <div
                      key={rem.id}
                      className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={calendarEventTone(rem.eventType)}>
                            {rem.eventType}
                          </Badge>
                          {isOverdue ? (
                            <Badge tone="red">OVERDUE</Badge>
                          ) : (
                            <Badge tone="blue">
                              Remind at {formatDateTime(rem.remindAt)}
                            </Badge>
                          )}
                          {rem.snoozedUntil && (
                            <Badge tone="amber">
                              Snoozed until {formatDateTime(rem.snoozedUntil)}
                            </Badge>
                          )}
                        </div>

                        <Link
                          to={`/calendar/events/${rem.eventId}?category=${rem.eventCategory}`}
                          className="mt-1.5 block truncate text-sm font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {rem.eventTitle}
                        </Link>

                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                          <ClockIcon size={14} />
                          <span>Event Start: {formatDateTime(rem.eventStart)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={rem.offsetMinutes}
                          onChange={(e) =>
                            handleOffsetChange(
                              rem.eventId,
                              Number(e.target.value) as ReminderOffsetMinutes,
                            )
                          }
                          aria-label="Reminder Offset"
                          className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                        >
                          {REMINDER_OFFSET_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleSnooze(rem.eventId, 15)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                        >
                          <ClockIcon size={13} />
                          Snooze 15m
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDismiss(rem.eventId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        <div>
          <SectionCard
            title="CRM System Notifications"
            subtitle="Recent alerts from the CRM notification feed"
            actions={
              unreadNotifications > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  <CheckIcon size={13} />
                  Mark all read
                </button>
              ) : undefined
            }
          >
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                No system notifications found.
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl border p-3 text-xs transition-colors ${
                      n.isRead
                        ? 'border-gray-200 bg-white text-gray-600'
                        : 'border-blue-200 bg-blue-50/50 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <ClockIcon size={13} />
                        <span>{n.title}</span>
                      </div>
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className="text-[11px] font-medium text-blue-600 hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-gray-600">{n.message}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{formatDateTime(n.createdAt)}</span>
                      {n.link && (
                        <Link
                          to={n.link}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Open ↗
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </CalendarLayout>
  );
};

export default CalendarRemindersPage;
