import React, { useEffect, useState } from 'react';
import { activityService } from '../../../services/activity.service';
import type {
  ActivityContactRef,
  ActivityDealRef,
  ActivityItemType,
  ActivityLeadRef,
  ActivityRecord,
  ActivityRecordPriority,
  ActivityRecordStatus,
  ActivityUserRef,
  CreateActivityRecordPayload,
  UpdateActivityRecordPayload,
} from '../../../types/activity.types';
import {
  ACTIVITY_ITEM_TYPE_OPTIONS,
  ACTIVITY_RECORD_PRIORITY_OPTIONS,
  ACTIVITY_RECORD_STATUS_OPTIONS,
} from '../activityConstants';
import { Field } from '../../lead-generation/components/FormParts';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';

export interface ActivityFormProps {
  mode: 'create' | 'edit';
  initialActivity?: ActivityRecord | null;
  preselectedType?: ActivityItemType;
  preselectedLeadId?: string;
  preselectedContactId?: string;
  preselectedDealId?: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onSubmit: (
    payload: CreateActivityRecordPayload | UpdateActivityRecordPayload,
  ) => Promise<void>;
  onCancel: () => void;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  mode,
  initialActivity,
  preselectedType,
  preselectedLeadId,
  preselectedContactId,
  preselectedDealId,
  isSubmitting = false,
  serverError = null,
  onSubmit,
  onCancel,
}) => {
  const [users, setUsers] = useState<ActivityUserRef[]>([]);
  const [contacts, setContacts] = useState<ActivityContactRef[]>([]);
  const [leads, setLeads] = useState<ActivityLeadRef[]>([]);
  const [deals, setDeals] = useState<ActivityDealRef[]>([]);

  const [type, setType] = useState<ActivityItemType>(
    ((initialActivity?.type || preselectedType || 'CALL') as ActivityItemType),
  );
  const [subject, setSubject] = useState(initialActivity?.subject || '');
  const [scheduledAt, setScheduledAt] = useState(
    initialActivity?.scheduledAt
      ? initialActivity.scheduledAt.slice(0, 16)
      : '',
  );
  const [status, setStatus] = useState<ActivityRecordStatus>(
    ((initialActivity?.status || 'PENDING') as ActivityRecordStatus),
  );
  const [priority, setPriority] = useState<ActivityRecordPriority>(
    ((initialActivity?.priority || 'MEDIUM') as ActivityRecordPriority),
  );
  const [assignedToId, setAssignedToId] = useState(
    initialActivity?.assignedToId || '',
  );
  const [leadId, setLeadId] = useState(
    initialActivity?.leadId || preselectedLeadId || '',
  );
  const [contactId, setContactId] = useState(
    initialActivity?.contactId || preselectedContactId || '',
  );
  const [dealId, setDealId] = useState(
    initialActivity?.dealId || preselectedDealId || '',
  );
  const [description, setDescription] = useState(
    initialActivity?.description || '',
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const loadLookups = async () => {
      const [userList, contactList, leadList, dealList] = await Promise.all([
        activityService.getAssignableUsers(),
        activityService.getContactsLookup(),
        activityService.getLeadsLookup(),
        activityService.getDealsLookup(),
      ]);
      if (!active) return;
      setUsers(userList);
      setContacts(contactList);
      setLeads(leadList);
      setDeals(dealList);
    };
    loadLookups();
    return () => {
      active = false;
    };
  }, []);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!subject.trim()) {
      nextErrors.subject = 'Activity subject / title is required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateActivityRecordPayload = {
      type,
      subject: subject.trim(),
      description: description.trim() || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      status,
      priority,
      assignedToId: assignedToId || undefined,
      leadId: leadId || undefined,
      contactId: contactId || undefined,
      dealId: dealId || undefined,
    };

    if (mode === 'edit') {
      const updatePayload: UpdateActivityRecordPayload = {
        ...payload,
        completedAt:
          status === 'COMPLETED' && !initialActivity?.completedAt
            ? new Date().toISOString()
            : initialActivity?.completedAt || undefined,
      };
      await onSubmit(updatePayload);
    } else {
      await onSubmit(payload);
    }
  };

  return (
    <form className="lg-card ld-form-card" onSubmit={handleSubmit} noValidate>
      <div className="ld-form-section">
        <h3 className="ld-form-section-title">Activity Details & Classification</h3>
        <p className="ld-form-section-sub">
          Specify the activity type, subject, priority, status, and due/scheduled date.
        </p>

        {serverError && <ErrorMessage error={serverError} />}

        <div className="lg-form-grid">
          <Field label="Activity Type" htmlFor="act-form-type" required>
            <select
              id="act-form-type"
              className="lg-select"
              value={type}
              disabled={mode === 'edit' && initialActivity?.recordSource === 'TASK'}
              onChange={(e) => setType(e.target.value as ActivityItemType)}
            >
              {ACTIVITY_ITEM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Subject / Title"
            htmlFor="act-form-subject"
            required
            error={errors.subject}
          >
            <input
              id="act-form-subject"
              type="text"
              className="lg-input"
              placeholder="e.g. Discovery Demo Call with VP of Sales"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) {
                  setErrors((prev) => ({ ...prev, subject: '' }));
                }
              }}
            />
          </Field>

          <Field
            label="Due / Scheduled Date & Time"
            htmlFor="act-form-scheduled"
            hint="Activities past this date while Pending are flagged as Overdue."
          >
            <input
              id="act-form-scheduled"
              type="datetime-local"
              className="lg-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </Field>

          <Field label="Assignee" htmlFor="act-form-assignee">
            <select
              id="act-form-assignee"
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

          <Field label="Status" htmlFor="act-form-status">
            <select
              id="act-form-status"
              className="lg-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ActivityRecordStatus)}
            >
              {ACTIVITY_RECORD_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Priority" htmlFor="act-form-priority">
            <select
              id="act-form-priority"
              className="lg-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ActivityRecordPriority)}
            >
              {ACTIVITY_RECORD_PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="ld-form-section">
        <h3 className="ld-form-section-title">Related CRM Records</h3>
        <p className="ld-form-section-sub">
          Link this activity to a Lead, Contact, or Deal so it appears on their unified timeline.
        </p>

        <div className="lg-form-grid">
          <Field label="Related Deal" htmlFor="act-form-deal">
            <select
              id="act-form-deal"
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

          <Field label="Related Contact" htmlFor="act-form-contact">
            <select
              id="act-form-contact"
              className="lg-select"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">— No Linked Contact —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Related Lead" htmlFor="act-form-lead">
            <select
              id="act-form-lead"
              className="lg-select"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              <option value="">— No Linked Lead —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} {l.companyName ? `— ${l.companyName}` : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="ld-form-section">
        <h3 className="ld-form-section-title">Description, Agenda & Outcome Notes</h3>
        <Field label="Activity Description / Notes" htmlFor="act-form-desc">
          <textarea
            id="act-form-desc"
            className="lg-textarea"
            rows={4}
            placeholder="Record meeting agenda, call talking points, action items, or follow-up notes..."
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
              ? 'Creating Activity...'
              : 'Saving Changes...'
            : mode === 'create'
              ? 'Create Activity'
              : 'Save Activity Changes'}
        </button>
      </div>
    </form>
  );
};

