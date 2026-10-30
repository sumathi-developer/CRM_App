import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { activityService } from '../../services/activity.service';
import type {
  ActivityDateFilter,
  ActivityRecord,
  ActivityScopeMode,
  ActivitySortField,
  ActivityUserRef,
  ActivityViewMode,
  PaginationMeta,
  SortDirection,
} from '../../types/activity.types';
import { ActivitiesLayout } from './components/ActivitiesLayout';
import {
  ActivitiesListView,
  ActivitiesTableView,
  ActivityQuickDrawer,
} from './components/ActivityViews';
import {
  ACTIVITY_DATE_FILTER_OPTIONS,
  ACTIVITY_ITEM_TYPE_OPTIONS,
  ACTIVITY_RECORD_PRIORITY_OPTIONS,
  ACTIVITY_RECORD_STATUS_OPTIONS,
  ACTIVITY_SORT_OPTIONS,
  computeActivityMetrics,
  filterAndSortActivities,
  generateActivitiesCsv,
} from './activityConstants';
import { StatCard } from '../lead-generation/components/Cards';
import { FilterBar, SearchInput } from '../lead-generation/components/FilterBar';
import { Pagination } from '../lead-generation/components/Pagination';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { triggerFileDownload } from '../leads/leadConstants';
import {
  ActivityIcon,
  AlertCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  PlusIcon,
} from '../../components/common/Icons';

export interface ActivitiesExplorerPageProps {
  scope?: ActivityScopeMode;
}

export const ActivitiesExplorerPage: React.FC<ActivitiesExplorerPageProps> = ({
  scope = 'all',
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [viewMode, setViewMode] = useState<ActivityViewMode>('table');
  const [users, setUsers] = useState<ActivityUserRef[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const scopeDefaults = useMemo(() => {
    switch (scope) {
      case 'tasks':
        return { type: 'TASK', status: '', dateFilter: 'ALL' as ActivityDateFilter };
      case 'calls':
        return { type: 'CALL', status: '', dateFilter: 'ALL' as ActivityDateFilter };
      case 'meetings':
        return { type: 'MEETING', status: '', dateFilter: 'ALL' as ActivityDateFilter };
      case 'follow-ups':
        return {
          type: 'FOLLOW_UP',
          status: '',
          dateFilter: 'ALL' as ActivityDateFilter,
        };
      case 'emails':
        return { type: 'EMAIL', status: '', dateFilter: 'ALL' as ActivityDateFilter };
      case 'completed':
        return {
          type: '',
          status: 'COMPLETED',
          dateFilter: 'ALL' as ActivityDateFilter,
        };
      case 'overdue':
        return {
          type: '',
          status: '',
          dateFilter: 'OVERDUE' as ActivityDateFilter,
        };
      default:
        return { type: '', status: '', dateFilter: 'ALL' as ActivityDateFilter };
    }
  }, [scope]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(scopeDefaults.type);
  const [statusFilter, setStatusFilter] = useState<string>(scopeDefaults.status);
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<ActivityDateFilter>(
    scopeDefaults.dateFilter,
  );
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [relatedEntityFilter, setRelatedEntityFilter] = useState<
    '' | 'LEAD' | 'CONTACT' | 'DEAL'
  >('');
  const [sortField, setSortField] = useState<ActivitySortField>('scheduledAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewActivity, setPreviewActivity] = useState<ActivityRecord | null>(
    null,
  );
  const [deletingActivity, setDeletingActivity] = useState<ActivityRecord | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setTypeFilter(scopeDefaults.type);
    setStatusFilter(scopeDefaults.status);
    setDateFilter(scopeDefaults.dateFilter);
    setPage(1);
  }, [scopeDefaults]);

  useEffect(() => {
    let active = true;
    activityService
      .getAssignableUsers()
      .then((list) => {
        if (active) setUsers(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (scope === 'overdue' && !typeFilter && !statusFilter) {
        const overdueItems = await activityService.getOverdueActivities();
        const allRes = await activityService.getActivities({
          page: 1,
          limit: 50,
        });
        const mergedMap = new Map<string, ActivityRecord>();
        [...overdueItems, ...(allRes?.data || [])].forEach((item) => {
          mergedMap.set(`${item.recordSource}-${item.id}`, item);
        });
        const combined = Array.from(mergedMap.values());
        setActivities(combined);
        setMeta({
          total: combined.length,
          page: 1,
          limit: 50,
          totalPages: 1,
        });
        return;
      }

      const effectiveAssignee =
        scope === 'my' && currentUserId
          ? currentUserId
          : assigneeFilter || undefined;

      const res = await activityService.getActivities({
        page,
        limit: 25,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assignedToId: effectiveAssignee,
        search: search.trim() || undefined,
      });

      setActivities(Array.isArray(res?.data) ? res.data : []);
      if (res?.meta) {
        setMeta(res.meta);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load activities.');
    } finally {
      setIsLoading(false);
    }
  }, [
    scope,
    typeFilter,
    statusFilter,
    currentUserId,
    assigneeFilter,
    page,
    priorityFilter,
    search,
  ]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const processedActivities = useMemo(
    () =>
      filterAndSortActivities(activities, {
        search,
        type: typeFilter,
        status: statusFilter,
        priority: priorityFilter,
        assignedToId:
          scope === 'my' && currentUserId ? currentUserId : assigneeFilter,
        relatedEntityFilter,
        dateFilter,
        fromDate,
        toDate,
        onlyOverdue: scope === 'overdue',
        sortField,
        sortDirection,
      }),
    [
      activities,
      search,
      typeFilter,
      statusFilter,
      priorityFilter,
      scope,
      currentUserId,
      assigneeFilter,
      relatedEntityFilter,
      dateFilter,
      fromDate,
      toDate,
      sortField,
      sortDirection,
    ],
  );

  const metrics = useMemo(
    () => computeActivityMetrics(processedActivities),
    [processedActivities],
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAll = () => {
    const allIds = processedActivities.map((a) => a.id);
    const allSelected =
      allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : allIds);
  };

  const handleToggleComplete = async (activity: ActivityRecord) => {
    try {
      const updated = await activityService.markActivityComplete(activity);
      setBannerMessage(
        updated.status === 'COMPLETED'
          ? `Marked "${activity.subject}" as completed.`
          : `Reopened "${activity.subject}".`,
      );
      await loadActivities();
    } catch (err: any) {
      setError(err?.message || 'Failed to update activity completion status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingActivity) return;
    setIsDeleting(true);
    try {
      await activityService.deleteActivityRecord(
        deletingActivity.id,
        deletingActivity.recordSource,
      );
      setBannerMessage(`Deleted activity "${deletingActivity.subject}".`);
      setDeletingActivity(null);
      await loadActivities();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete activity.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const target =
      selectedIds.length > 0
        ? processedActivities.filter((a) => selectedIds.includes(a.id))
        : processedActivities;
    const csv = generateActivitiesCsv(target);
    triggerFileDownload(
      `activities-export-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
  };

  const hasActiveFilters = Boolean(
    search ||
      (typeFilter && typeFilter !== scopeDefaults.type) ||
      (statusFilter && statusFilter !== scopeDefaults.status) ||
      priorityFilter ||
      (dateFilter && dateFilter !== scopeDefaults.dateFilter) ||
      fromDate ||
      toDate ||
      assigneeFilter ||
      relatedEntityFilter,
  );

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter(scopeDefaults.type);
    setStatusFilter(scopeDefaults.status);
    setPriorityFilter('');
    setDateFilter(scopeDefaults.dateFilter);
    setFromDate('');
    setToDate('');
    setAssigneeFilter('');
    setRelatedEntityFilter('');
    setSortField('scheduledAt');
    setSortDirection('desc');
    setPage(1);
  };

  const pageTitle = useMemo(() => {
    switch (scope) {
      case 'my':
        return 'My Activities';
      case 'tasks':
        return 'Tasks';
      case 'calls':
        return 'Calls';
      case 'meetings':
        return 'Meetings';
      case 'follow-ups':
        return 'Follow-ups';
      case 'emails':
        return 'Emails';
      case 'completed':
        return 'Completed Activities';
      case 'overdue':
        return 'Overdue Activities';
      default:
        return 'All Activities';
    }
  }, [scope]);

  const pageSubtitle = useMemo(() => {
    switch (scope) {
      case 'my':
        return 'Track and complete calls, meetings, tasks, follow-ups, and emails assigned to you.';
      case 'tasks':
        return 'Manage action items, deliverables, due dates, and task assignments across CRM records.';
      case 'calls':
        return 'Log and schedule discovery calls, outbound outreach, and stakeholder phone conversations.';
      case 'meetings':
        return 'Coordinate product demos, executive briefings, and customer review meetings.';
      case 'follow-ups':
        return 'Stay on top of scheduled prospect and deal follow-up touchpoints.';
      case 'emails':
        return 'Track logged email communications and scheduled email follow-ups.';
      case 'completed':
        return 'Review completed calls, meetings, tasks, follow-ups, and email touchpoints.';
      case 'overdue':
        return 'Prioritize and resolve past-due pending activities and tasks across your pipeline.';
      default:
        return 'Unified workspace for scheduling, filtering, and completing CRM tasks, calls, meetings, follow-ups, and emails.';
    }
  }, [scope]);

  const createLink = useMemo(() => {
    if (scopeDefaults.type) {
      return `/activities/create?type=${scopeDefaults.type}`;
    }
    return '/activities/create';
  }, [scopeDefaults.type]);

  return (
    <ActivitiesLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <div className="ld-view-switcher" role="group" aria-label="Activity view mode">
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>

          <button
            type="button"
            className="auth-btn btn-secondary btn-size-small"
            onClick={handleExportCsv}
            disabled={processedActivities.length === 0}
          >
            <ExternalLinkIcon size={15} /> Export CSV
          </button>

          <Link to={createLink} className="auth-btn btn-primary btn-size-small">
            <PlusIcon size={15} /> Create Activity
          </Link>
        </div>
      }
    >
      {/* KPI Stat Cards */}
      <div className="lg-stat-grid">
        <StatCard
          label="Total Activities"
          value={metrics.total}
          hint={`${metrics.pendingCount} Pending · ${metrics.completedCount} Completed`}
          tone="blue"
          icon={<ActivityIcon size={18} />}
        />
        <StatCard
          label="Due Today"
          value={metrics.dueTodayCount}
          hint="Scheduled for today's agenda"
          tone="amber"
          icon={<CalendarIcon size={18} />}
        />
        <StatCard
          label="Completed"
          value={metrics.completedCount}
          hint={`Completion Rate: ${metrics.completionRate}%`}
          tone="green"
          icon={<CheckCircleIcon size={18} />}
        />
        <StatCard
          label="Overdue"
          value={metrics.overdueCount}
          hint="Past due date and still pending"
          tone={metrics.overdueCount > 0 ? 'red' : 'slate'}
          icon={<AlertCircleIcon size={18} />}
        />
      </div>

      {/* Search & Multi-Faceted Filters */}
      <FilterBar
        onRefresh={loadActivities}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <SearchInput
          value={search}
          onChange={(val: string) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search subject, notes, assignee, lead, contact, deal..."
        />

        <select
          className="lg-select"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by activity type"
        >
          <option value="">All Activity Types</option>
          {ACTIVITY_ITEM_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="lg-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {ACTIVITY_RECORD_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="lg-select"
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by priority"
        >
          <option value="">All Priorities</option>
          {ACTIVITY_RECORD_PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} Priority
            </option>
          ))}
        </select>

        <select
          className="lg-select"
          value={dateFilter}
          onChange={(e) =>
            setDateFilter(e.target.value as ActivityDateFilter)
          }
          aria-label="Filter by due date"
        >
          {ACTIVITY_DATE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {dateFilter === 'CUSTOM' && (
          <>
            <input
              type="date"
              className="lg-input"
              style={{ maxWidth: '155px' }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From date"
            />
            <input
              type="date"
              className="lg-input"
              style={{ maxWidth: '155px' }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="To date"
            />
          </>
        )}

        {scope !== 'my' && (
          <select
            className="lg-select"
            value={assigneeFilter}
            onChange={(e) => {
              setAssigneeFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by assignee"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}

        <select
          className="lg-select"
          value={relatedEntityFilter}
          onChange={(e) =>
            setRelatedEntityFilter(
              e.target.value as '' | 'LEAD' | 'CONTACT' | 'DEAL',
            )
          }
          aria-label="Filter by related CRM record"
        >
          <option value="">All CRM Records</option>
          <option value="DEAL">Linked to Deal</option>
          <option value="CONTACT">Linked to Contact</option>
          <option value="LEAD">Linked to Lead</option>
        </select>

        <select
          className="lg-select"
          value={`${sortField}:${sortDirection}`}
          onChange={(e) => {
            const [f, d] = e.target.value.split(':') as [
              ActivitySortField,
              SortDirection,
            ];
            setSortField(f);
            setSortDirection(d);
          }}
          aria-label="Sort activities"
        >
          {ACTIVITY_SORT_OPTIONS.map((opt) => (
            <React.Fragment key={opt.value}>
              <option value={`${opt.value}:desc`}>{opt.label} (Desc)</option>
              <option value={`${opt.value}:asc`}>{opt.label} (Asc)</option>
            </React.Fragment>
          ))}
        </select>
      </FilterBar>

      {viewMode === 'table' ? (
        <ActivitiesTableView
          activities={processedActivities}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onPreviewActivity={(act) => setPreviewActivity(act)}
          onToggleComplete={handleToggleComplete}
          onDeleteActivity={(act) => setDeletingActivity(act)}
          emptyAction={
            <Link to={createLink} className="auth-btn btn-primary">
              <PlusIcon size={15} /> Create Activity
            </Link>
          }
          footer={
            <Pagination
              meta={meta}
              onPageChange={(nextPage) => setPage(nextPage)}
              disabled={isLoading}
              noun="activities"
            />
          }
        />
      ) : (
        <>
          <ActivitiesListView
            activities={processedActivities}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onPreviewActivity={(act) => setPreviewActivity(act)}
            onToggleComplete={handleToggleComplete}
            onDeleteActivity={(act) => setDeletingActivity(act)}
            emptyAction={
              <Link to={createLink} className="auth-btn btn-primary">
                <PlusIcon size={15} /> Create Activity
              </Link>
            }
          />
          {processedActivities.length > 0 && (
            <div className="lg-card" style={{ padding: '0.75rem 1rem' }}>
              <Pagination
                meta={meta}
                onPageChange={(nextPage) => setPage(nextPage)}
                disabled={isLoading}
                noun="activities"
              />
            </div>
          )}
        </>
      )}

      <ActivityQuickDrawer
        activity={previewActivity}
        isOpen={Boolean(previewActivity)}
        onClose={() => setPreviewActivity(null)}
        onToggleComplete={handleToggleComplete}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingActivity)}
        title="Delete Activity"
        message={`Are you sure you want to permanently delete "${deletingActivity?.subject || 'this activity'}"?`}
        confirmLabel="Delete Activity"
        isLoading={isDeleting}
        onClose={() => setDeletingActivity(null)}
        onConfirm={handleConfirmDelete}
      />
    </ActivitiesLayout>
  );
};

export default ActivitiesExplorerPage;

