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
            <div className="ld-meeting-field-grid">
              <div className="lg-field">
                <label className="lg-label">
                  <CalendarIcon size={14} /> Meeting Date
                </label>
                <input
                  type="date"
                  className="lg-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="lg-field">
                <label className="lg-label">
                  <ClockIcon size={14} /> Duration Preset
                </label>
                <select
                  className="lg-select"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                >
                  {MEETING_DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ld-meeting-avail-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClockIcon size={15} style={{ color: '#047857' }} />
                <span>
                  <strong>{availableCount}</strong> conflict-free slots available on{' '}
                  <strong>{selectedDate}</strong>
                </span>
              </div>
              {loadingDay && (
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Checking availability...
                </span>
              )}
            </div>

            <div className="ld-meeting-slots-grid">
              {timeSlots.map((slot) => {
                const isSelected = slot.startIso === activeSlotIso;
                return (
                  <button
                    key={slot.startIso}
                    type="button"
                    onClick={() => setSelectedSlotIso(slot.startIso)}
                    className={`ld-slot-card ${
                      isSelected
                        ? 'is-selected'
                        : slot.hasConflict
                          ? 'is-conflict'
                          : ''
                    }`}
                  >
                    <div className="ld-slot-card-top">
                      <span className="ld-slot-time">{slot.label}</span>
                      {slot.hasConflict ? (
                        <span className="ld-slot-badge-busy">Busy</span>
                      ) : (
                        <span className="ld-slot-badge-open">Open</span>
                      )}
                    </div>
                    <span className="ld-slot-sub">
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
              <div
                style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px dashed rgba(16, 185, 129, 0.25)',
                }}
              >
                <CalendarIcon
                  size={20}
                  style={{ color: '#10B981', margin: '0 auto 0.35rem', opacity: 0.8 }}
                />
                <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                  No existing meetings or activities scheduled on this day.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      background: '#FFFFFF',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ClockIcon size={14} style={{ color: '#047857' }} />
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>
                        {ev.allDay ? 'All Day' : formatTimeOnly(ev.start)}
                      </span>
                      <span style={{ color: '#334155' }}>{ev.title}</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="lg-field">
                  <label className="lg-label">
                    Meeting Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="lg-input"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="e.g., Enterprise Architecture & Pricing Review"
                  />
                </div>

                <div className="ld-meeting-field-grid">
                  <div className="lg-field">
                    <label className="lg-label">Session Format</label>
                    <select
                      className="lg-select"
                      value={meetingType}
                      onChange={(e) =>
                        setMeetingType(
                          e.target.value as 'MEETING' | 'CALL' | 'FOLLOW_UP',
                        )
                      }
                    >
                      <option value="MEETING">Meeting</option>
                      <option value="CALL">Call</option>
                      <option value="FOLLOW_UP">Follow-up Session</option>
                    </select>
                  </div>

                  <div className="lg-field">
                    <label className="lg-label">Priority</label>
                    <select
                      className="lg-select"
                      value={priority}
                      onChange={(e) =>
                        setPriority(
                          e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
                        )
                      }
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="ld-meeting-field-grid">
                  <div className="lg-field">
                    <label className="lg-label">Host / Assignee</label>
                    <select
                      className="lg-select"
                      value={assignedToId}
                      onChange={(e) => setAssignedToId(e.target.value)}
                    >
                      <option value="">Current User</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg-field">
                    <label className="lg-label">Reminder Alert</label>
                    <select
                      className="lg-select"
                      value={reminderMinutes}
                      onChange={(e) =>
                        setReminderMinutes(
                          Number(e.target.value) as ReminderOffsetMinutes,
                        )
                      }
                    >
                      {REMINDER_OFFSET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ld-meeting-section-header">
                  <UsersIcon size={15} />
                  <span>Link CRM Participant & Opportunity</span>
                </div>

                <div className="ld-meeting-field-grid">
                  <div className="lg-field">
                    <label className="lg-label">Contact Attendee</label>
                    <select
                      className="lg-select"
                      value={contactId}
                      onChange={(e) => setContactId(e.target.value)}
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

                  <div className="lg-field">
                    <label className="lg-label">Related Deal</label>
                    <select
                      className="lg-select"
                      value={dealId}
                      onChange={(e) => setDealId(e.target.value)}
                    >
                      <option value="">No Deal Linked</option>
                      {deals.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="lg-field">
                  <label className="lg-label">Related Lead</label>
                  <select
                    className="lg-select"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
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

                <div className="lg-field">
                  <label className="lg-label">Meeting Agenda / Notes</label>
                  <textarea
                    rows={3}
                    className="lg-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Key discussion topics, call link, or preparation notes..."
                  />
                </div>

                {selectedSlot && (
                  <div className="ld-slot-confirmed-banner">
                    <CalendarIcon size={16} />
                    <span>
                      Selected Slot: <strong>{selectedDate}</strong> at{' '}
                      <strong>{selectedSlot.label}</strong> ({durationMinutes} mins)
                    </span>
                  </div>
                )}

                <div
                  className="ld-form-actions"
                  style={{ marginTop: '0.5rem', paddingTop: '1rem' }}
                >
                  <Link
                    to="/calendar"
                    className="auth-btn btn-secondary btn-size-small"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="auth-btn btn-primary btn-size-small"
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
