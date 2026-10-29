import React, { useCallback, useEffect, useState } from 'react';
import { contactService } from '../../../services/contact.service';
import type {
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  ContactActivity,
  ContactDocumentRecord,
  ContactNote,
  ContactTimelineEvent,
} from '../../../types/contact.types';
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
   1. CONTACT ACTIVITY TIMELINE SECTION
   ============================================================================ */

interface ContactTimelineSectionProps {
  contactId: string;
}

export const ContactTimelineSection: React.FC<ContactTimelineSectionProps> = ({ contactId }) => {
  const [events, setEvents] = useState<ContactTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    if (!contactId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await contactService.getContactTimeline(contactId);
      setEvents(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load contact timeline.');
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const toneForEvent = (type: string) => {
    switch (type) {
      case 'CONTACT_CREATED':
        return 'green';
      case 'ACTIVITY':
        return 'blue';
      case 'NOTE':
        return 'purple';
      case 'TASK':
        return 'amber';
      case 'DEAL':
        return 'green';
      default:
        return 'slate';
    }
  };

  return (
    <SectionCard
      title="Chronological Activity Timeline"
      subtitle="Unified stream of contact profile history, logged outreach, linked deals, tasks, and notes."
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
          <LoadingIndicator size="medium" message="Loading timeline..." />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No timeline events yet"
          description="Activities, notes, tasks, and deals recorded for this contact will appear here chronologically."
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
   2. CONTACT ACTIVITIES SECTION
   ============================================================================ */

interface ContactActivitiesSectionProps {
  contactId: string;
  users?: UserOption[];
  canEdit?: boolean;
  canDelete?: boolean;
  onChanged?: (msg?: string) => void;
}

export const ContactActivitiesSection: React.FC<ContactActivitiesSectionProps> = ({
  contactId,
  users = [],
  canEdit = true,
  canDelete = true,
  onChanged,
}) => {
  const [activities, setActivities] = useState<ContactActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ContactActivity | null>(null);
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
  const [activityToDelete, setActivityToDelete] = useState<ContactActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadActivities = useCallback(async () => {
    if (!contactId) return;
    setIsLoading(true);
    try {
      const list = await contactService.getContactActivities(contactId);
      setActivities(list);
    } catch {
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

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

  const openEditModal = (act: ContactActivity) => {
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
        await contactService.updateActivity(editingActivity.id, {
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
        await contactService.createActivity({
          contactId,
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

  const handleToggleComplete = async (act: ContactActivity) => {
    const nextStatus: ActivityStatus = act.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await contactService.updateActivity(act.id, { status: nextStatus });
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
      await contactService.deleteActivity(activityToDelete.id);
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
        title={`Contact Activities (${filteredActivities.length})`}
        subtitle="Calls, emails, meetings, WhatsApp messages, and follow-ups logged for this contact."
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

            {canEdit && (
              <button
                type="button"
                className="auth-btn btn-primary"
                onClick={openCreateModal}
                id="btn-log-contact-activity"
              >
                <PlusIcon size={15} />
                <span>Log Activity</span>
              </button>
            )}
          </div>
        }
      >
        {isLoading ? (
          <div className="lg-state-box">
            <LoadingIndicator size="medium" message="Loading activities..." />
          </div>
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            title="No activities logged yet"
            description="Record calls, emails, meetings, or follow-ups to track engagement with this contact."
            action={
              canEdit ? (
                <button
                  type="button"
                  className="auth-btn btn-primary"
                  onClick={openCreateModal}
                >
                  <PlusIcon size={15} />
                  <span>Log First Activity</span>
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="ld-items-stack">
            {filteredActivities.map((act) => (
              <div key={act.id} className="ld-subcard">
                <div className="ld-subcard-top">
                  <div className="lg-badge-row">
                    <Badge tone="blue">{humanize(act.type)}</Badge>
                    <Badge tone={activityStatusTone(act.status)}>{humanize(act.status)}</Badge>
                    <Badge tone={priorityTone(act.priority)}>
                      Priority: {humanize(act.priority)}
                    </Badge>
                  </div>
                  <div className="lg-row-actions">
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          className="lg-icon-btn"
                          title={
                            act.status === 'COMPLETED' ? 'Mark as Pending' : 'Mark as Completed'
                          }
                          onClick={() => handleToggleComplete(act)}
                        >
                          <CheckCircleIcon size={15} />
                        </button>
                        <button
                          type="button"
                          className="lg-icon-btn"
                          title="Edit Activity"
                          onClick={() => openEditModal(act)}
                        >
                          <EditIcon size={15} />
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="lg-icon-btn lg-icon-danger"
                        title="Delete Activity"
                        onClick={() => setActivityToDelete(act)}
                      >
                        <TrashIcon size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="ld-subcard-title">{act.subject}</h4>
                {act.description && <p className="ld-subcard-body">{act.description}</p>}

                <div className="ld-subcard-meta">
                  {act.scheduledAt && (
                    <span>
                      <CalendarIcon size={12} /> Scheduled: {formatDateTime(act.scheduledAt)}
                    </span>
                  )}
                  {act.assignedTo && <span>Assigned to: {act.assignedTo.name}</span>}
                  <span>
                    <ClockIcon size={12} /> Logged {formatDateTime(act.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <FormModal
        isOpen={isModalOpen}
        title={editingActivity ? 'Edit Contact Activity' : 'Log Contact Activity'}
        subtitle="Record an outreach touchpoint or schedule a follow-up activity for this contact."
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveActivity}
        submitLabel={editingActivity ? 'Update Activity' : 'Save Activity'}
        isSaving={isSaving}
      >
        {formError && <div className="lg-inline-alert">{formError}</div>}

        <div className="lg-form-grid">
          <Field label="Activity Type" htmlFor="contact-act-type" required>
            <select
              id="contact-act-type"
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

          <Field label="Priority" htmlFor="contact-act-priority">
            <select
              id="contact-act-priority"
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

          <Field
            label="Subject"
            htmlFor="contact-act-subject"
            required
            className="lg-span-2"
          >
            <input
              id="contact-act-subject"
              className="lg-input"
              placeholder="e.g. Quarterly Business Review & Renewal Discussion"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Field>

          <Field label="Scheduled Date & Time" htmlFor="contact-act-schedule">
            <input
              id="contact-act-schedule"
              type="datetime-local"
              className="lg-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </Field>

          <Field label="Status" htmlFor="contact-act-status">
            <select
              id="contact-act-status"
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

          {users.length > 0 && (
            <Field
              label="Assigned Representative"
              htmlFor="contact-act-assignee"
              className="lg-span-2"
            >
              <select
                id="contact-act-assignee"
                className="lg-select"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">Current User / Default</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field
            label="Notes & Call Summary"
            htmlFor="contact-act-desc"
            className="lg-span-2"
          >
            <textarea
              id="contact-act-desc"
              className="lg-textarea"
              rows={3}
              placeholder="Key takeaways, stakeholder questions, and agreed next steps..."
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
        confirmLabel="Delete Activity"
        onConfirm={handleConfirmDelete}
        onClose={() => setActivityToDelete(null)}
        isLoading={isDeleting}
      />
    </>
  );
};

/* ============================================================================
   3. CONTACT NOTES SECTION
   ============================================================================ */

interface ContactNotesSectionProps {
  contactId: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onChanged?: (msg?: string) => void;
}

export const ContactNotesSection: React.FC<ContactNotesSectionProps> = ({
  contactId,
  canEdit = true,
  canDelete = true,
  onChanged,
}) => {
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Quick add composer
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // Edit modal
  const [editingNote, setEditingNote] = useState<ContactNote | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal
  const [noteToDelete, setNoteToDelete] = useState<ContactNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!contactId) return;
    setIsLoading(true);
    try {
      const list = await contactService.getContactNotes(contactId);
      setNotes(list);
    } catch {
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      setComposerError('Note content is required.');
      return;
    }

    setIsAdding(true);
    setComposerError(null);
    try {
      await contactService.createNote({
        contactId,
        title: newTitle.trim() || undefined,
        content: newContent.trim(),
      });
      setNewTitle('');
      setNewContent('');
      await loadNotes();
      onChanged?.('Note added to contact.');
    } catch (err: any) {
      setComposerError(err?.message || 'Failed to save note.');
    } finally {
      setIsAdding(false);
    }
  };

  const openEditModal = (note: ContactNote) => {
    setEditingNote(note);
    setEditTitle(note.title || '');
    setEditContent(note.content || '');
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editContent.trim()) return;
    setIsUpdating(true);
    try {
      await contactService.updateNote(editingNote.id, {
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
      await contactService.deleteNote(noteToDelete.id);
      setNoteToDelete(null);
      await loadNotes();
      onChanged?.('Note deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <SectionCard
        title={`Contact Notes (${filteredNotes.length})`}
        subtitle="Collaborate with your team by recording meeting takeaways, stakeholder preferences, and account context."
        actions={
          <input
            type="search"
            className="lg-input ld-compact-search"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search contact notes"
          />
        }
      >
        {/* Inline Note Composer */}
        {canEdit && (
          <form className="ld-note-composer" onSubmit={handleAddNote}>
            {composerError && <div className="lg-inline-alert">{composerError}</div>}
            <input
              className="lg-input"
              placeholder="Note title (optional, e.g. Executive Sponsor Alignment)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              className="lg-textarea"
              rows={3}
              placeholder="Write a note about this contact..."
              value={newContent}
              onChange={(e) => {
                setNewContent(e.target.value);
                if (composerError) setComposerError(null);
              }}
            />
            <div className="ld-note-composer-actions">
              <div className="ld-submit-btn-wrap">
                <PrimaryButton type="submit" isLoading={isAdding}>
                  Add Note
                </PrimaryButton>
              </div>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="lg-state-box">
            <LoadingIndicator size="medium" message="Loading notes..." />
          </div>
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            title="No notes recorded yet"
            description="Use the form above to add your first note for this contact."
          />
        ) : (
          <div className="ld-items-stack">
            {filteredNotes.map((note) => (
              <div key={note.id} className="ld-subcard">
                <div className="ld-subcard-top">
                  <strong>{note.title || 'Untitled Note'}</strong>
                  <div className="lg-row-actions">
                    {canEdit && (
                      <button
                        type="button"
                        className="lg-icon-btn"
                        title="Edit Note"
                        onClick={() => openEditModal(note)}
                      >
                        <EditIcon size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="lg-icon-btn lg-icon-danger"
                        title="Delete Note"
                        onClick={() => setNoteToDelete(note)}
                      >
                        <TrashIcon size={15} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="ld-subcard-body">{note.content}</p>
                <div className="ld-subcard-meta">
                  <span>By {note.author?.name || 'Team Member'}</span>
                  <span>·</span>
                  <span>{formatDateTime(note.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <FormModal
        isOpen={Boolean(editingNote)}
        title="Edit Contact Note"
        onClose={() => setEditingNote(null)}
        onSubmit={handleUpdateNote}
        submitLabel="Save Changes"
        isSaving={isUpdating}
      >
        <div className="ld-form-stack">
          <Field label="Note Title" htmlFor="edit-contact-note-title">
            <input
              id="edit-contact-note-title"
              className="lg-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </Field>
          <Field label="Note Content" htmlFor="edit-contact-note-content" required>
            <textarea
              id="edit-contact-note-content"
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
        message={`Are you sure you want to permanently delete "${noteToDelete?.title || 'this note'}"?`}
        confirmLabel="Delete Note"
        onConfirm={handleConfirmDelete}
        onClose={() => setNoteToDelete(null)}
        isLoading={isDeleting}
      />
    </>
  );
};

/* ============================================================================
   4. CONTACT DOCUMENTS SECTION
   ============================================================================ */

interface ContactDocumentsSectionProps {
  contactId: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onChanged?: (msg?: string) => void;
}

export const ContactDocumentsSection: React.FC<ContactDocumentsSectionProps> = ({
  contactId,
  canEdit = true,
  canDelete = true,
  onChanged,
}) => {
  const [files, setFiles] = useState<ContactDocumentRecord[]>([]);
  const [allWorkspaceFiles, setAllWorkspaceFiles] = useState<ContactDocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [existingFileId, setExistingFileId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<ContactDocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!contactId) return;
    setIsLoading(true);
    setError(null);
    try {
      const all = await contactService.getAllFiles();
      setAllWorkspaceFiles(all);
      const attached = all.filter((f) =>
        (f.attachments || []).some(
          (att) =>
            att.contactId === contactId ||
            (att.entityType === 'CONTACT' && att.entityId === contactId),
        ),
      );
      setFiles(attached);
    } catch (err: any) {
      setError(err?.message || 'Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    try {
      await contactService.uploadAndAttachToContact(contactId, selectedFile);
      e.target.value = '';
      await loadFiles();
      onChanged?.(`Uploaded and attached "${selectedFile.name}".`);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAttachExisting = async () => {
    if (!existingFileId) return;
    setIsUploading(true);
    setError(null);
    try {
      await contactService.attachFileToContact(existingFileId, contactId);
      setExistingFileId('');
      await loadFiles();
      onChanged?.('Attached existing workspace file to contact.');
    } catch (err: any) {
      setError(err?.message || 'Failed to attach existing file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDetach = async (doc: ContactDocumentRecord) => {
    const att = (doc.attachments || []).find(
      (a) =>
        a.contactId === contactId ||
        (a.entityType === 'CONTACT' && a.entityId === contactId),
    );
    try {
      await contactService.detachFile(doc.id, att?.id);
      await loadFiles();
      onChanged?.(`Detached "${doc.originalName}" from contact.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to detach document.');
    }
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await contactService.deleteFile(fileToDelete.id);
      setFileToDelete(null);
      await loadFiles();
      onChanged?.('Document permanently deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  const unattachedFiles = allWorkspaceFiles.filter(
    (wf) => !files.some((af) => af.id === wf.id),
  );

  return (
    <>
      <SectionCard
        title={`Contact Documents & Attachments (${files.length})`}
        subtitle="Upload contracts, NDAs, pitch decks, and supporting documents linked to this contact."
      >
        {error && <div className="lg-inline-alert">{error}</div>}

        {canEdit && (
          <div className="ld-doc-upload-bar">
            <label className="ld-upload-dropzone">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
              <span className="auth-btn btn-primary">
                <PlusIcon size={15} />
                <span>{isUploading ? 'Uploading...' : 'Upload New Document'}</span>
              </span>
              <span className="lg-muted">
                Supports PDF, DOCX, XLSX, CSV, PNG, JPG — automatically attached to this contact.
              </span>
            </label>

            {unattachedFiles.length > 0 && (
              <div className="ld-attach-existing-row">
                <select
                  className="lg-select"
                  value={existingFileId}
                  onChange={(e) => setExistingFileId(e.target.value)}
                  aria-label="Select existing workspace file to attach"
                >
                  <option value="">Or link an existing workspace file...</option>
                  {unattachedFiles.map((uf) => (
                    <option key={uf.id} value={uf.id}>
                      {uf.originalName} ({formatBytes(uf.size)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="auth-btn btn-secondary"
                  disabled={!existingFileId || isUploading}
                  onClick={handleAttachExisting}
                >
                  Attach File
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="lg-state-box">
            <LoadingIndicator size="medium" message="Loading documents..." />
          </div>
        ) : files.length === 0 ? (
          <EmptyState
            title="No documents attached to this contact"
            description="Upload a contract, proposal, or presentation above to attach it to this contact record."
          />
        ) : (
          <div className="ld-items-stack">
            {files.map((doc) => (
              <div key={doc.id} className="ld-subcard ld-doc-card">
                <div className="ld-doc-info">
                  <strong>{doc.originalName}</strong>
                  <div className="ld-subcard-meta">
                    <Badge tone="slate">{doc.mimeType || 'application/octet-stream'}</Badge>
                    <span>{formatBytes(doc.size)}</span>
                    <span>·</span>
                    <span>Uploaded {formatDateTime(doc.createdAt)}</span>
                    {doc.uploadedBy?.name && (
                      <>
                        <span>·</span>
                        <span>By {doc.uploadedBy.name}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="lg-row-actions">
                  {canEdit && (
                    <button
                      type="button"
                      className="auth-btn btn-secondary"
                      onClick={() => handleDetach(doc)}
                    >
                      Detach
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      className="lg-icon-btn lg-icon-danger"
                      title="Delete File Record"
                      onClick={() => setFileToDelete(doc)}
                    >
                      <TrashIcon size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <ConfirmDeleteModal
        isOpen={Boolean(fileToDelete)}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${fileToDelete?.originalName}" from the CRM?`}
        confirmLabel="Delete Document"
        onConfirm={handleConfirmDeleteFile}
        onClose={() => setFileToDelete(null)}
        isLoading={isDeleting}
      />
    </>
  );
};
