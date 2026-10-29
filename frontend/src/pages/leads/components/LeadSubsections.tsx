import React, { useCallback, useEffect, useState } from 'react';
import { leadService } from '../../../services/lead.service';
import type {
  LeadActivity,
  LeadNote,
  LeadTimelineEvent,
  LeadDocumentRecord,
  ActivityType,
  ActivityStatus,
  ActivityPriority,
} from '../../../types/lead.types';
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
} from '../leadConstants';
import {
  ActivityIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  PlusIcon,
  RefreshCwIcon,
  TrashIcon,
} from '../../../components/common/Icons';

/* ============================================================================
   1. ACTIVITY TIMELINE SECTION
   ============================================================================ */

interface LeadTimelineSectionProps {
  leadId: string;
}

export const LeadTimelineSection: React.FC<LeadTimelineSectionProps> = ({ leadId }) => {
  const [events, setEvents] = useState<LeadTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await leadService.getLeadTimeline(leadId);
      setEvents(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load lead timeline.');
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const toneForEvent = (type: string) => {
    switch (type) {
      case 'LEAD_CREATED':
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
      title="Chronological Activity Timeline"
      subtitle="Unified stream of lead creation, logged outreach, tasks, and notes."
      actions={
        <button type="button" className="lg-icon-btn" onClick={loadTimeline} title="Refresh timeline">
          <RefreshCwIcon size={15} />
        </button>
      }
    >
      {error && <div className="lg-inline-alert">{error}</div>}

      {isLoading ? (
        <div className="lg-state-box">
          <LoadingIndicator size="medium" message="Loading timeline..." />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No timeline events yet"
          description="Activities, notes, and tasks recorded for this lead will appear here chronologically."
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
                    <strong>{ev.title}</strong>
                  </div>
                  <span className="lg-muted">{formatDateTime(ev.date)}</span>
                </div>
                {ev.data?.description && (
                  <p className="ld-timeline-desc">{ev.data.description}</p>
                )}
                {ev.data?.content && <p className="ld-timeline-desc">{ev.data.content}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

/* ============================================================================
   2. LEAD ACTIVITIES SECTION
   ============================================================================ */

interface LeadActivitiesSectionProps {
  leadId: string;
  users?: UserOption[];
  onChanged?: (msg?: string) => void;
}

export const LeadActivitiesSection: React.FC<LeadActivitiesSectionProps> = ({
  leadId,
  users = [],
  onChanged,
}) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LeadActivity | null>(null);
  const [type, setType] = useState<ActivityType>('CALL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<ActivityStatus>('PENDING');
  const [priority, setPriority] = useState<ActivityPriority>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete state
  const [activityToDelete, setActivityToDelete] = useState<LeadActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadActivities = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    try {
      const list = await leadService.getLeadActivities(leadId);
      setActivities(list);
    } catch {
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

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

  const openEditModal = (act: LeadActivity) => {
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

  const handleSaveActivity = async () => {
    if (!subject.trim()) {
      setFormError('Activity subject is required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const isoSchedule = scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
      if (editingActivity) {
        await leadService.updateActivity(editingActivity.id, {
          type,
          subject: subject.trim(),
          description: description.trim() || undefined,
          scheduledAt: isoSchedule,
          status,
          priority,
          assignedToId: assignedToId || undefined,
        });
        onChanged?.(`Updated activity "${subject.trim()}".`);
      } else {
        await leadService.createActivity({
          leadId,
          type,
          subject: subject.trim(),
          description: description.trim() || undefined,
          scheduledAt: isoSchedule,
          status,
          priority,
          assignedToId: assignedToId || undefined,
        });
        onChanged?.(`Logged ${type} activity "${subject.trim()}".`);
      }
      setIsModalOpen(false);
      await loadActivities();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save activity.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (act: LeadActivity) => {
    const nextStatus: ActivityStatus = act.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await leadService.updateActivity(act.id, { status: nextStatus });
      await loadActivities();
      onChanged?.(`Activity "${act.subject}" marked as ${nextStatus}.`);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update activity status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    try {
      await leadService.deleteActivity(activityToDelete.id);
      setActivityToDelete(null);
      await loadActivities();
      onChanged?.('Activity deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredActivities = activities.filter((a) => {
    if (typeFilter && a.type !== typeFilter) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <SectionCard
        title={`Lead Activities (${filteredActivities.length})`}
        subtitle="Calls, emails, meetings, WhatsApp messages, and follow-ups logged for this lead."
        actions={
          <div className="ld-section-toolbar">
            <select
              className="lg-select ld-compact-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter activities by type"
            >
              <option value="">All Types</option>
              {ACTIVITY_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              className="lg-select ld-compact-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter activities by status"
            >
              <option value="">All Statuses</option>
              {ACTIVITY_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <button type="button" className="auth-btn btn-primary" onClick={openCreateModal}>
              <PlusIcon size={15} />
              <span>Log Activity</span>
            </button>
          </div>
        }
      >
        {isLoading ? (
          <div className="lg-state-box">
            <LoadingIndicator size="medium" message="Loading activities..." />
          </div>
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon size={28} />}
            title="No activities recorded"
            description="Log a phone call, email, discovery meeting, or follow-up for this lead."
            action={
              <button type="button" className="auth-btn btn-primary" onClick={openCreateModal}>
                <PlusIcon size={15} />
                <span>Log First Activity</span>
              </button>
            }
          />
        ) : (
          <div className="ld-items-stack">
            {filteredActivities.map((act) => (
              <div key={act.id} className="ld-item-card">
                <div className="ld-item-card-top">
                  <div className="lg-badge-row">
                    <Badge tone="blue">{humanize(act.type)}</Badge>
                    <Badge tone={activityStatusTone(act.status)}>{humanize(act.status)}</Badge>
                    <Badge tone={priorityTone(act.priority)}>{humanize(act.priority)}</Badge>
                    <strong className="ld-item-title">{act.subject}</strong>
                  </div>

                  <div className="lg-row-actions">
                    <button
                      type="button"
                      className="lg-icon-btn"
                      onClick={() => handleToggleComplete(act)}
                      title={
                        act.status === 'COMPLETED' ? 'Reopen as Pending' : 'Mark as Completed'
                      }
                    >
                      <CheckCircleIcon size={15} />
                    </button>
                    <button
                      type="button"
                      className="lg-icon-btn"
                      onClick={() => openEditModal(act)}
                      title="Edit Activity"
                    >
                      <EditIcon size={15} />
                    </button>
                    <button
                      type="button"
                      className="lg-icon-btn danger"
                      onClick={() => setActivityToDelete(act)}
                      title="Delete Activity"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>

                {act.description && <p className="ld-item-body">{act.description}</p>}

                <div className="ld-item-meta">
                  {act.scheduledAt && (
                    <span>
                      <CalendarIcon size={12} /> Scheduled: {formatDateTime(act.scheduledAt)}
                    </span>
                  )}
                  <span>
                    <ClockIcon size={12} /> Logged: {formatDateTime(act.createdAt)}
                  </span>
                  {act.assignedTo?.name && <span>Assignee: {act.assignedTo.name}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Log / Edit Activity Modal */}
      <FormModal
        isOpen={isModalOpen}
        title={editingActivity ? 'Edit Lead Activity' : 'Log New Lead Activity'}
        subtitle="Record outreach, schedule a discovery call, or log a follow-up."
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveActivity}
        isSaving={isSaving}
        submitLabel={editingActivity ? 'Update Activity' : 'Log Activity'}
        error={formError}
      >
        <div className="lg-form-grid">
          <Field label="Activity Type" htmlFor="act-type" required>
            <select
              id="act-type"
              className="lg-select"
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
            >
              {ACTIVITY_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status" htmlFor="act-status">
            <select
              id="act-status"
              className="lg-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ActivityStatus)}
            >
              {ACTIVITY_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subject" htmlFor="act-subject" required className="lg-span-2">
            <input
              id="act-subject"
              className="lg-input"
              placeholder="e.g. Initial Discovery Call & Architecture Review"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Field>

          <Field label="Priority" htmlFor="act-priority">
            <select
              id="act-priority"
              className="lg-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ActivityPriority)}
            >
              {ACTIVITY_PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Scheduled Date & Time" htmlFor="act-scheduled">
            <input
              id="act-scheduled"
              type="datetime-local"
              className="lg-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </Field>

          {users.length > 0 && (
            <Field label="Assigned To" htmlFor="act-assignee" className="lg-span-2">
              <select
                id="act-assignee"
                className="lg-select"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">— Current User / Default —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Notes / Description" htmlFor="act-desc" className="lg-span-2">
            <textarea
              id="act-desc"
              className="lg-textarea"
              rows={3}
              placeholder="Key takeaways, next steps, or agenda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
      </FormModal>

      <ConfirmDeleteModal
        isOpen={Boolean(activityToDelete)}
        title="Delete Activity"
        message={`Are you sure you want to delete the activity "${activityToDelete?.subject}"?`}
        itemName={activityToDelete?.subject}
        isLoading={isDeleting}
        onClose={() => setActivityToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

/* ============================================================================
   3. LEAD NOTES SECTION
   ============================================================================ */

interface LeadNotesSectionProps {
  leadId: string;
  onChanged?: (msg?: string) => void;
}

export const LeadNotesSection: React.FC<LeadNotesSectionProps> = ({ leadId, onChanged }) => {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Quick note composer & edit modal
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const [editingNote, setEditingNote] = useState<LeadNote | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [noteToDelete, setNoteToDelete] = useState<LeadNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    try {
      const list = await leadService.getLeadNotes(leadId);
      setNotes(list);
    } catch {
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      setComposerError('Note content cannot be empty.');
      return;
    }

    setIsCreating(true);
    setComposerError(null);
    try {
      await leadService.createNote({
        leadId,
        title: noteTitle.trim() || undefined,
        content: noteContent.trim(),
      });
      setNoteTitle('');
      setNoteContent('');
      await loadNotes();
      onChanged?.('Note added to lead.');
    } catch (err: any) {
      setComposerError(err?.message || 'Failed to add note.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editContent.trim()) return;
    setIsUpdating(true);
    try {
      await leadService.updateNote(editingNote.id, {
        title: editTitle.trim() || undefined,
        content: editContent.trim(),
      });
      setEditingNote(null);
      await loadNotes();
      onChanged?.('Note updated.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      await leadService.deleteNote(noteToDelete.id);
      setNoteToDelete(null);
      await loadNotes();
      onChanged?.('Note deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  const visibleNotes = notes.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <SectionCard
        title={`Lead Notes (${visibleNotes.length})`}
        subtitle="Capture discovery call notes, stakeholder requirements, and internal team context."
        actions={
          <input
            type="search"
            className="lg-input ld-compact-search"
            placeholder="Filter notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter notes"
          />
        }
      >
        {/* Note Composer */}
        <form className="ld-note-composer" onSubmit={handleAddNote} noValidate>
          {composerError && <div className="lg-inline-alert">{composerError}</div>}
          <input
            className="lg-input"
            placeholder="Note title (optional, e.g. Discovery Call Summary)"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <textarea
            className="lg-textarea"
            rows={3}
            placeholder="Write a note about this lead..."
            value={noteContent}
            onChange={(e) => {
              setNoteContent(e.target.value);
              if (composerError) setComposerError(null);
            }}
          />
          <div className="ld-note-composer-actions">
            <PrimaryButton
              type="submit"
              fullWidth={false}
              isLoading={isCreating}
              loadingText="Saving..."
              icon={<PlusIcon size={15} />}
            >
              Add Note
            </PrimaryButton>
          </div>
        </form>

        {/* Notes Stream */}
        {isLoading ? (
          <div className="lg-state-box">
            <LoadingIndicator size="medium" message="Loading notes..." />
          </div>
        ) : visibleNotes.length === 0 ? (
          <EmptyState
            title="No notes yet"
            description="Use the form above to attach your first note to this lead."
          />
        ) : (
          <div className="ld-items-stack">
            {visibleNotes.map((note) => (
              <div key={note.id} className="ld-item-card">
                <div className="ld-item-card-top">
                  <div>
                    <strong className="ld-item-title">{note.title || 'Lead Note'}</strong>
                    <span className="lg-muted ld-note-author">
                      {' '}
                      · by {note.author?.name || 'Team Member'} on {formatDateTime(note.createdAt)}
                    </span>
                  </div>
                  <div className="lg-row-actions">
                    <button
                      type="button"
                      className="lg-icon-btn"
                      onClick={() => {
                        setEditingNote(note);
                        setEditTitle(note.title || '');
                        setEditContent(note.content || '');
                      }}
                      title="Edit Note"
                    >
                      <EditIcon size={15} />
                    </button>
                    <button
                      type="button"
                      className="lg-icon-btn danger"
                      onClick={() => setNoteToDelete(note)}
                      title="Delete Note"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
                <p className="ld-item-body">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Edit Note Modal */}
      <FormModal
        isOpen={Boolean(editingNote)}
        title="Edit Lead Note"
        onClose={() => setEditingNote(null)}
        onSubmit={handleUpdateNote}
        isSaving={isUpdating}
        submitLabel="Update Note"
      >
        <div className="ld-modal-stack">
          <Field label="Note Title (Optional)" htmlFor="edit-note-title">
            <input
              id="edit-note-title"
              className="lg-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </Field>
          <Field label="Note Content" htmlFor="edit-note-content" required>
            <textarea
              id="edit-note-content"
              className="lg-textarea"
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          </Field>
        </div>
      </FormModal>

      <ConfirmDeleteModal
        isOpen={Boolean(noteToDelete)}
        title="Delete Note"
        message="Are you sure you want to permanently delete this note?"
        itemName={noteToDelete?.title || 'Lead Note'}
        isLoading={isDeleting}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

/* ============================================================================
   4. LEAD DOCUMENTS SECTION
   ============================================================================ */

interface LeadDocumentsSectionProps {
  leadId: string;
  onChanged?: (msg?: string) => void;
}

export const LeadDocumentsSection: React.FC<LeadDocumentsSectionProps> = ({
  leadId,
  onChanged,
}) => {
  const [documents, setDocuments] = useState<LeadDocumentRecord[]>([]);
  const [allWorkspaceFiles, setAllWorkspaceFiles] = useState<LeadDocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedExistingFileId, setSelectedExistingFileId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [docToRemove, setDocToRemove] = useState<{
    doc: LeadDocumentRecord;
    mode: 'detach' | 'delete';
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    setError(null);
    try {
      const all = await leadService.getAllFiles();
      setAllWorkspaceFiles(all);
      const attached = all.filter((f) =>
        (f.attachments || []).some(
          (att) => att.leadId === leadId || (att.entityType === 'LEAD' && att.entityId === leadId),
        ),
      );
      setDocuments(attached);
    } catch (err: any) {
      setError(err?.message || 'Failed to load lead documents.');
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      await leadService.uploadAndAttachToLead(leadId, file);
      e.target.value = '';
      await loadDocuments();
      onChanged?.(`Uploaded and attached "${file.name}".`);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAttachExisting = async () => {
    if (!selectedExistingFileId) return;
    setIsUploading(true);
    setError(null);
    try {
      await leadService.attachFileToLead(selectedExistingFileId, leadId);
      setSelectedExistingFileId('');
      await loadDocuments();
      onChanged?.('Attached existing document to lead.');
    } catch (err: any) {
      setError(err?.message || 'Failed to attach document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!docToRemove) return;
    setIsRemoving(true);
    try {
      if (docToRemove.mode === 'delete') {
        await leadService.deleteFile(docToRemove.doc.id);
        onChanged?.(`Deleted file "${docToRemove.doc.originalName}".`);
      } else {
        const att = (docToRemove.doc.attachments || []).find(
          (a) => a.leadId === leadId || (a.entityType === 'LEAD' && a.entityId === leadId),
        );
        await leadService.detachFile(docToRemove.doc.id, att?.id);
        onChanged?.(`Detached "${docToRemove.doc.originalName}" from lead.`);
      }
      setDocToRemove(null);
      await loadDocuments();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove document.');
    } finally {
      setIsRemoving(false);
    }
  };

  const unattachedFiles = allWorkspaceFiles.filter(
    (f) => !documents.some((d) => d.id === f.id),
  );

  return (
    <>
      <SectionCard
        title={`Lead Documents & Attachments (${documents.length})`}
        subtitle="Proposals, NDAs, RFP documents, and pitch decks linked to this lead."
      >
        {error && <div className="lg-inline-alert">{error}</div>}

        <div className="ld-doc-upload-bar">
          <label className="ld-upload-dropzone">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="ld-hidden-file-input"
            />
            <PlusIcon size={18} />
            <div>
              <strong>{isUploading ? 'Uploading document...' : 'Upload new document'}</strong>
              <span className="lg-field-hint">
                Click to select a PDF, Word, spreadsheet, or image file to attach to this lead.
              </span>
            </div>
          </label>

          {unattachedFiles.length > 0 && (
            <div className="ld-attach-existing-box">
              <select
                className="lg-select"
                value={selectedExistingFileId}
                onChange={(e) => setSelectedExistingFileId(e.target.value)}
                aria-label="Select existing workspace file"
              >
                <option value="">— Or link existing workspace file —</option>
                {unattachedFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.originalName} ({formatBytes(f.size)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="auth-btn btn-secondary"
                disabled={!selectedExistingFileId || isUploading}
                onClick={handleAttachExisting}
              >
                Attach File
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="lg-state-box">
            <LoadingIndicator size="medium" message="Loading documents..." />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            title="No documents attached"
            description="Upload a proposal, NDA, or discovery document above to link it to this lead."
          />
        ) : (
          <div className="ld-docs-grid">
            {documents.map((doc) => (
              <div key={doc.id} className="ld-doc-card">
                <div className="ld-doc-info">
                  <strong className="ld-doc-name">{doc.originalName}</strong>
                  <div className="lg-badge-row">
                    <Badge tone="slate">{doc.mimeType || 'Document'}</Badge>
                    <span className="lg-muted">{formatBytes(doc.size)}</span>
                  </div>
                  <span className="lg-muted">
                    Uploaded {formatDateTime(doc.createdAt)}
                    {doc.uploadedBy?.name ? ` by ${doc.uploadedBy.name}` : ''}
                  </span>
                </div>
                <div className="ld-doc-actions">
                  <button
                    type="button"
                    className="auth-btn btn-ghost"
                    onClick={() => setDocToRemove({ doc, mode: 'detach' })}
                  >
                    Detach
                  </button>
                  <button
                    type="button"
                    className="lg-icon-btn danger"
                    onClick={() => setDocToRemove({ doc, mode: 'delete' })}
                    title="Delete file permanently"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <ConfirmDeleteModal
        isOpen={Boolean(docToRemove)}
        title={
          docToRemove?.mode === 'delete'
            ? 'Permanently Delete Document'
            : 'Detach Document from Lead'
        }
        message={
          docToRemove?.mode === 'delete'
            ? `Are you sure you want to permanently delete "${docToRemove.doc.originalName}" from the CRM?`
            : `Are you sure you want to detach "${docToRemove?.doc.originalName}" from this lead?`
        }
        itemName={docToRemove?.doc.originalName}
        confirmLabel={docToRemove?.mode === 'delete' ? 'Delete File' : 'Detach File'}
        isLoading={isRemoving}
        onClose={() => setDocToRemove(null)}
        onConfirm={handleConfirmRemove}
      />
    </>
  );
};

