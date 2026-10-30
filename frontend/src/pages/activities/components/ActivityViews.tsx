import React from 'react';
import { Link } from 'react-router-dom';
import type { ActivityRecord } from '../../../types/activity.types';
import { DataTable, type Column } from '../../lead-generation/components/DataTable';
import { Badge } from '../../lead-generation/components/Cards';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingIndicator } from '../../../components/auth/LoadingIndicator';
import { formatDateTime, humanize } from '../../lead-generation/leadGenConstants';
import {
  activityRecordPriorityTone,
  activityRecordStatusTone,
  activityTypeTone,
  getRelatedRecords,
  isActivityOverdue,
} from '../activityConstants';
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  ExternalLinkIcon,
  EyeIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from '../../../components/common/Icons';

export interface SharedActivitiesViewProps {
  activities: ActivityRecord[];
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onPreviewActivity: (activity: ActivityRecord) => void;
  onToggleComplete: (activity: ActivityRecord) => void;
  onDeleteActivity: (activity: ActivityRecord) => void;
  emptyAction?: React.ReactNode;
  footer?: React.ReactNode;
}

/* ============================================================================
   1. ACTIVITIES TABLE VIEW (REUSING DATATABLE)
   ============================================================================ */

export const ActivitiesTableView: React.FC<SharedActivitiesViewProps> = ({
  activities,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPreviewActivity,
  onToggleComplete,
  onDeleteActivity,
  emptyAction,
  footer,
}) => {
  const allSelected =
    activities.length > 0 && activities.every((a) => selectedIds.includes(a.id));

  const columns: Column<ActivityRecord>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          className="ld-checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          aria-label="Select all activities on page"
        />
      ),
      render: (act) => (
        <input
          type="checkbox"
          className="ld-checkbox"
          checked={selectedIds.includes(act.id)}
          onChange={() => onToggleSelect(act.id)}
          aria-label={`Select ${act.subject}`}
        />
      ),
    },
    {
      key: 'complete',
      header: 'Done',
      render: (act) => {
        const isDone = (act.status || '').toUpperCase() === 'COMPLETED';
        return (
          <button
            type="button"
            className={`lg-icon-btn ${isDone ? 'ld-convert-icon-btn' : ''}`}
            title={isDone ? 'Completed — click to reopen' : 'Mark as completed'}
            onClick={() => onToggleComplete(act)}
            aria-label={
              isDone
                ? `Reopen ${act.subject}`
                : `Mark ${act.subject} as completed`
            }
          >
            <CheckCircleIcon size={16} />
          </button>
        );
      },
    },
    {
      key: 'activity',
      header: 'Activity & Type',
      render: (act) => {
        const isDone = (act.status || '').toUpperCase() === 'COMPLETED';
        return (
          <div className="lg-cell-stack">
            <div className="lg-badge-row">
              <Badge tone={activityTypeTone(act.type)}>{humanize(act.type)}</Badge>
              <Link
                to={`/activities/${act.id}?source=${act.recordSource}`}
                className="lg-row-link"
                style={{
                  textDecoration: isDone ? 'line-through' : undefined,
                  opacity: isDone ? 0.78 : 1,
                }}
              >
                {act.subject}
              </Link>
            </div>
            {act.description && (
              <span className="lg-cell-sub">
                {act.description.length > 75
                  ? `${act.description.slice(0, 75)}...`
                  : act.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (act) => {
        const overdue = isActivityOverdue(act);
        return (
          <div className="lg-badge-row">
            <Badge tone={activityRecordStatusTone(act.status, overdue)}>
              {humanize(act.status)}
            </Badge>
            {overdue && <Badge tone="red">OVERDUE</Badge>}
          </div>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (act) => (
        <Badge tone={activityRecordPriorityTone(act.priority)}>
          {humanize(act.priority)}
        </Badge>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due / Scheduled Date',
      render: (act) => {
        const overdue = isActivityOverdue(act);
        return (
          <div className="lg-cell-stack">
            <span
              style={{
                color: overdue ? '#dc2626' : undefined,
                fontWeight: overdue ? 600 : undefined,
              }}
            >
              {act.scheduledAt ? formatDateTime(act.scheduledAt) : 'No due date'}
            </span>
            {act.completedAt && (
              <span className="lg-cell-sub">
                Completed: {formatDateTime(act.completedAt)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'related',
      header: 'Related CRM Record',
      render: (act) => {
        const records = getRelatedRecords(act);
        if (records.length === 0) {
          return <span className="lg-muted">—</span>;
        }
        return (
          <div className="lg-badge-row">
            {records.map((rec) => (
              <Link
                key={`${rec.entityType}-${rec.id}`}
                to={rec.path}
                className="lg-row-link"
                style={{ fontSize: '0.82rem' }}
              >
                <Badge tone="slate">{rec.entityType}</Badge> {rec.label}
              </Link>
            ))}
          </div>
        );
      },
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (act) => (
        <span className="lg-muted">{act.assignedTo?.name || 'Unassigned'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (act) => {
        const isDone = (act.status || '').toUpperCase() === 'COMPLETED';
        return (
          <div className="lg-row-actions">
            <button
              type="button"
              className="lg-icon-btn"
              title="Quick Preview Drawer"
              onClick={() => onPreviewActivity(act)}
            >
              <EyeIcon size={15} />
            </button>
            <Link
              to={`/activities/${act.id}?source=${act.recordSource}`}
              className="lg-icon-btn"
              title="Open Activity Details"
            >
              <ArrowRightIcon size={15} />
            </Link>
            <Link
              to={`/activities/${act.id}/edit?source=${act.recordSource}`}
              className="lg-icon-btn"
              title="Edit Activity"
            >
              <EditIcon size={15} />
            </Link>
            <button
              type="button"
              className="lg-icon-btn ld-convert-icon-btn"
              title={isDone ? 'Reopen Activity' : 'Mark Completed'}
              onClick={() => onToggleComplete(act)}
            >
              <CheckCircleIcon size={15} />
            </button>
            <button
              type="button"
              className="lg-icon-btn danger"
              title="Delete Activity"
              onClick={() => onDeleteActivity(act)}
            >
              <TrashIcon size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={activities}
      rowKey={(row) => `${row.recordSource}-${row.id}`}
      isLoading={isLoading}
      loadingMessage="Loading activities..."
      emptyTitle="No activities match the current filters"
      emptyDescription="Try clearing active type, status, or date filters, or schedule a new activity."
      emptyAction={emptyAction}
      footer={footer}
    />
  );
};

/* ============================================================================
   2. ACTIVITIES LIST VIEW (CARD LIST)
   ============================================================================ */

export const ActivitiesListView: React.FC<SharedActivitiesViewProps> = ({
  activities,
  isLoading,
  onPreviewActivity,
  onToggleComplete,
  onDeleteActivity,
  emptyAction,
}) => {
  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="large" message="Loading activities..." />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="lg-card lg-state-box">
        <EmptyState
          title="No activities found"
          description="Adjust your type, status, assignee, or date filters, or log a new activity."
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="ld-cards-stack">
      {activities.map((act) => {
        const overdue = isActivityOverdue(act);
        const isDone = (act.status || '').toUpperCase() === 'COMPLETED';
        const related = getRelatedRecords(act);

        return (
          <div key={`${act.recordSource}-${act.id}`} className="ld-subcard">
            <div className="ld-subcard-top">
              <div className="lg-badge-row">
                <Badge tone={activityTypeTone(act.type)}>{humanize(act.type)}</Badge>
                <Badge tone={activityRecordStatusTone(act.status, overdue)}>
                  {humanize(act.status)}
                </Badge>
                {overdue && <Badge tone="red">OVERDUE</Badge>}
                <Badge tone={activityRecordPriorityTone(act.priority)}>
                  {humanize(act.priority)} Priority
                </Badge>
                <Link
                  to={`/activities/${act.id}?source=${act.recordSource}`}
                  className="lg-row-link"
                  style={{
                    fontSize: '1rem',
                    textDecoration: isDone ? 'line-through' : undefined,
                  }}
                >
                  {act.subject}
                </Link>
              </div>

              <div className="lg-row-actions">
                <button
                  type="button"
                  className="auth-btn btn-secondary btn-size-small"
                  onClick={() => onToggleComplete(act)}
                >
                  <CheckCircleIcon size={14} />{' '}
                  {isDone ? 'Reopen' : 'Mark Complete'}
                </button>
                <button
                  type="button"
                  className="lg-icon-btn"
                  title="Quick Preview"
                  onClick={() => onPreviewActivity(act)}
                >
                  <EyeIcon size={15} />
                </button>
                <Link
                  to={`/activities/${act.id}/edit?source=${act.recordSource}`}
                  className="lg-icon-btn"
                  title="Edit Activity"
                >
                  <EditIcon size={15} />
                </Link>
                <button
                  type="button"
                  className="lg-icon-btn danger"
                  title="Delete Activity"
                  onClick={() => onDeleteActivity(act)}
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            </div>

            {act.description && (
              <p className="ld-subcard-body">{act.description}</p>
            )}

            <div className="ld-subcard-meta">
              <span>
                <CalendarIcon size={13} /> Due:{' '}
                <strong style={{ color: overdue ? '#dc2626' : undefined }}>
                  {act.scheduledAt ? formatDateTime(act.scheduledAt) : 'Not set'}
                </strong>
              </span>
              {act.completedAt && (
                <span>
                  <CheckCircleIcon size={13} /> Completed:{' '}
                  {formatDateTime(act.completedAt)}
                </span>
              )}
              <span>
                <UserIcon size={13} /> Assignee:{' '}
                {act.assignedTo?.name || 'Unassigned'}
              </span>
              {related.map((rec) => (
                <Link key={`${rec.entityType}-${rec.id}`} to={rec.path} className="lg-row-link">
                  <ExternalLinkIcon size={12} /> {rec.entityType}: {rec.label}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================================
   3. ACTIVITY QUICK PREVIEW DRAWER
   ============================================================================ */

interface ActivityQuickDrawerProps {
  activity: ActivityRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (activity: ActivityRecord) => void;
}

export const ActivityQuickDrawer: React.FC<ActivityQuickDrawerProps> = ({
  activity,
  isOpen,
  onClose,
  onToggleComplete,
}) => {
  if (!isOpen || !activity) return null;

  const overdue = isActivityOverdue(activity);
  const isDone = (activity.status || '').toUpperCase() === 'COMPLETED';
  const related = getRelatedRecords(activity);

  return (
    <div className="ld-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="ld-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Activity preview: ${activity.subject}`}
      >
        <header className="ld-drawer-header">
          <div>
            <h3 className="ld-drawer-title">{activity.subject}</h3>
            <p className="ld-drawer-subtitle">
              {humanize(activity.type)} ·{' '}
              {activity.scheduledAt
                ? `Due ${formatDateTime(activity.scheduledAt)}`
                : 'No due date'}
            </p>
          </div>
          <button
            type="button"
            className="lg-icon-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <XIcon size={18} />
          </button>
        </header>

        <div className="ld-drawer-body">
          <div className="ld-drawer-badges">
            <Badge tone={activityTypeTone(activity.type)}>
              {humanize(activity.type)}
            </Badge>
            <Badge tone={activityRecordStatusTone(activity.status, overdue)}>
              {humanize(activity.status)}
            </Badge>
            {overdue && <Badge tone="red">OVERDUE</Badge>}
            <Badge tone={activityRecordPriorityTone(activity.priority)}>
              {humanize(activity.priority)} Priority
            </Badge>
          </div>

          <div className="ld-drawer-section">
            <h4 className="ld-drawer-section-title">Schedule & Ownership</h4>
            <div className="ld-kv-list">
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <CalendarIcon size={13} /> Due / Scheduled
                </span>
                <strong style={{ color: overdue ? '#dc2626' : undefined }}>
                  {activity.scheduledAt
                    ? formatDateTime(activity.scheduledAt)
                    : 'Not Scheduled'}
                </strong>
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
                  <UserIcon size={13} /> Assignee
                </span>
                <span>{activity.assignedTo?.name || 'Unassigned'}</span>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <ClockIcon size={13} /> Created At
                </span>
                <span>{formatDateTime(activity.createdAt)}</span>
              </div>
            </div>
          </div>

          {activity.description && (
            <div className="ld-drawer-section">
              <h4 className="ld-drawer-section-title">Description & Notes</h4>
              <p className="ld-subcard-body">{activity.description}</p>
            </div>
          )}

          <div className="ld-drawer-section">
            <h4 className="ld-drawer-section-title">Related CRM Records</h4>
            {related.length === 0 ? (
              <p className="lg-muted">No related Lead, Contact, or Deal linked.</p>
            ) : (
              <div className="ld-drawer-nav-grid">
                {related.map((rec) => (
                  <Link
                    key={`${rec.entityType}-${rec.id}`}
                    to={rec.path}
                    className="ld-drawer-nav-btn"
                    onClick={onClose}
                  >
                    <ExternalLinkIcon size={14} /> {rec.entityType}: {rec.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="ld-drawer-footer">
          <button
            type="button"
            className="auth-btn btn-primary"
            onClick={() => {
              onToggleComplete(activity);
              onClose();
            }}
          >
            <CheckCircleIcon size={15} />{' '}
            {isDone ? 'Reopen Activity' : 'Mark Complete'}
          </button>
          <Link
            to={`/activities/${activity.id}/edit?source=${activity.recordSource}`}
            className="auth-btn btn-secondary"
            onClick={onClose}
          >
            Edit
          </Link>
          <Link
            to={`/activities/${activity.id}?source=${activity.recordSource}`}
            className="auth-btn btn-secondary"
            onClick={onClose}
          >
            Full Details
          </Link>
        </footer>
      </aside>
    </div>
  );
};

