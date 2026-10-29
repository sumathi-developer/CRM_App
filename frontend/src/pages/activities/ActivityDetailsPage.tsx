import React, { useCallback, useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import type {
  ActivityRecord,
  ActivityRecordPriority,
  ActivityRecordSource,
  ActivityRecordStatus,
  ActivityUserRef,
} from '../../types/activity.types';
import { ActivitiesLayout } from './components/ActivitiesLayout';
import {
  ACTIVITY_RECORD_PRIORITY_OPTIONS,
  ACTIVITY_RECORD_STATUS_OPTIONS,
  activityRecordPriorityTone,
  activityRecordStatusTone,
  activityTypeTone,
  getRelatedRecords,
  isActivityOverdue,
} from './activityConstants';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { formatDateTime, humanize } from '../lead-generation/leadGenConstants';
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  ExternalLinkIcon,
  TargetIcon,
  TrashIcon,
  UserIcon,
} from '../../components/common/Icons';

export const ActivityDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceParam =
    (searchParams.get('source') as ActivityRecordSource) || undefined;

  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [users, setUsers] = useState<ActivityUserRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [actRes, userList] = await Promise.all([
        activityService.getActivityById(id, sourceParam),
        activityService.getAssignableUsers(),
      ]);
      setActivity(actRes);
      setUsers(userList);
      setSelectedAssigneeId(actRes?.assignedToId || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load activity details.');
    } finally {
      setIsLoading(false);
    }
  }, [id, sourceParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleComplete = async () => {
    if (!activity) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await activityService.markActivityComplete(activity);
      setBannerMessage(
        updated.status === 'COMPLETED'
          ? 'Activity marked as completed.'
          : 'Activity reopened as pending.',
      );
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update completion status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStatusChange = async (nextStatus: ActivityRecordStatus) => {
    if (!activity || activity.status === nextStatus) return;
    setIsUpdatingStatus(true);
    try {
      await activityService.updateActivityRecord(
        activity.id,
        {
          status: nextStatus,
          completedAt:
            nextStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
        },
        activity.recordSource,
      );
      setBannerMessage(`Activity status updated to ${humanize(nextStatus)}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update activity status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (nextPriority: ActivityRecordPriority) => {
    if (!activity || activity.priority === nextPriority) return;
    setIsUpdatingStatus(true);
    try {
      await activityService.updateActivityRecord(
        activity.id,
        { priority: nextPriority },
        activity.recordSource,
      );
      setBannerMessage(`Priority updated to ${humanize(nextPriority)}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update priority.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignUser = async () => {
    if (!activity || !selectedAssigneeId) return;
    setIsAssigning(true);
    try {
      await activityService.assignActivity(activity, selectedAssigneeId);
      setBannerMessage('Activity assignee updated.');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to reassign activity.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activity) return;
    setIsDeleting(true);
    try {
      await activityService.deleteActivityRecord(
        activity.id,
        activity.recordSource,
      );
      navigate('/activities');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete activity.');
      setIsDeleting(false);
    }
  };

  const overdue = activity ? isActivityOverdue(activity) : false;
  const isDone =
    (activity?.status || '').toUpperCase() === 'COMPLETED';
  const relatedRecords = activity ? getRelatedRecords(activity) : [];

  return (
    <ActivitiesLayout
      title={activity ? activity.subject : 'Activity Details'}
      subtitle={
        activity
          ? `${humanize(activity.type)} · ${
              activity.scheduledAt
                ? `Due ${formatDateTime(activity.scheduledAt)}`
                : 'No due date set'
            }`
          : 'Comprehensive activity record, completion controls, and linked CRM records.'
      }
      activeActivity={activity}
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <Link to="/activities" className="auth-btn btn-secondary btn-size-small">
            <ArrowLeftIcon size={15} /> All Activities
          </Link>

          {activity && (
            <>
              <button
                type="button"
                className="auth-btn btn-primary btn-size-small"
                disabled={isUpdatingStatus}
                onClick={handleToggleComplete}
              >
                <CheckCircleIcon size={15} />{' '}
                {isDone ? 'Reopen Activity' : 'Mark Complete'}
              </button>
              <Link
                to={`/activities/${activity.id}/edit?source=${activity.recordSource}`}
                className="auth-btn btn-secondary btn-size-small"
              >
                <EditIcon size={15} /> Edit Activity
              </Link>
              <button
                type="button"
                className="lg-icon-btn danger"
                title="Delete Activity"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <TrashIcon size={16} />
              </button>
            </>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading activity details..." />
        </div>
      ) : !activity ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Activity Not Found"
            description="The requested activity does not exist or may have been deleted."
            action={
              <Link to="/activities" className="auth-btn btn-primary">
                Return to All Activities
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* KPI Stat Cards */}
          <div className="lg-stat-grid">
            <StatCard
              label="Activity Type"
              value={humanize(activity.type)}
              hint={`Source: ${activity.recordSource}`}
              tone={activityTypeTone(activity.type)}
              icon={<ActivityIcon size={18} />}
            />
            <StatCard
              label="Status"
              value={overdue ? 'OVERDUE' : humanize(activity.status)}
              hint={
                activity.completedAt
                  ? `Completed ${formatDateTime(activity.completedAt)}`
                  : 'Completion status'
              }
              tone={activityRecordStatusTone(activity.status, overdue)}
              icon={
                overdue ? (
                  <AlertCircleIcon size={18} />
                ) : (
                  <CheckCircleIcon size={18} />
                )
              }
            />
            <StatCard
              label="Priority"
              value={humanize(activity.priority)}
              hint="Execution priority"
              tone={activityRecordPriorityTone(activity.priority)}
              icon={<TargetIcon size={18} />}
            />
            <StatCard
              label="Due / Scheduled Date"
              value={
                activity.scheduledAt
                  ? formatDateTime(activity.scheduledAt)
                  : 'Not Scheduled'
              }
              hint={`Assignee: ${activity.assignedTo?.name || 'Unassigned'}`}
              tone={overdue ? 'red' : 'amber'}
              icon={<CalendarIcon size={18} />}
            />
          </div>

          <div className="ld-detail-grid">
            <div className="ld-detail-main">
              <SectionCard
                title="Activity Description & Notes"
                subtitle="Call summary, meeting agenda, action items, or follow-up details."
                actions={
                  <Link
                    to={`/activities/${activity.id}/edit?source=${activity.recordSource}`}
                    className="auth-btn btn-secondary btn-size-small"
                  >
                    <EditIcon size={14} /> Edit Notes
                  </Link>
                }
              >
                {activity.description ? (
                  <p className="ld-subcard-body" style={{ whiteSpace: 'pre-wrap' }}>
                    {activity.description}
                  </p>
                ) : (
                  <EmptyState
                    title="No description recorded"
                    description="Add call notes, meeting agenda items, or follow-up details by editing this activity."
                  />
                )}
              </SectionCard>

              <SectionCard
                title="Completion & Status Controls"
                subtitle="Update completion status or adjust priority directly."
              >
                <div className="lg-form-grid">
                  <div>
                    <label
                      htmlFor="detail-status-select"
                      className="ld-kv-label"
                      style={{ display: 'block', marginBottom: '0.4rem' }}
                    >
                      Activity Status
                    </label>
                    <select
                      id="detail-status-select"
                      className="lg-select"
                      value={activity.status}
                      disabled={isUpdatingStatus}
                      onChange={(e) =>
                        handleStatusChange(
                          e.target.value as ActivityRecordStatus,
                        )
                      }
                    >
                      {ACTIVITY_RECORD_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="detail-priority-select"
                      className="ld-kv-label"
                      style={{ display: 'block', marginBottom: '0.4rem' }}
                    >
                      Priority Level
                    </label>
                    <select
                      id="detail-priority-select"
                      className="lg-select"
                      value={activity.priority}
                      disabled={isUpdatingStatus}
                      onChange={(e) =>
                        handlePriorityChange(
                          e.target.value as ActivityRecordPriority,
                        )
                      }
                    >
                      {ACTIVITY_RECORD_PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="ld-detail-side">
              <SectionCard
                title="Related CRM Records"
                subtitle="Open the linked Deal, Contact, or Lead associated with this activity."
              >
                {relatedRecords.length === 0 ? (
                  <p className="lg-muted">
                    No related Lead, Contact, or Deal is linked to this activity.
                  </p>
                ) : (
                  <div className="ld-cards-stack">
                    {relatedRecords.map((rec) => (
                      <div key={`${rec.entityType}-${rec.id}`} className="ld-subcard">
                        <div className="ld-subcard-top">
                          <div className="lg-badge-row">
                            <Badge tone="blue">{rec.entityType}</Badge>
                            <strong>{rec.label}</strong>
                          </div>
                          <Link
                            to={rec.path}
                            className="auth-btn btn-secondary btn-size-small"
                          >
                            <ExternalLinkIcon size={14} /> Open {rec.entityType}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Assignee & Schedule"
                subtitle="Manage ownership and review timestamps."
              >
                <div className="ld-kv-list">
                  <div className="ld-kv-row">
                    <span className="ld-kv-label">
                      <UserIcon size={13} /> Current Assignee
                    </span>
                    <strong>{activity.assignedTo?.name || 'Unassigned'}</strong>
                  </div>
                  <div className="ld-kv-row">
                    <span className="ld-kv-label">
                      <CalendarIcon size={13} /> Due / Scheduled
                    </span>
                    <span style={{ color: overdue ? '#dc2626' : undefined }}>
                      {activity.scheduledAt
                        ? formatDateTime(activity.scheduledAt)
                        : '—'}
                    </span>
                  </div>
                  {activity.completedAt && (
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">
                        <CheckCircleIcon size={13} /> Completed At
                      </span>
                      <span>{formatDateTime(activity.completedAt)}</span>
                    </div>
                  )}
                  <div className="ld-kv-row">
                    <span className="ld-kv-label">
                      <ClockIcon size={13} /> Created At
                    </span>
                    <span>{formatDateTime(activity.createdAt)}</span>
                  </div>
                </div>

                <div
                  className="lg-badge-row"
                  style={{ marginTop: '0.85rem', alignItems: 'center' }}
                >
                  <select
                    className="lg-select"
                    style={{ flex: 1 }}
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    aria-label="Reassign activity"
                  >
                    <option value="">— Select Assignee —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.email ? `(${u.email})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="auth-btn btn-secondary btn-size-small"
                    disabled={
                      !selectedAssigneeId ||
                      selectedAssigneeId === activity.assignedToId ||
                      isAssigning
                    }
                    onClick={handleAssignUser}
                  >
                    {isAssigning ? 'Assigning...' : 'Reassign'}
                  </button>
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Activity"
        message={`Are you sure you want to permanently delete "${activity?.subject || 'this activity'}"?`}
        confirmLabel="Delete Activity"
        isLoading={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </ActivitiesLayout>
  );
};

export default ActivityDetailsPage;

