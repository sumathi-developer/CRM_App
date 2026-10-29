import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dealService } from '../../services/deal.service';
import type {
  Deal,
  DealOrganizationOption,
  DealScopeMode,
  DealSortField,
  DealStatus,
  DealUserOption,
  DealViewMode,
  PaginationMeta,
  Pipeline,
  SortDirection,
} from '../../types/deal.types';
import { DealsLayout } from './components/DealsLayout';
import {
  DealOutcomeModal,
  DealQuickDrawer,
  DealsBoardView,
  DealsListView,
  DealsTableView,
} from './components/DealViews';
import {
  computeDealMetrics,
  DEAL_SORT_OPTIONS,
  filterAndSortDeals,
  generateDealsCsv,
  getDealPermissions,
} from './dealConstants';
import { DEAL_STATUS_OPTIONS } from '../pipelines/pipelineConstants';
import { StatCard } from '../lead-generation/components/Cards';
import { FilterBar, SearchInput } from '../lead-generation/components/FilterBar';
import { Pagination } from '../lead-generation/components/Pagination';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { formatCurrency } from '../lead-generation/leadGenConstants';
import { triggerFileDownload } from '../leads/leadConstants';
import {
  BriefcaseIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  PlusIcon,
  TargetIcon,
  TrendingUpIcon,
} from '../../components/common/Icons';

export interface DealsExplorerPageProps {
  scope?: DealScopeMode;
  forcedView?: DealViewMode;
}

export const DealsExplorerPage: React.FC<DealsExplorerPageProps> = ({
  scope = 'all',
  forcedView,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const permissions = useMemo(() => getDealPermissions(user), [user]);
  const settings = useMemo(() => dealService.getLocalSettings(), []);

  const [viewMode, setViewMode] = useState<DealViewMode>(
    forcedView || settings.defaultView || 'table',
  );

  useEffect(() => {
    if (forcedView) {
      setViewMode(forcedView);
    }
  }, [forcedView]);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [organizations, setOrganizations] = useState<DealOrganizationOption[]>([]);
  const [users, setUsers] = useState<DealUserOption[]>([]);

  const [deals, setDeals] = useState<Deal[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: settings.pageSize || 10,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(
    scope === 'won' ? 'WON' : scope === 'lost' ? 'LOST' : '',
  );
  const [ownerFilter, setOwnerFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [sortField, setSortField] = useState<DealSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewDeal, setPreviewDeal] = useState<Deal | null>(null);
  const [outcomeTarget, setOutcomeTarget] = useState<{
    deal: Deal;
    outcome: DealStatus;
  } | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (scope === 'won') {
      setStatusFilter('WON');
    } else if (scope === 'lost') {
      setStatusFilter('LOST');
    } else {
      setStatusFilter('');
    }
    setPage(1);
  }, [scope]);

  useEffect(() => {
    let active = true;
    const loadLookups = async () => {
      try {
        const [pipes, orgs, assignees] = await Promise.all([
          dealService.getPipelines(),
          dealService.getOrganizations(),
          dealService.getAssignableUsers(),
        ]);
        if (!active) return;
        setPipelines(pipes);
        setOrganizations(orgs);
        setUsers(assignees);
      } catch {
        // ignore lookup failures
      }
    };
    loadLookups();
    return () => {
      active = false;
    };
  }, []);

  const activePipeline = useMemo(() => {
    if (pipelineFilter) {
      return pipelines.find((p) => p.id === pipelineFilter) || null;
    }
    return pipelines.find((p) => p.isDefault) || pipelines[0] || null;
  }, [pipelines, pipelineFilter]);

  const availableStages = useMemo(
    () => activePipeline?.stages || [],
    [activePipeline],
  );

  const currentUserId = user?.id;
  const activePipelineId = activePipeline?.id;

  const loadDeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const effectiveOwnerId =
        scope === 'my' && currentUserId ? currentUserId : ownerFilter || undefined;
      const effectiveStatus =
        scope === 'won'
          ? 'WON'
          : scope === 'lost'
            ? 'LOST'
            : statusFilter || undefined;

      const limit = viewMode === 'board' ? 100 : settings.pageSize || 10;

      const res = await dealService.getDeals({
        page: viewMode === 'board' ? 1 : page,
        limit,
        search: search.trim() || undefined,
        pipelineId:
          viewMode === 'board'
            ? activePipelineId || pipelineFilter || undefined
            : pipelineFilter || undefined,
        stageId: stageFilter || undefined,
        status: effectiveStatus,
        ownerId: effectiveOwnerId,
      });

      setDeals(Array.isArray(res?.data) ? res.data : []);
      if (res?.meta) {
        setMeta(res.meta);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load deals.');
    } finally {
      setIsLoading(false);
    }
  }, [
    scope,
    currentUserId,
    ownerFilter,
    statusFilter,
    viewMode,
    settings.pageSize,
    page,
    search,
    activePipelineId,
    pipelineFilter,
    stageFilter,
  ]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const processedDeals = useMemo(
    () =>
      filterAndSortDeals(deals, {
        search,
        organizationId: organizationFilter,
        sortField,
        sortDirection,
      }),
    [deals, search, organizationFilter, sortField, sortDirection],
  );

  const metrics = useMemo(
    () => computeDealMetrics(processedDeals, availableStages),
    [processedDeals, availableStages],
  );

  const handleToggleSelect = (dealId: string) => {
    setSelectedIds((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId],
    );
  };

  const handleToggleSelectAll = () => {
    const allIds = processedDeals.map((d) => d.id);
    const allSelected =
      allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const handleMoveDealStage = async (deal: Deal, nextStageId: string) => {
    if (!nextStageId || deal.stageId === nextStageId) return;
    try {
      await dealService.updateDealStage(deal.id, nextStageId);
      setBannerMessage(`Moved "${deal.title}" to updated pipeline stage.`);
      await loadDeals();
    } catch (err: any) {
      setError(err?.message || 'Failed to move deal to the selected stage.');
    }
  };

  const handleConfirmOutcome = async (
    dealId: string,
    nextStatus: DealStatus,
    outcomeNote?: string,
  ) => {
    await dealService.updateDealStatus(dealId, nextStatus);
    if (outcomeNote) {
      try {
        await dealService.createNote({
          dealId,
          title: `Deal Outcome Recorded: ${nextStatus}`,
          content: outcomeNote,
        });
      } catch {
        // non-blocking note creation
      }
    }
    setBannerMessage(`Deal outcome updated to ${nextStatus}.`);
    await loadDeals();
  };

  const handleConfirmDelete = async () => {
    if (!deletingDeal) return;
    setIsDeleting(true);
    try {
      await dealService.deleteDeal(deletingDeal.id);
      setBannerMessage(`Deleted deal "${deletingDeal.title}".`);
      setDeletingDeal(null);
      await loadDeals();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete deal.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const targetDeals =
      selectedIds.length > 0
        ? processedDeals.filter((d) => selectedIds.includes(d.id))
        : processedDeals;
    const csv = generateDealsCsv(targetDeals);
    triggerFileDownload(`deals-export-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const hasActiveFilters = Boolean(
    search ||
    pipelineFilter ||
    stageFilter ||
    (scope !== 'won' && scope !== 'lost' && statusFilter) ||
    ownerFilter ||
    organizationFilter,
  );

  const handleResetFilters = () => {
    setSearch('');
    setPipelineFilter('');
    setStageFilter('');
    if (scope !== 'won' && scope !== 'lost') {
      setStatusFilter('');
    }
    setOwnerFilter('');
    setOrganizationFilter('');
    setSortField('createdAt');
    setSortDirection('desc');
    setPage(1);
  };

  const pageTitle = useMemo(() => {
    if (scope === 'my') return 'My Deals';
    if (scope === 'won') return 'Won Deals';
    if (scope === 'lost') return 'Lost Deals';
    if (forcedView === 'board') return 'Deal Board';
    if (forcedView === 'list') return 'Deal List';
    if (forcedView === 'table') return 'Deal Table';
    return 'All Deals';
  }, [scope, forcedView]);

  const pageSubtitle = useMemo(() => {
    if (scope === 'my') {
      return 'Manage opportunities assigned to you across all sales pipelines and stages.';
    }
    if (scope === 'won') {
      return 'Closed-won revenue deals, realized contract values, and win history.';
    }
    if (scope === 'lost') {
      return 'Closed-lost opportunities for win/loss analysis and future re-engagement.';
    }
    if (forcedView === 'board') {
      return 'Kanban stage board for moving deals across pipeline stages and tracking stage values.';
    }
    if (forcedView === 'list') {
      return 'Detailed card list of deals with stage controls, win probability, and quick actions.';
    }
    if (forcedView === 'table') {
      return 'High-density tabular view of deals with inline stage updates, sorting, and bulk export.';
    }
    return 'Track, filter, advance, and close revenue opportunities across all pipelines.';
  }, [scope, forcedView]);

  return (
    <DealsLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <div className="ld-view-switcher" role="group" aria-label="Deal view mode">
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
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              Board
            </button>
          </div>

          <button
            type="button"
            className="auth-btn btn-secondary btn-size-small"
            onClick={handleExportCsv}
            disabled={processedDeals.length === 0}
          >
            <ExternalLinkIcon size={15} /> Export CSV
          </button>

          {permissions.canManageDeals && (
            <Link to="/deals/create" className="auth-btn btn-primary btn-size-small">
              <PlusIcon size={15} /> Create Deal
            </Link>
          )}
        </div>
      }
    >
      {/* KPI Stat Cards */}
      <div className="lg-stat-grid">
        <StatCard
          label="Total Deals"
          value={metrics.totalDeals}
          hint={`${metrics.openDealsCount} Open · ${metrics.wonDealsCount} Won · ${metrics.lostDealsCount} Lost`}
          tone="blue"
          icon={<BriefcaseIcon size={18} />}
        />
        <StatCard
          label="Total Pipeline Value"
          value={formatCurrency(metrics.totalValue)}
          hint={`Avg Deal Size: ${formatCurrency(metrics.averageDealValue)}`}
          tone="purple"
          icon={<TrendingUpIcon size={18} />}
        />
        <StatCard
          label="Weighted Forecast"
          value={formatCurrency(metrics.weightedValue)}
          hint="Probability-adjusted open revenue"
          tone="amber"
          icon={<TargetIcon size={18} />}
        />
        <StatCard
          label="Won Revenue"
          value={formatCurrency(metrics.wonValue)}
          hint={`Win Rate: ${metrics.winRate}% (${metrics.wonDealsCount} won)`}
          tone="green"
          icon={<CheckCircleIcon size={18} />}
        />
      </div>

      {/* Search, Filters & Sorting */}
      <FilterBar
        onRefresh={loadDeals}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <SearchInput
          value={search}
          onChange={(val: string) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search deals, accounts, contacts, stages..."
        />

        <select
          className="lg-select"
          value={pipelineFilter}
          onChange={(e) => {
            setPipelineFilter(e.target.value);
            setStageFilter('');
            setPage(1);
          }}
          aria-label="Filter by pipeline"
        >
          <option value="">All Pipelines</option>
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          className="lg-select"
          value={stageFilter}
          onChange={(e) => {
            setStageFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by stage"
        >
          <option value="">All Stages</option>
          {availableStages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.order}. {s.name} ({s.winProbability}%)
            </option>
          ))}
        </select>

        {scope !== 'won' && scope !== 'lost' && (
          <select
            className="lg-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by deal status"
          >
            <option value="">All Statuses</option>
            {DEAL_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        <select
          className="lg-select"
          value={organizationFilter}
          onChange={(e) => setOrganizationFilter(e.target.value)}
          aria-label="Filter by organization"
        >
          <option value="">All Organizations</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        {scope !== 'my' && (
          <select
            className="lg-select"
            value={ownerFilter}
            onChange={(e) => {
              setOwnerFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by deal owner"
          >
            <option value="">All Owners</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}

        <select
          className="lg-select"
          value={`${sortField}:${sortDirection}`}
          onChange={(e) => {
            const [f, d] = e.target.value.split(':') as [DealSortField, SortDirection];
            setSortField(f);
            setSortDirection(d);
          }}
          aria-label="Sort deals"
        >
          {DEAL_SORT_OPTIONS.map((opt) => (
            <React.Fragment key={opt.value}>
              <option value={`${opt.value}:desc`}>{opt.label} (High / Newest)</option>
              <option value={`${opt.value}:asc`}>{opt.label} (Low / Oldest)</option>
            </React.Fragment>
          ))}
        </select>
      </FilterBar>

      {/* Active View */}
      {viewMode === 'table' && (
        <DealsTableView
          deals={processedDeals}
          pipelines={pipelines}
          activePipeline={activePipeline}
          isLoading={isLoading}
          selectedIds={selectedIds}
          showWeightedValue={settings.showWeightedValue}
          canManageDeals={permissions.canManageDeals}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onPreviewDeal={(deal) => setPreviewDeal(deal)}
          onMoveDealStage={handleMoveDealStage}
          onRecordOutcome={(deal, outcome) => setOutcomeTarget({ deal, outcome })}
          onDeleteDeal={(deal) => setDeletingDeal(deal)}
          emptyAction={
            permissions.canManageDeals ? (
              <Link to="/deals/create" className="auth-btn btn-primary">
                <PlusIcon size={15} /> Create Deal
              </Link>
            ) : undefined
          }
          footer={
            <Pagination
              meta={meta}
              onPageChange={(nextPage) => setPage(nextPage)}
              disabled={isLoading}
              noun="deals"
            />
          }
        />
      )}

      {viewMode === 'list' && (
        <>
          <DealsListView
            deals={processedDeals}
            pipelines={pipelines}
            activePipeline={activePipeline}
            isLoading={isLoading}
            selectedIds={selectedIds}
            showWeightedValue={settings.showWeightedValue}
            canManageDeals={permissions.canManageDeals}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onPreviewDeal={(deal) => setPreviewDeal(deal)}
            onMoveDealStage={handleMoveDealStage}
            onRecordOutcome={(deal, outcome) => setOutcomeTarget({ deal, outcome })}
            onDeleteDeal={(deal) => setDeletingDeal(deal)}
            emptyAction={
              permissions.canManageDeals ? (
                <Link to="/deals/create" className="auth-btn btn-primary">
                  <PlusIcon size={15} /> Create Deal
                </Link>
              ) : undefined
            }
          />
          {processedDeals.length > 0 && (
            <div className="lg-card" style={{ padding: '0.75rem 1rem' }}>
              <Pagination
                meta={meta}
                onPageChange={(nextPage) => setPage(nextPage)}
                disabled={isLoading}
                noun="deals"
              />
            </div>
          )}
        </>
      )}

      {viewMode === 'board' && (
        <DealsBoardView
          deals={processedDeals}
          pipelines={pipelines}
          activePipeline={activePipeline}
          isLoading={isLoading}
          selectedIds={selectedIds}
          showWeightedValue={settings.showWeightedValue}
          canManageDeals={permissions.canManageDeals}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onPreviewDeal={(deal) => setPreviewDeal(deal)}
          onMoveDealStage={handleMoveDealStage}
          onRecordOutcome={(deal, outcome) => setOutcomeTarget({ deal, outcome })}
          onDeleteDeal={(deal) => setDeletingDeal(deal)}
          onOpenCreateDeal={(stId) =>
            navigate(
              `/deals/create${activePipeline
                ? `?pipelineId=${activePipeline.id}${stId ? `&stageId=${stId}` : ''}`
                : ''
              }`,
            )
          }
        />
      )}

      {/* Quick Preview Drawer */}
      <DealQuickDrawer
        deal={previewDeal}
        stages={
          pipelines.find((p) => p.id === previewDeal?.pipelineId)?.stages ||
          availableStages
        }
        isOpen={Boolean(previewDeal)}
        canManageDeals={permissions.canManageDeals}
        onClose={() => setPreviewDeal(null)}
        onMoveDealStage={handleMoveDealStage}
        onRecordOutcome={(deal, outcome) => setOutcomeTarget({ deal, outcome })}
      />

      {/* Record Won/Lost Outcome Modal */}
      <DealOutcomeModal
        deal={outcomeTarget?.deal || null}
        initialOutcome={outcomeTarget?.outcome || 'WON'}
        isOpen={Boolean(outcomeTarget)}
        onClose={() => setOutcomeTarget(null)}
        onConfirm={handleConfirmOutcome}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingDeal)}
        title="Delete Deal"
        message={`Are you sure you want to permanently delete "${deletingDeal?.title || 'this deal'}"? This action cannot be undone.`}
        confirmLabel="Delete Deal"
        isLoading={isDeleting}
        onClose={() => setDeletingDeal(null)}
        onConfirm={handleConfirmDelete}
      />
    </DealsLayout>
  );
};

export default DealsExplorerPage;
