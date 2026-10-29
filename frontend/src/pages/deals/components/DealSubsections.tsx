import React, { useCallback, useEffect, useState } from 'react';
import { dealService } from '../../../services/deal.service';
import type {
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  DealActivity,
  DealDocumentRecord,
  DealNote,
  DealTimelineEvent,
} from '../../../types/deal.types';
import type { UserOption } from '../../lead-generation/leadGenHooks';
import { Badge, SectionCard } from '../../lead-generation/components/Cards';
import { Field, FormModal } from '../../lead-generation/components/FormParts';
import { ConfirmDeleteModal } from '../../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../../components/auth/LoadingIndicator';
import { EmptyState } from '../../../components/common/EmptyState';
import { PrimaryButton } from '../../../components/auth/PrimaryButton';
import { formatDateTime, humanize } from '../../lead-generation/leadGenConstants';
import {
  ACTIVITY_PRIORITY_OPTIONS,
  ACTIVITY_STATUS_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  activityStatusTone,
  formatBytes,
  priorityTone,
} from '../../leads/leadConstants';
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  PlusIcon,
  RefreshCwIcon,
  TrashIcon,
} from '../../../components/common/Icons';

/* ============================================================================
   1. DEAL TIMELINE SECTION
   ============================================================================ */

interface DealTimelineSectionProps {
  dealId: string;
}

export const DealTimelineSection: React.FC<DealTimelineSectionProps> = ({ dealId }) => {
  const [events, setEvents] = useState<DealTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    if (!dealId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await dealService.getDealTimeline(dealId);
      setEvents(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load deal timeline.');
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const toneForEvent = (type: string) => {
    switch (type) {
      case 'DEAL_CREATED':
        return 'green';
      case 'ACTIVITY':
        return 'blue';
      case 'NOTE':
        return 'purple';
      case 'TASK':
        return 'amber';
      default:
        return 'slate';
    }
  };

  return (
    <SectionCard
      title="Chronological Deal Timeline"
      subtitle="Unified stream of deal creation, stage activities, stakeholder meetings, tasks, and notes."
      actions={
        <button
          type="button"
          className="lg-icon-btn"
          onClick={loadTimeline}
          title="Refresh timeline"
        >
          <RefreshCwIcon size={15} />
        </button>
      }
    >
      {error && <div className="lg-inline-alert">{error}</div>}

      {isLoading ? (
        <div className="lg-state-box">
          <LoadingIndicator size="medium" message="Loading deal timeline..." />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No timeline events yet"
          description="Activities, notes, and tasks recorded for this deal will appear here chronologically."
        />
      ) : (
        <div className="ld-timeline-stream">
          {events.map((ev, idx) => (
            <div key={`${ev.type}-${ev.date}-${idx}`} className="ld-timeline-item">
              <div className={`ld-timeline-dot tone-${toneForEvent(ev.type)}`} />
              <div className="ld-timeline-content">
                <div className="ld-timeline-header">
                  <div className="lg-badge-row">
                    <Badge tone={toneForEvent(ev.type)}>{humanize(ev.type)}</Badge>
                    <strong className="ld-timeline-title">{ev.title}</strong>
                  </div>
                  <span className="lg-muted">
                    <ClockIcon size={13} /> {formatDateTime(ev.date)}
                  </span>
                </div>
                {ev.data?.description && (
                  <p className="ld-timeline-body">{ev.data.description}</p>
                )}
                {ev.data?.content && (
                  <p className="ld-timeline-body">{ev.data.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

/* ============================================================================
   2. DEAL ACTIVITIES SECTION
   ============================================================================ */

interface DealActivitiesSectionProps {
  dealId: string;
  users?: UserOption[];
  onChanged?: () => void;
}

export const DealActivitiesSection: React.FC<DealActivitiesSectionProps> = ({
  dealId,
  users = [],
  onChanged,
}) => {
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<DealActivity | null>(null);
  const [type, setType] = useState<ActivityType>('CALL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<ActivityStatus>('PENDING');
  const [priority, setPriority] = useState<ActivityPriority>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingActivity, setDeletingActivity] = useState<DealActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadActivities = useCallback(async () => {
    if (!dealId) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await dealService.getDealActivities(dealId);
      setActivities(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load deal activities.');
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const openCreateModal = () => {
    setEditingActivity(null);
    setType('CALL');
    setSubject('');
    setDescription('');
    setScheduledAt('');
    setStatus('PENDING');
    setPriority('MEDIUM');
    setAssignedToId('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (act: DealActivity) => {
    setEditingActivity(act);
    setType((act.type as ActivityType) || 'CALL');
    setSubject(act.subject || '');
    setDescription(act.description || '');
    setScheduledAt(act.scheduledAt ? act.scheduledAt.slice(0, 16) : '');
    setStatus((act.status as ActivityStatus) || 'PENDING');
    setPriority((act.priority as ActivityPriority) || 'MEDIUM');
    setAssignedToId(act.assignedToId || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!subject.trim()) {
      setFormError('Activity subject is required.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      if (editingActivity) {
        await dealService.updateActivity(editingActivity.id, {
          type,
          subject: subject.trim(),
          description: description.trim() || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          status,
          priority,
          assignedToId: assignedToId || undefined,
        });
      } else {
        await dealService.createActivity({
          dealId,
          type,
          subject: subject.trim(),
          description: description.trim() || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          status,
          priority,
          assignedToId: assignedToId || undefined,
        });
      }
      setIsModalOpen(false);
      await loadActivities();
      onChanged?.();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save deal activity.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickComplete = async (act: DealActivity) => {
    try {
      await dealService.updateActivity(act.id, { status: 'COMPLETED' });
      await loadActivities();
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to mark activity as completed.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingActivity) return;
    setIsDeleting(true);
    try {
      await dealService.deleteActivity(deletingActivity.id);
      setDeletingActivity(null);
      await loadActivities();
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete activity.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (statusFilter && act.status !== statusFilter) return false;
    if (typeFilter && act.type !== typeFilter) return false;
    return true;
  });

  return (
    <SectionCard
      title="Deal Activities"
      subtitle="Log calls, demos, negotiations, meetings, and follow-up activities for this deal."
      actions={
        <div className="lg-badge-row">
          <select
            className="lg-select ld-compact-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by activity type"
          >
            <option value="">All Types</option>
            {ACTIVITY_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className="lg-select ld-compact-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by activity status"
          >
            <option value="">All Statuses</option>
            {ACTIVITY_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <PrimaryButton size="small" onClick={openCreateModal}>
            <PlusIcon size={14} /> Log Activity
          </PrimaryButton>
        </div>
      }
    >
      {error && <div className="lg-inline-alert">{error}</div>}

      {isLoading ? (
        <div className="lg-state-box">
          <LoadingIndicator size="medium" message="Loading deal activities..." />
        </div>
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          title="No deal activities logged"
          description="Schedule calls, product demos, or stakeholder meetings to advance this opportunity."
          action={
            <PrimaryButton onClick={openCreateModal}>
              <PlusIcon size={15} /> Log First Activity
            </PrimaryButton>
          }
        />
      ) : (
        <div className="ld-cards-stack">
          {filteredActivities.map((act) => (
            <div key={act.id} className="ld-subcard">
              <div className="ld-subcard-top">
                <div className="lg-badge-row">
                  <Badge tone="blue">{humanize(act.type)}</Badge>
                  <Badge tone={activityStatusTone(act.status)}>
                    {humanize(act.status)}
                  </Badge>
                  <Badge tone={priorityTone(act.priority)}>
                    {humanize(act.priority)} Priority
                  </Badge>
                  <strong>{act.subject}</strong>
                </div>
                <div className="lg-row-actions">
                  {act.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      className="lg-icon-btn"
                      title="Mark Completed"
                      onClick={() => handleQuickComplete(act)}
                    >
                      <CheckCircleIcon size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="lg-icon-btn"
                    title="Edit Activity"
                    onClick={() => openEditModal(act)}
                  >
                    <EditIcon size={15} />
                  </button>
                  <button
                    type="button"
                    className="lg-icon-btn danger"
                    title="Delete Activity"
                    onClick={() => setDeletingActivity(act)}
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>

              {act.description && (
                <p className="ld-subcard-body">{act.description}</p>
              )}

              <div className="ld-subcard-meta">
                {act.scheduledAt && (
                  <span>
                    <CalendarIcon size={13} /> Scheduled: {formatDateTime(act.scheduledAt)}
                  </span>
                )}
                {act.assignedTo && <span>Assigned: {act.assignedTo.name}</span>}
                <span>Logged: {formatDateTime(act.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal
        isOpen={isModalOpen}
        title={editingActivity ? 'Edit Deal Activity' : 'Log Deal Activity'}
        subtitle="Record an interaction or schedule a follow-up step for this opportunity."
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        submitLabel={editingActivity ? 'Save Activity' : 'Log Activity'}
        isSaving={isSaving}
        error={formError}
      >
        <div className="lg-form-grid">
          <Field label="Activity Type" htmlFor="deal-act-type" required>
            <select
              id="deal-act-type"
              className="lg-select"
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
            >
              {ACTIVITY_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status" htmlFor="deal-act-status">
            <select
              id="deal-act-status"
              className="lg-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ActivityStatus)}
            >
              {ACTIVITY_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Priority" htmlFor="deal-act-priority">
            <select
              id="deal-act-priority"
              className="lg-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ActivityPriority)}
            >
              {ACTIVITY_PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Scheduled Date & Time" htmlFor="deal-act-scheduled">
            <input
              id="deal-act-scheduled"
              type="datetime-local"
              className="lg-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </Field>
        </div>

        <div className="ld-form-stack" style={{ marginTop: '0.85rem' }}>
          <Field label="Subject" htmlFor="deal-act-subject" required>
            <input
              id="deal-act-subject"
              type="text"
              className="lg-input"
              placeholder="e.g. Pricing & Contract Review with VP of Engineering"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Field>

          {users.length > 0 && (
            <Field label="Assign To" htmlFor="deal-act-assignee">
              <select
                id="deal-act-assignee"
                className="lg-select"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">— Current User —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Notes / Call Summary" htmlFor="deal-act-desc">
            <textarea
              id="deal-act-desc"
              className="lg-textarea"
              rows={3}
              placeholder="Key takeaways, objections discussed, and next steps..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
      </FormModal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingActivity)}
        title="Delete Deal Activity"
        message={`Are you sure you want to delete "${deletingActivity?.subject || 'this activity'}"?`}
        confirmLabel="Delete Activity"
        isLoading={isDeleting}
        onClose={() => setDeletingActivity(null)}
        onConfirm={handleConfirmDelete}
      />
    </SectionCard>
  );
};

/* ============================================================================
   3. DEAL NOTES SECTION
   ============================================================================ */

interface DealNotesSectionProps {
  dealId: string;
  onChanged?: () => void;
}

export const DealNotesSection: React.FC<DealNotesSectionProps> = ({
  dealId,
  onChanged,
}) => {
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DealNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingNote, setDeletingNote] = useState<DealNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!dealId) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await dealService.getDealNotes(dealId);
      setNotes(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load deal notes.');
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (note: DealNote) => {
    setEditingNote(note);
    setTitle(note.title || '');
    setContent(note.content || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setFormError('Note content is required.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      if (editingNote) {
        await dealService.updateNote(editingNote.id, {
          title: title.trim() || undefined,
          content: content.trim(),
        });
      } else {
        await dealService.createNote({
          dealId,
          title: title.trim() || undefined,
          content: content.trim(),
        });
      }
      setIsModalOpen(false);
      await loadNotes();
      onChanged?.();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save deal note.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    setIsDeleting(true);
    try {
      await dealService.deleteNote(deletingNote.id);
      setDeletingNote(null);
      await loadNotes();
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete deal note.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SectionCard
      title="Deal Notes"
      subtitle="Capture commercial terms, stakeholder requirements, pricing notes, and competitive intelligence."
      actions={
        <PrimaryButton size="small" onClick={openCreateModal}>
          <PlusIcon size={14} /> Add Note
        </PrimaryButton>
      }
    >
      {error && <div className="lg-inline-alert">{error}</div>}

      {isLoading ? (
        <div className="lg-state-box">
          <LoadingIndicator size="medium" message="Loading deal notes..." />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          title="No notes recorded for this deal"
          description="Document key discovery insights, commercial terms, or decision-maker feedback."
          action={
            <PrimaryButton onClick={openCreateModal}>
              <PlusIcon size={15} /> Add First Note
            </PrimaryButton>
          }
        />
      ) : (
        <div className="ld-cards-stack">
          {notes.map((note) => (
            <div key={note.id} className="ld-subcard">
              <div className="ld-subcard-top">
                <strong>{note.title || 'Deal Note'}</strong>
                <div className="lg-row-actions">
                  <button
                    type="button"
                    className="lg-icon-btn"
                    title="Edit Note"
                    onClick={() => openEditModal(note)}
                  >
                    <EditIcon size={15} />
                  </button>
                  <button
                    type="button"
                    className="lg-icon-btn danger"
                    title="Delete Note"
                    onClick={() => setDeletingNote(note)}
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>
              <p className="ld-subcard-body">{note.content}</p>
              <div className="ld-subcard-meta">
                <span>Author: {note.author?.name || 'CRM Team'}</span>
                <span>{formatDateTime(note.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal
        isOpen={isModalOpen}
        title={editingNote ? 'Edit Deal Note' : 'Add Deal Note'}
        subtitle="Notes are visible to team members collaborating on this opportunity."
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        submitLabel={editingNote ? 'Update Note' : 'Save Note'}
        isSaving={isSaving}
        error={formError}
      >
        <div className="ld-form-stack">
          <Field label="Note Title (Optional)" htmlFor="deal-note-title">
            <input
              id="deal-note-title"
              type="text"
              className="lg-input"
              placeholder="e.g. Commercial Proposal & Discount Approval"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Note Content" htmlFor="deal-note-content" required>
            <textarea
              id="deal-note-content"
              className="lg-textarea"
              rows={5}
              placeholder="Write detailed deal notes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Field>
        </div>
      </FormModal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingNote)}
        title="Delete Deal Note"
        message={`Are you sure you want to delete "${deletingNote?.title || 'this note'}"?`}
        confirmLabel="Delete Note"
        isLoading={isDeleting}
        onClose={() => setDeletingNote(null)}
        onConfirm={handleConfirmDelete}
      />
    </SectionCard>
  );
};

/* ============================================================================
   4. DEAL DOCUMENTS SECTION
   ============================================================================ */

interface DealDocumentsSectionProps {
  dealId: string;
  onChanged?: () => void;
}

export const DealDocumentsSection: React.FC<DealDocumentsSectionProps> = ({
  dealId,
  onChanged,
}) => {
  const [documents, setDocuments] = useState<DealDocumentRecord[]>([]);
  const [allWorkspaceFiles, setAllWorkspaceFiles] = useState<DealDocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedExistingFileId, setSelectedExistingFileId] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const [deletingDoc, setDeletingDoc] = useState<DealDocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!dealId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [dealDocs, workspaceDocs] = await Promise.all([
        dealService.getDealFiles(dealId),
        dealService.getAllFiles(),
      ]);
      setDocuments(dealDocs);
      setAllWorkspaceFiles(workspaceDocs);
    } catch (err: any) {
      setError(err?.message || 'Failed to load deal documents.');
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      await dealService.uploadAndAttachToDeal(dealId, file);
      await loadDocuments();
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload and attach file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAttachExisting = async () => {
    if (!selectedExistingFileId) return;
    setIsLinking(true);
    setError(null);
    try {
      await dealService.attachFileToDeal(selectedExistingFileId, dealId);
      setSelectedExistingFileId('');
      await loadDocuments();
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to attach existing document.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleDetach = async (doc: DealDocumentRecord) => {
    const att = (doc.attachments || []).find(
      (a) => a.dealId === dealId || (a.entityType === 'DEAL' && a.entityId === dealId),
    );
    try {
      await dealService.detachFile(doc.id, att?.id);
      await loadDocuments();
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to detach file from deal.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    try {
      await dealService.deleteFile(deletingDoc.id);
      setDeletingDoc(null);
      await loadDocuments();
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const unattachedFiles = allWorkspaceFiles.filter(
    (wf) => !documents.some((d) => d.id === wf.id),
  );

  return (
    <SectionCard
      title="Deal Documents & Proposals"
      subtitle="Upload proposals, MSAs, order forms, security questionnaires, and pricing decks."
      actions={
        <label className="auth-btn btn-primary btn-size-small" style={{ cursor: 'pointer' }}>
          <PlusIcon size={14} /> {isUploading ? 'Uploading...' : 'Upload Document'}
          <input
            type="file"
            style={{ display: 'none' }}
            disabled={isUploading}
            onChange={handleFileUpload}
          />
        </label>
      }
    >
      {error && <div className="lg-inline-alert">{error}</div>}

      {unattachedFiles.length > 0 && (
        <div
          className="lg-badge-row"
          style={{ marginBottom: '1rem', alignItems: 'center' }}
        >
          <select
            className="lg-select"
            style={{ maxWidth: '340px' }}
            value={selectedExistingFileId}
            onChange={(e) => setSelectedExistingFileId(e.target.value)}
            aria-label="Attach existing workspace file"
          >
            <option value="">— Link existing workspace document —</option>
            {unattachedFiles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.originalName || f.fileName} ({formatBytes(f.size)})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="auth-btn btn-secondary btn-size-small"
            disabled={!selectedExistingFileId || isLinking}
            onClick={handleAttachExisting}
          >
            {isLinking ? 'Linking...' : 'Attach to Deal'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="lg-state-box">
          <LoadingIndicator size="medium" message="Loading deal documents..." />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents attached to this deal"
          description="Upload proposals, contracts, or pricing sheets to keep deal collateral organized."
        />
      ) : (
        <div className="ld-cards-stack">
          {documents.map((doc) => (
            <div key={doc.id} className="ld-subcard">
              <div className="ld-subcard-top">
                <div className="lg-badge-row">
                  <Badge tone="blue">{doc.mimeType || 'Document'}</Badge>
                  <strong>{doc.originalName || doc.fileName}</strong>
                  <span className="lg-muted">({formatBytes(doc.size)})</span>
                </div>
                <div className="lg-row-actions">
                  {doc.path && (
                    <a
                      href={doc.path}
                      target="_blank"
                      rel="noreferrer"
                      className="auth-btn btn-secondary btn-size-small"
                    >
                      Open
                    </a>
                  )}
                  <button
                    type="button"
                    className="auth-btn btn-secondary btn-size-small"
                    onClick={() => handleDetach(doc)}
                  >
                    Detach
                  </button>
                  <button
                    type="button"
                    className="lg-icon-btn danger"
                    title="Delete File"
                    onClick={() => setDeletingDoc(doc)}
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>
              <div className="ld-subcard-meta">
                <span>Uploaded by: {doc.uploadedBy?.name || 'CRM User'}</span>
                <span>{formatDateTime(doc.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deletingDoc)}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${deletingDoc?.originalName || deletingDoc?.fileName || 'this file'}"?`}
        confirmLabel="Delete Document"
        isLoading={isDeleting}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleConfirmDelete}
      />
    </SectionCard>
  );
};
