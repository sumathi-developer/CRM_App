import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { calendarService } from '../../services/calendar.service';
import type {
  CalendarContactRef,
  CalendarDealRef,
  CalendarEventItem,
  CalendarLeadRef,
  CalendarUserRef,
  ReminderOffsetMinutes,
} from '../../types/calendar.types';
import { CalendarLayout } from './components/CalendarLayout';
import { Badge, SectionCard } from '../lead-generation/components/Cards';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  UsersIcon,
} from '../../components/common/Icons';
import {
  MEETING_DURATION_OPTIONS,
  REMINDER_OFFSET_OPTIONS,
  formatTimeOnly,
  toDateInputString,
} from './calendarConstants';

interface TimeSlotOption {
  hour: number;
  minute: number;
  label: string;
  startIso: string;
  endIso: string;
  hasConflict: boolean;
  conflictingTitles: string[];
}

export const MeetingSchedulingPage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toDateInputString(new Date()),
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [selectedSlotIso, setSelectedSlotIso] = useState<string>('');
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [meetingType, setMeetingType] = useState<'MEETING' | 'CALL' | 'FOLLOW_UP'>(
    'MEETING',
  );
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>(
    'MEDIUM',
  );
  const [reminderMinutes, setReminderMinutes] =
    useState<ReminderOffsetMinutes>(15);
  const [description, setDescription] = useState<string>('');

  const [assignedToId, setAssignedToId] = useState<string>('');
  const [contactId, setContactId] = useState<string>('');
  const [dealId, setDealId] = useState<string>('');
  const [leadId, setLeadId] = useState<string>('');

  const [dayEvents, setDayEvents] = useState<CalendarEventItem[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const [users, setUsers] = useState<CalendarUserRef[]>([]);
  const [contacts, setContacts] = useState<CalendarContactRef[]>([]);
  const [deals, setDeals] = useState<CalendarDealRef[]>([]);
  const [leads, setLeads] = useState<CalendarLeadRef[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      calendarService.getAssignableUsers(),
      calendarService.getContactsLookup(),
      calendarService.getDealsLookup(),
      calendarService.getLeadsLookup(),
    ])
      .then(([u, c, d, l]) => {
        setUsers(u);
        setContacts(c);
        setDeals(d);
        setLeads(l);
      })
      .catch(() => {
        // non-fatal lookup fallback
      });
  }, []);

  const loadDaySchedule = useCallback(async () => {
    setLoadingDay(true);
    try {
      const res = await calendarService.getDayView({
        date: selectedDate,
        userId: assignedToId || undefined,
      });
      setDayEvents(res.events);
    } catch {
      setDayEvents([]);
    } finally {
      setLoadingDay(false);
    }
  }, [selectedDate, assignedToId]);

  useEffect(() => {
    loadDaySchedule();
  }, [loadDaySchedule]);

  const timeSlots = useMemo<TimeSlotOption[]>(() => {
    const slots: TimeSlotOption[] = [];
    const baseParts = selectedDate.split('-').map(Number);
    if (baseParts.length !== 3) return slots;

    for (let hour = 9; hour <= 17; hour++) {
      for (const minute of [0, 30]) {
        if (hour === 17 && minute === 30) continue;
        const start = new Date(
          baseParts[0],
          baseParts[1] - 1,
          baseParts[2],
          hour,
          minute,
          0,
          0,
        );
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

        const conflicts = dayEvents.filter((ev) => {
          if (ev.allDay) return false;
          const evStart = new Date(ev.start).getTime();
          const evEnd = ev.end
            ? new Date(ev.end).getTime()
            : evStart + 30 * 60 * 1000;
          return start.getTime() < evEnd && end.getTime() > evStart;
        });

        slots.push({
          hour,
          minute,
          label: start.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          startIso: start.toISOString(),
          endIso: end.toISOString(),
          hasConflict: conflicts.length > 0,
          conflictingTitles: conflicts.map((c) => c.title),
        });
      }
    }
    return slots;
  }, [selectedDate, durationMinutes, dayEvents]);

  const activeSlotIso = useMemo(() => {
    if (
      selectedSlotIso &&
      timeSlots.some((s) => s.startIso === selectedSlotIso)
    ) {
      return selectedSlotIso;
    }
    const firstAvailable =
      timeSlots.find((s) => !s.hasConflict) || timeSlots[0];
    return firstAvailable ? firstAvailable.startIso : '';
  }, [timeSlots, selectedSlotIso]);

  const selectedSlot = useMemo(
    () => timeSlots.find((s) => s.startIso === activeSlotIso) || null,
    [timeSlots, activeSlotIso],
  );

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!meetingTitle.trim()) {
      setError('Please enter a meeting title.');
      return;
    }
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await calendarService.scheduleEvent({
        type: meetingType,
        title: meetingTitle.trim(),
        description: description.trim() || undefined,
        startTime: selectedSlot.startIso,
        endTime: selectedSlot.endIso,
        priority,
        assignedToId: assignedToId || undefined,
        contactId: contactId || undefined,
        dealId: dealId || undefined,
        leadId: leadId || undefined,
        reminderMinutes,
      });
      navigate(`/calendar/events/${created.id}?category=${created.category}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableCount = timeSlots.filter((s) => !s.hasConflict).length;

  return (
    <CalendarLayout
      title="Meeting Scheduling"
      subtitle="Pick a conflict-free time slot, link CRM stakeholders, and schedule meetings"
    >
      <ErrorMessage error={error} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column: Date, Duration & Smart Time Slot Picker */}
        <div className="space-y-6 lg:col-span-7">
          <SectionCard
            title="1. Select Date, Duration & Available Time Slot"
            subtitle="Conflicts with existing calendar events are highlighted automatically"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Duration Preset
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                >
                  {MEETING_DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <ClockIcon size={15} />
                <span>
                  <strong>{availableCount}</strong> conflict-free slots available on{' '}
                  <strong>{selectedDate}</strong>
                </span>
              </div>
              {loadingDay && (
                <span className="text-xs text-gray-400">Checking availability...</span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {timeSlots.map((slot) => {
                const isSelected = slot.startIso === activeSlotIso;
                return (
                  <button
                    key={slot.startIso}
                    type="button"
                    onClick={() => setSelectedSlotIso(slot.startIso)}
                    className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : slot.hasConflict
                          ? 'border-amber-200 bg-amber-50/70 text-amber-900 hover:border-amber-300'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold">{slot.label}</span>
                      {slot.hasConflict ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Busy
                        </span>
                      ) : (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          Open
                        </span>
                      )}
                    </div>
                    <span
                      className={`mt-1 truncate text-[10px] ${
                        isSelected ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {slot.hasConflict
                        ? `Overlap: ${slot.conflictingTitles[0]}`
                        : `${durationMinutes} min slot`}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Existing Schedule on Selected Date"
            subtitle={`Events already booked on ${selectedDate}`}
          >
            {dayEvents.length === 0 ? (
              <p className="text-xs text-gray-500">
                No existing meetings or activities scheduled on this day.
              </p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <ClockIcon size={14} />
                      <span className="font-semibold text-gray-800">
                        {ev.allDay ? 'All Day' : formatTimeOnly(ev.start)}
                      </span>
                      <span className="text-gray-900">{ev.title}</span>
                    </div>
                    <Badge tone="blue">{ev.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column: Meeting Details & CRM Attendees */}
        <div className="lg:col-span-5">
          <form onSubmit={handleScheduleMeeting} className="space-y-6">
            <SectionCard
              title="2. Meeting Details & CRM Stakeholders"
              subtitle="Configure agenda, host, and related CRM records"
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Meeting Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="e.g., Enterprise Architecture & Pricing Review"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Session Format
                    </label>
                    <select
                      value={meetingType}
                      onChange={(e) =>
                        setMeetingType(
                          e.target.value as 'MEETING' | 'CALL' | 'FOLLOW_UP',
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="MEETING">Meeting</option>
                      <option value="CALL">Call</option>
                      <option value="FOLLOW_UP">Follow-up Session</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) =>
                        setPriority(
                          e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Host / Assignee
                    </label>
                    <select
                      value={assignedToId}
                      onChange={(e) => setAssignedToId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Current User</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Reminder Alert
                    </label>
                    <select
                      value={reminderMinutes}
                      onChange={(e) =>
                        setReminderMinutes(
                          Number(e.target.value) as ReminderOffsetMinutes,
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                    >
                      {REMINDER_OFFSET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                    <UsersIcon size={14} />
                    <span>Link CRM Participant & Opportunity</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">
                        Contact Attendee
                      </label>
                      <select
                        value={contactId}
                        onChange={(e) => setContactId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">No Contact Linked</option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {`${c.firstName || ''} ${c.lastName || ''}`.trim() ||
                              c.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">
                        Related Deal
                      </label>
                      <select
                        value={dealId}
                        onChange={(e) => setDealId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">No Deal Linked</option>
                        {deals.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">
                        Related Lead
                      </label>
                      <select
                        value={leadId}
                        onChange={(e) => setLeadId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">No Lead Linked</option>
                        {leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.title}
                            {l.companyName ? ` (${l.companyName})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Meeting Agenda / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Key discussion topics, call link, or preparation notes..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {selectedSlot && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CalendarIcon size={14} />
                      <span>
                        Selected Slot: {selectedDate} at {selectedSlot.label} (
                        {durationMinutes} mins)
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Link
                    to="/calendar"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CheckIcon size={14} />
                    {submitting ? 'Scheduling...' : 'Confirm & Schedule Meeting'}
                  </button>
                </div>
              </div>
            </SectionCard>
          </form>
        </div>
      </div>
    </CalendarLayout>
  );
};

export default MeetingSchedulingPage;
