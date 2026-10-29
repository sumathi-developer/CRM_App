import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { leadService } from '../../services/lead.service';
import type {
  Lead,
  LeadScopeMode,
  LeadSortField,
  LeadStatus,
  LeadViewMode,
  PaginationMeta,
  PipelineOption,
  ScoreTier,
  SortDirection,
} from '../../types/lead.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { StatCard } from '../lead-generation/components/Cards';
import { FilterBar, FilterSelect, SearchInput } from '../lead-generation/components/FilterBar';
import { Pagination } from '../lead-generation/components/Pagination';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { formatCurrency, formatNumber } from '../lead-generation/leadGenConstants';
import {
  LEAD_SORT_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  SCORE_TIER_OPTIONS,
  filterAndSortLeads,
  generateLeadsCsv,
  triggerFileDownload,
} from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import { LeadsBoardView, LeadsListView, LeadsTableView } from './components/LeadViews';
import {
  AssignLeadModal,
  ConvertLeadModal,
  LeadQuickDrawer,
  QualifyLeadModal,
  ScoreLeadModal,
} from './components/LeadActionModals';
import {
  AwardIcon,
  CheckCircleIcon,
  DollarSignIcon,
  ExternalLinkIcon,
  PlusIcon,
  TargetIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
} from '../../components/common/Icons';

export const LeadsExplorerPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users } = useUserOptions();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive default view and scope from current route path so all 5 screens
  // (/leads, /leads/my, /leads/list, /leads/board, /leads/table) share state seamlessly
  const routeMode = useMemo(() => {
    const p = location.pathname;
    if (p === '/leads/my') return { scope: 'my' as LeadScopeMode, view: null };
    if (p === '/leads/list') return { scope: 'all' as LeadScopeMode, view: 'list' as LeadViewMode };
    if (p === '/leads/board') return { scope: 'all' as LeadScopeMode, view: 'board' as LeadViewMode };
    if (p === '/leads/table') return { scope: 'all' as LeadScopeMode, view: 'table' as LeadViewMode };
    return { scope: 'all' as LeadScopeMode, view: null };
  }, [location.pathname]);

  const savedSettings = useMemo(() => leadService.getLocalSettings(), []);

  const [viewMode, setViewMode] = useState<LeadViewMode>(
    routeMode.view || savedSettings.defaultView || 'table',
  );
  const [scope, setScope] = useState<LeadScopeMode>(routeMode.scope);

  // Sync when user navigates via sidebar between /leads, /leads/my, /leads/list, /leads/board, /leads/table
  useEffect(() => {
    setScope(routeMode.scope);
    if (routeMode.view) {
      setViewMode(routeMode.view);
    }
  }, [routeMode]);

  // Query & Filter State
  const [page, setPage] = useState(1);
  const [limit] = useState(viewMode === 'board' ? 50 : savedSettings.pageSize || 10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [scoreTier, setScoreTier] = useState<ScoreTier>('');
  const [sortField, setSortField] = useState<LeadSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Shared Lead Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selection & Interactive Modals / Drawer State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [leadsToAssign, setLeadsToAssign] = useState<Lead[]>([]);
  const [leadToQualify, setLeadToQualify] = useState<Lead | null>(null);
  const [leadToScore, setLeadToScore] = useState<Lead | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const effectiveOwnerId = scope === 'my' ? currentUser?.id || '' : ownerFilter;

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const effectiveLimit = viewMode === 'board' ? 50 : limit;
      const response = await leadService.getLeads({
        page,
        limit: effectiveLimit,
        search: search || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        ownerId: effectiveOwnerId || undefined,
      });
      setLeads(response.data || []);
      setMeta(response.meta);
      setSelectedIds((prev) => prev.filter((id) => (response.data || []).some((l) => l.id === id)));
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, viewMode, search, statusFilter, sourceFilter, effectiveOwnerId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    leadService.getPipelines().then(setPipelines).catch(() => setPipelines([]));
  }, []);

  // Client-side sorting & score tier refinement over fetched page
  const displayedLeads = useMemo(
    () =>
      filterAndSortLeads(leads, {
        scoreTier,
        sortField,
        sortDirection,
        hotThreshold: savedSettings.hotScoreThreshold,
        warmThreshold: savedSettings.warmScoreThreshold,
      }),
    [leads, scoreTier, sortField, sortDirection, savedSettings],
  );

  // Summary KPIs computed from current dataset
  const stats = useMemo(() => {
    const total = meta?.total ?? displayedLeads.length;
    const qualifiedCount = displayedLeads.filter((l) => l.status === 'QUALIFIED').length;
    const convertedCount = displayedLeads.filter((l) => l.status === 'CONVERTED').length;
    const totalPipeline = displayedLeads.reduce(
      (sum, l) => sum + Number(l.estimatedValue || 0),
      0,
    );
    const avgScore =
      displayedLeads.length > 0
        ? Math.round(
            displayedLeads.reduce((sum, l) => sum + Number(l.leadScore || 0), 0) /
              displayedLeads.length,
          )
        : 0;
    return { total, qualifiedCount, convertedCount, totalPipeline, avgScore };
  }, [displayedLeads, meta]);

  const handleSortHeaderClick = (field: LeadSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAll = () => {
    if (displayedLeads.every((l) => selectedIds.includes(l.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedLeads.map((l) => l.id));
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    setOwnerFilter('');
    setScoreTier('');
    setSortField('createdAt');
    setSortDirection('desc');
    setPage(1);
  };

  const handleQuickStatusChange = async (lead: Lead, nextStatus: LeadStatus) => {
    setError(null);
    try {
      const updated = await leadService.updateLeadStatus(lead.id, nextStatus);
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...updated } : l)));
      if (previewLead?.id === lead.id) {
        setPreviewLead((prev) => (prev ? { ...prev, ...updated } : null));
      }
      setSuccess(`Updated "${lead.title}" stage to ${nextStatus}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update lead stage.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await leadService.deleteLead(leadToDelete.id);
      setSuccess(`Lead "${leadToDelete.title}" has been permanently deleted.`);
      if (previewLead?.id === leadToDelete.id) setPreviewLead(null);
      setLeadToDelete(null);
      await fetchLeads();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete lead.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickExportCsv = () => {
    const csv = generateLeadsCsv(displayedLeads);
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerFileDownload(`crm-leads-${scope}-${dateStamp}.csv`, csv);
    setSuccess(`Exported ${displayedLeads.length} leads to CSV.`);
  };

  const pageHeading = useMemo(() => {
    if (location.pathname === '/leads/my' || scope === 'my') {
      return {
        title: 'My Leads',
        subtitle: 'Manage, qualify, and convert leads assigned directly to you.',
      };
    }
    if (location.pathname === '/leads/list') {
      return {
        title: 'Lead List',
        subtitle: 'Card-based lead directory with quick qualification, scoring, and assignment controls.',
      };
    }
    if (location.pathname === '/leads/board') {
      return {
        title: 'Lead Board',
        subtitle: 'Kanban pipeline board organized by lead qualification stage.',
      };
    }
    if (location.pathname === '/leads/table') {
      return {
        title: 'Lead Table',
        subtitle: 'Sortable tabular view of all CRM leads with inline actions and bulk operations.',
      };
    }
    return {
      title: 'All Leads',
      subtitle: 'Search, filter, score, qualify, assign, and convert inbound and outbound leads.',
    };
  }, [location.pathname, scope]);

  const hasActiveFilters = Boolean(
    search || statusFilter || sourceFilter || ownerFilter || scoreTier,
  );

  const selectedLeadObjects = displayedLeads.filter((l) => selectedIds.includes(l.id));

  return (
    <LeadsLayout
      title={pageHeading.title}
      subtitle={pageHeading.subtitle}
      icon={<TargetIcon size={22} />}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <>
          <button
            type="button"
            className="auth-btn btn-secondary"
            onClick={handleQuickExportCsv}
            disabled={displayedLeads.length === 0}
            title="Download current view as CSV"
          >
            <ExternalLinkIcon size={15} />
            <span>Quick Export CSV</span>
          </button>
          <Link to="/leads/import" className="auth-btn btn-secondary">
            <span>Import</span>
          </Link>
          <Link to="/leads/create" className="auth-btn btn-primary" id="btn-create-lead">
            <PlusIcon size={16} />
            <span>Create Lead</span>
          </Link>
        </>
      }
    >
      {/* Top KPI Strip */}
      <div className="lg-stat-grid">
        <StatCard
          label={scope === 'my' ? 'My Total Leads' : 'Total Leads'}
          value={formatNumber(stats.total)}
          hint={`${displayedLeads.length} on current view`}
          icon={<TargetIcon size={20} />}
          tone="blue"
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(stats.totalPipeline)}
          hint="Estimated opportunity value"
          icon={<DollarSignIcon size={20} />}
          tone="green"
        />
        <StatCard
          label="Average Score"
          value={`${stats.avgScore} / 100`}
          hint="Across visible leads"
          icon={<AwardIcon size={20} />}
          tone="amber"
        />
        <StatCard
          label="Qualified Ready"
          value={formatNumber(stats.qualifiedCount)}
          hint="Ready for deal conversion"
          icon={<CheckCircleIcon size={20} />}
          tone="cyan"
        />
        <StatCard
          label="Converted"
          value={formatNumber(stats.convertedCount)}
          hint="Turned into deals"
          icon={<TrendingUpIcon size={20} />}
          tone="purple"
        />
      </div>

      {/* View Mode & Scope Switcher Toolbar */}
      <div className="lg-card ld-view-switcher-bar">
        <div className="ld-scope-tabs" role="tablist" aria-label="Lead ownership scope">
          <button
            type="button"
            role="tab"
            aria-selected={scope === 'all'}
            className={`ld-pill-tab ${scope === 'all' ? 'is-active' : ''}`}
            onClick={() => {
              setScope('all');
              setPage(1);
              if (location.pathname === '/leads/my') navigate('/leads');
            }}
          >
            <UsersIcon size={15} />
            <span>All Leads</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === 'my'}
            className={`ld-pill-tab ${scope === 'my' ? 'is-active' : ''}`}
            onClick={() => {
              setScope('my');
              setPage(1);
            }}
          >
            <UserIcon size={15} />
            <span>My Leads</span>
          </button>
        </div>

        <div className="ld-view-right-controls">
          {selectedIds.length > 0 && (
            <div className="ld-bulk-bar">
              <span className="ld-bulk-count">{selectedIds.length} selected</span>
              <button
                type="button"
                className="auth-btn btn-secondary btn-size-small"
                onClick={() => setLeadsToAssign(selectedLeadObjects)}
              >
                <UserIcon size={14} />
                <span>Bulk Assign</span>
              </button>
              <button
                type="button"
                className="lg-link-btn"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </button>
            </div>
          )}

          <div className="ld-view-mode-group" role="group" aria-label="Switch lead view">
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'table' ? 'is-active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'board' ? 'is-active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              Board
            </button>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Bar */}
      <FilterBar
        onRefresh={fetchLeads}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <SearchInput
          id="leads-search-input"
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search title, contact name, email, or company..."
        />

        <FilterSelect
          id="leads-status-filter"
          label="Status"
          value={statusFilter}
          options={LEAD_STATUS_OPTIONS}
          allLabel="All Statuses"
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        />

        <FilterSelect
          id="leads-source-filter"
          label="Source"
          value={sourceFilter}
          options={LEAD_SOURCE_OPTIONS}
          allLabel="All Sources"
          onChange={(val) => {
            setSourceFilter(val);
            setPage(1);
          }}
        />

        {scope === 'all' && (
          <FilterSelect
            id="leads-owner-filter"
            label="Owner"
            value={ownerFilter}
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            allLabel="All Owners"
            onChange={(val) => {
              setOwnerFilter(val);
              setPage(1);
            }}
          />
        )}

        <FilterSelect
          id="leads-score-tier-filter"
          label="Score"
          value={scoreTier}
          options={SCORE_TIER_OPTIONS}
          allLabel="All Tiers"
          onChange={(val) => setScoreTier(val as ScoreTier)}
        />

        <label className="lg-filter-select" htmlFor="leads-sort-select">
          <span className="lg-filter-label">Sort by</span>
          <select
            id="leads-sort-select"
            className="lg-select"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as LeadSortField)}
          >
            {LEAD_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="lg-icon-btn ld-sort-dir-btn"
          onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
          title={`Sort order: ${sortDirection.toUpperCase()}`}
          aria-label={`Sort order: ${sortDirection}`}
        >
          {sortDirection === 'asc' ? '↑ ASC' : '↓ DESC'}
        </button>
      </FilterBar>

      {/* Active View Area (Table / List / Board share exact same state & handlers) */}
      {viewMode === 'table' && (
        <LeadsTableView
          leads={displayedLeads}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortHeaderClick}
          onOpenPreview={setPreviewLead}
          onAssign={(lead) => setLeadsToAssign([lead])}
          onQualify={setLeadToQualify}
          onScore={setLeadToScore}
          onConvert={setLeadToConvert}
          onDelete={setLeadToDelete}
          onQuickStatusChange={handleQuickStatusChange}
          emptyAction={
            <Link to="/leads/create" className="auth-btn btn-primary">
              <PlusIcon size={15} />
              <span>Create First Lead</span>
            </Link>
          }
          footer={
            <Pagination
              meta={meta}
              onPageChange={setPage}
              disabled={isLoading}
              noun="leads"
            />
          }
        />
      )}

      {viewMode === 'list' && (
        <LeadsListView
          leads={displayedLeads}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortHeaderClick}
          onOpenPreview={setPreviewLead}
          onAssign={(lead) => setLeadsToAssign([lead])}
          onQualify={setLeadToQualify}
          onScore={setLeadToScore}
          onConvert={setLeadToConvert}
          onDelete={setLeadToDelete}
          onQuickStatusChange={handleQuickStatusChange}
          emptyAction={
            <Link to="/leads/create" className="auth-btn btn-primary">
              <PlusIcon size={15} />
              <span>Create First Lead</span>
            </Link>
          }
          footer={
            <Pagination
              meta={meta}
              onPageChange={setPage}
              disabled={isLoading}
              noun="leads"
            />
          }
        />
      )}

      {viewMode === 'board' && (
        <LeadsBoardView
          leads={displayedLeads}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortHeaderClick}
          onOpenPreview={setPreviewLead}
          onAssign={(lead) => setLeadsToAssign([lead])}
          onQualify={setLeadToQualify}
          onScore={setLeadToScore}
          onConvert={setLeadToConvert}
          onDelete={setLeadToDelete}
          onQuickStatusChange={handleQuickStatusChange}
          footer={
            <Pagination
              meta={meta}
              onPageChange={setPage}
              disabled={isLoading}
              noun="leads"
            />
          }
        />
      )}

      {/* Slide-Over Quick Preview Drawer */}
      <LeadQuickDrawer
        lead={previewLead}
        onClose={() => setPreviewLead(null)}
        onAssign={(lead) => setLeadsToAssign([lead])}
        onQualify={setLeadToQualify}
        onScore={setLeadToScore}
        onConvert={setLeadToConvert}
        onQuickStatusChange={handleQuickStatusChange}
      />

      {/* Shared Action Modals */}
      <AssignLeadModal
        isOpen={leadsToAssign.length > 0}
        leads={leadsToAssign}
        users={users}
        onClose={() => setLeadsToAssign([])}
        onSuccess={(msg) => {
          setSuccess(msg);
          setSelectedIds([]);
          fetchLeads();
        }}
      />

      <QualifyLeadModal
        isOpen={Boolean(leadToQualify)}
        lead={leadToQualify}
        onClose={() => setLeadToQualify(null)}
        onSuccess={(msg) => {
          setSuccess(msg);
          fetchLeads();
        }}
      />

      <ScoreLeadModal
        isOpen={Boolean(leadToScore)}
        lead={leadToScore}
        onClose={() => setLeadToScore(null)}
        onSuccess={(msg) => {
          setSuccess(msg);
          fetchLeads();
        }}
      />

      <ConvertLeadModal
        isOpen={Boolean(leadToConvert)}
        lead={leadToConvert}
        pipelines={pipelines}
        onClose={() => setLeadToConvert(null)}
        onConverted={(result) => {
          setSuccess(
            `${result?.message || 'Lead converted successfully'} — Created Deal "${
              result?.deal?.title || ''
            }".`,
          );
          fetchLeads();
        }}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(leadToDelete)}
        title="Confirm Lead Deletion"
        message={`Are you sure you want to permanently delete lead "${leadToDelete?.title}" (${leadToDelete?.email})? All associated activities and notes will be removed.`}
        itemName={leadToDelete?.title}
        confirmLabel="Delete Lead"
        isLoading={isDeleting}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </LeadsLayout>
  );
};
