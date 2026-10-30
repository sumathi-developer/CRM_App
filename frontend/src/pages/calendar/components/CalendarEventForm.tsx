import React, { useEffect, useState } from 'react';
import { calendarService } from '../../../services/calendar.service';
import type {
  CalendarContactRef,
  CalendarDealRef,
  CalendarEventItem,
  CalendarEventPriority,
  CalendarEventStatus,
  CalendarLeadRef,
  CalendarUserRef,
  CreateCalendarEventPayload,
  ReminderOffsetMinutes,
  UpdateCalendarEventPayload,
} from '../../../types/calendar.types';
import {
  REMINDER_OFFSET_OPTIONS,
  SCHEDULABLE_EVENT_TYPE_OPTIONS,
} from '../calendarConstants';
import {
  ACTIVITY_RECORD_PRIORITY_OPTIONS,
  ACTIVITY_RECORD_STATUS_OPTIONS,
} from '../../activities/activityConstants';
import { Field } from '../../lead-generation/components/FormParts';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';

export interface CalendarEventFormProps {
  mode: 'create' | 'edit';
  initialEvent?: CalendarEventItem | null;
  preselectedDate?: string;
  preselectedType?: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onSubmit: (
    payload: CreateCalendarEventPayload | UpdateCalendarEventPayload,
  ) => Promise<void>;
  onCancel: () => void;
}

export const CalendarEventForm: React.FC<CalendarEventFormProps> = ({
  mode,
  initialEvent,
  preselectedDate,
  preselectedType,
  isSubmitting = false,
  serverError = null,
  onSubmit,
  onCancel,
}) => {
  const [users, setUsers] = useState<CalendarUserRef[]>([]);
  const [contacts, setContacts] = useState<CalendarContactRef[]>([]);
  const [leads, setLeads] = useState<CalendarLeadRef[]>([]);
  const [deals, setDeals] = useState<CalendarDealRef[]>([]);

  const defaultStart = () => {
    if (initialEvent?.start) {
      return initialEvent.start.slice(0, 16);
    }
    if (preselectedDate) {
      return `${preselectedDate.slice(0, 10)}T10:00`;
    }
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${nextHour.getFullYear()}-${pad(nextHour.getMonth() + 1)}-${pad(
      nextHour.getDate(),
    )}T${pad(nextHour.getHours())}:00`;
  };

  const [type, setType] = useState<string>(
    initialEvent?.type || preselectedType || 'MEETING',
  );
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(
    initialEvent?.end ? initialEvent.end.slice(0, 16) : '',
  );
  const [priority, setPriority] = useState<CalendarEventPriority>(
    ((initialEvent?.priority || 'MEDIUM') as CalendarEventPriority),
  );
  const [status, setStatus] = useState<CalendarEventStatus>(
    ((initialEvent?.status || 'PENDING') as CalendarEventStatus),
  );
  const [reminderMinutes, setReminderMinutes] = useState<ReminderOffsetMinutes>(
    initialEvent?.reminderMinutes ?? 15,
  );
  const [assignedToId, setAssignedToId] = useState(
    initialEvent?.assignedToId || '',
  );
  const [dealId, setDealId] = useState(initialEvent?.dealId || '');
  const [contactId, setContactId] = useState(initialEvent?.contactId || '');
  const [leadId, setLeadId] = useState(initialEvent?.leadId || '');
  const [description, setDescription] = useState(
    initialEvent?.description || '',
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    Promise.all([
      calendarService.getAssignableUsers(),
      calendarService.getContactsLookup(),
      calendarService.getLeadsLookup(),
      calendarService.getDealsLookup(),
    ])
      .then(([userList, contactList, leadList, dealList]) => {
        if (!active) return;
        setUsers(userList);
        setContacts(contactList);
        setLeads(leadList);
        setDeals(dealList);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) {
      nextErrors.title = 'Event title is required.';
    }
    if (!startTime) {
      nextErrors.startTime = 'Start date and time are required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const basePayload: CreateCalendarEventPayload = {
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: new Date(startTime).toISOString(),
      endTime: endTime ? new Date(endTime).toISOString() : undefined,
      priority,
      assignedToId: assignedToId || undefined,
      dealId: dealId || undefined,
      contactId: contactId || undefined,
      leadId: leadId || undefined,
      reminderMinutes,
    };

    if (mode === 'edit') {
      const updatePayload: UpdateCalendarEventPayload = {
        ...basePayload,
        status,
      };
      await onSubmit(updatePayload);
    } else {
      await onSubmit(basePayload);
    }
  };

  return (
    <form className="lg-card ld-form-card" onSubmit={handleSubmit} noValidate>
      <div className="ld-form-section">
        <h3 className="ld-form-section-title">Calendar Event Schedule</h3>
        <p className="ld-form-section-sub">
          Configure the event type, title, scheduled time window, priority, and reminder alert.
        </p>

        {serverError && <ErrorMessage error={serverError} />}

        <div className="lg-form-grid">
          <Field label="Event Type" htmlFor="cal-form-type" required>
            <select
              id="cal-form-type"
              className="lg-select"
              value={type}
              disabled={mode === 'edit' && initialEvent?.category === 'TASK'}
              onChange={(e) => setType(e.target.value)}
            >
              {SCHEDULABLE_EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Event Title"
            htmlFor="cal-form-title"
            required
            error={errors.title}
          >
            <input
              id="cal-form-title"
              type="text"
              className="lg-input"
              placeholder="e.g. Executive Architecture & Pricing Review"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
            />
          </Field>

          <Field
            label="Start Date & Time"
            htmlFor="cal-form-start"
            required
            error={errors.startTime}
          >
            <input
              id="cal-form-start"
              type="datetime-local"
              className="lg-input"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                if (errors.startTime) {
                  setErrors((prev) => ({ ...prev, startTime: '' }));
                }
              }}
            />
          </Field>

          <Field
            label="End Date & Time (Optional)"
            htmlFor="cal-form-end"
          >
            <input
              id="cal-form-end"
              type="datetime-local"
              className="lg-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Field>

          <Field label="Priority" htmlFor="cal-form-priority">
            <select
              id="cal-form-priority"
              className="lg-select"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as CalendarEventPriority)
              }
            >
              {ACTIVITY_RECORD_PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Reminder Alert" htmlFor="cal-form-reminder">
            <select
              id="cal-form-reminder"
              className="lg-select"
              value={reminderMinutes}
              onChange={(e) =>
                setReminderMinutes(Number(e.target.value) as ReminderOffsetMinutes)
              }
            >
              {REMINDER_OFFSET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          {mode === 'edit' && (
            <Field label="Event Status" htmlFor="cal-form-status">
              <select
                id="cal-form-status"
                className="lg-select"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as CalendarEventStatus)
                }
              >
                {ACTIVITY_RECORD_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Assignee / Organizer" htmlFor="cal-form-assignee">
            <select
              id="cal-form-assignee"
              className="lg-select"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
            >
              <option value="">— Assign to Current User —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="ld-form-section">
        <h3 className="ld-form-section-title">Related CRM Records</h3>
        <p className="ld-form-section-sub">
          Link this calendar event to a Deal, Contact, or Lead.
        </p>

        <div className="lg-form-grid">
          <Field label="Related Deal" htmlFor="cal-form-deal">
            <select
              id="cal-form-deal"
              className="lg-select"
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
            >
              <option value="">— No Linked Deal —</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Related Contact" htmlFor="cal-form-contact">
            <select
              id="cal-form-contact"
              className="lg-select"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">— No Linked Contact —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Related Lead" htmlFor="cal-form-lead">
            <select
              id="cal-form-lead"
              className="lg-select"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              <option value="">— No Linked Lead —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="ld-form-section">
        <h3 className="ld-form-section-title">Agenda, Location & Notes</h3>
        <Field label="Event Description / Meeting Agenda" htmlFor="cal-form-desc">
          <textarea
            id="cal-form-desc"
            className="lg-textarea"
            rows={4}
            placeholder="Include conference link, meeting agenda, key stakeholders, and preparation notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>

      <div className="ld-form-actions">
        <button
          type="button"
          className="auth-btn btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="auth-btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Scheduling Event...'
              : 'Saving Event...'
            : mode === 'create'
              ? 'Schedule Event'
              : 'Save Event Changes'}
        </button>
      </div>
    </form>
  );
};

