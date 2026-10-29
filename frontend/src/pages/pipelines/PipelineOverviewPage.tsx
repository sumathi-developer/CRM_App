import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pipelineService } from '../../services/pipeline.service';
import { contactService } from '../../services/contact.service';
import type {
  CreatePipelineDealPayload,
  DealStatus,
  Pipeline,
  PipelineDeal,
  PipelineViewMode,
  UpdatePipelineDealPayload,
} from '../../types/pipeline.types';
import type { Contact, ContactOrganization } from '../../types/contact.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { FilterBar, FilterSelect, SearchInput } from '../lead-generation/components/FilterBar';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { formatCurrency, formatNumber } from '../lead-generation/leadGenConstants';
import {
  DEAL_STATUS_OPTIONS,
  computeWeightedDealValue,
  getPipelinePermissions,
  summarizeStageDeals,
} from './pipelineConstants';
import { PipelinesLayout } from './components/PipelinesLayout';
import {
  PipelineSelectorBar,
  QuickDealModal,
  StageProbabilityBadge,
} from './components/PipelineDealComponents';
import {
  PipelineBoardView,
  PipelineListView,
  PipelineStageFunnelStrip,
  PipelineTableView,
} from './components/PipelineViews';
import {
  AwardIcon,
  CheckCircleIcon,
  DollarSignIcon,
  EditIcon,
  PlusIcon,
  SlidersIcon,
  TrendingUpIcon,
} from '../../components/common/Icons';

export const PipelineOverviewPage: React.FC = () => {
  const { id: routePipelineId } = useParams<{ id?: string }>();
  const { user: currentUser } = useAuth();
  const { users } = useUserOptions();
  const location = useLocation();
  const permissions = useMemo(() => getPipelinePermissions(currentUser), [currentUser]);
  const savedSettings = useMemo(() => pipelineService.getLocalSettings(), []);

  // Derive view mode from route (/pipelines, /pipelines/board, /pipelines/list, /pipelines/table)
  const routeViewMode = useMemo<PipelineViewMode | null>(() => {
    const p = location.pathname;
    if (p.endsWith('/board')) return 'board';
    if (p.endsWith('/list')) return 'list';
    if (p.endsWith('/table')) return 'table';
    if (p === '/pipelines') return 'overview';
    return null;
  }, [location.pathname]);

  const [manualViewMode, setManualViewMode] = useState<PipelineViewMode>(
    savedSettings.defaultView || 'board',
  );
  const viewMode: PipelineViewMode = routeViewMode || manualViewMode;

  // Pipelines & Deals State
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [organizations, setOrganizations] = useState<ContactOrganization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  // Quick Deal Create/Edit & Delete Modals
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [initialDealStageId, setInitialDealStageId] = useState<string | undefined>(undefined);
  const [editingDeal, setEditingDeal] = useState<PipelineDeal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<PipelineDeal | null>(null);
  const [isDeletingDeal, setIsDeletingDeal] = useState(false);

  const loadPipelineWorkspace = useCallback(
    async (preferredPipelineId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const allPipelines = await pipelineService.getPipelines();
        setPipelines(allPipelines);

        const targetId =
          preferredPipelineId ||
          routePipelineId ||
          pipelineService.getSavedPipelineId() ||
          allPipelines.find((p) => p.isDefault)?.id ||
          allPipelines[0]?.id ||
          '';

        if (!targetId) {
          setActivePipeline(null);
          setDeals([]);
          return;
        }

        const [fullPipeline, dealsRes] = await Promise.all([
          pipelineService
            .getPipelineById(targetId)
            .catch(() => allPipelines.find((p) => p.id === targetId) || null),
          pipelineService.getDeals({
            pipelineId: targetId,
            limit: 100,
          }),
        ]);

        setActivePipeline(fullPipeline);
        if (fullPipeline) {
          pipelineService.setSavedPipelineId(fullPipeline.id);
        }
        setDeals(dealsRes.data || fullPipeline?.deals || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load sales pipeline data.');
      } finally {
        setIsLoading(false);
      }
    },
    [routePipelineId],
  );

  useEffect(() => {
    loadPipelineWorkspace();
  }, [loadPipelineWorkspace]);

  useEffect(() => {
    contactService.getOrganizations().then(setOrganizations).catch(() => setOrganizations([]));
    contactService
      .getContacts({ limit: 50 })
      .then((res) => setContacts(res.data || []))
      .catch(() => setContacts([]));
  }, []);

  const handleSelectPipeline = (newPipelineId: string) => {
    setStageFilter('');
    pipelineService.setSavedPipelineId(newPipelineId);
    loadPipelineWorkspace(newPipelineId);
  };

  // Filtered deals
  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((deal) => {
      if (stageFilter && deal.stageId !== stageFilter) return false;
      if (statusFilter && (deal.status || '').toUpperCase() !== statusFilter.toUpperCase()) {
        return false;
      }
      if (ownerFilter && deal.ownerId !== ownerFilter) return false;
      if (q) {
        const hay = [
          deal.title,
          deal.organization?.name || '',
          deal.contact?.firstName || '',
          deal.contact?.lastName || '',
          deal.owner?.name || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [deals, search, stageFilter, statusFilter, ownerFilter]);

  // Pipeline KPI summary
  const metrics = useMemo(() => {
    const stages = activePipeline?.stages || [];
    const totalValue = filteredDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const weightedValue = filteredDeals.reduce((sum, d) => {
      const st = stages.find((s) => s.id === d.stageId);
      return sum + computeWeightedDealValue(d, st?.winProbability);
    }, 0);
    const openCount = filteredDeals.filter((d) => d.status === 'OPEN').length;
    const wonValue = filteredDeals
      .filter((d) => d.status === 'WON')
      .reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    return { totalValue, weightedValue, openCount, wonValue };
  }, [filteredDeals, activePipeline]);

  // Move Deal Stage
  const handleMoveDealStage = async (deal: PipelineDeal, nextStageId: string) => {
    if (!permissions.canManageDeals || deal.stageId === nextStageId) return;
    setError(null);
    try {
      await pipelineService.moveDealToStage(deal.id, nextStageId);
      const targetStage = activePipeline?.stages.find((s) => s.id === nextStageId);
      setSuccess(
        `Moved "${deal.title}" to stage "${targetStage?.name || 'selected stage'}" (${
          targetStage?.winProbability ?? deal.probability
        }% win probability).`,
      );
      await loadPipelineWorkspace(activePipeline?.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to move deal to stage.');
    }
  };

  // Update Deal Status (OPEN / WON / LOST)
  const handleDealStatusChange = async (deal: PipelineDeal, nextStatus: DealStatus) => {
    if (!permissions.canManageDeals) return;
    setError(null);
    try {
      await pipelineService.updateDealStatus(deal.id, nextStatus);
      setSuccess(`Marked deal "${deal.title}" as ${nextStatus}.`);
      await loadPipelineWorkspace(activePipeline?.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to update deal status.');
    }
  };

  // Create or Update Deal
  const handleSaveDeal = async (
    payload: CreatePipelineDealPayload | UpdatePipelineDealPayload,
    dealId?: string,
  ) => {
    if (dealId) {
      await pipelineService.updateDeal(dealId, payload);
      setSuccess(`Updated deal "${payload.title}".`);
    } else {
      await pipelineService.createDeal(payload as CreatePipelineDealPayload);
      setSuccess(`Created deal "${payload.title}".`);
    }
    await loadPipelineWorkspace(activePipeline?.id);
  };

  // Delete Deal
  const handleConfirmDeleteDeal = async () => {
    if (!dealToDelete) return;
    setIsDeletingDeal(true);
    setError(null);
    try {
      await pipelineService.deleteDeal(dealToDelete.id);
      setSuccess(`Deleted deal "${dealToDelete.title}".`);
      setDealToDelete(null);
      await loadPipelineWorkspace(activePipeline?.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete deal.');
    } finally {
      setIsDeletingDeal(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStageFilter('');
    setStatusFilter('');
    setOwnerFilter('');
  };

  const pageTitle = useMemo(() => {
    if (viewMode === 'board') return `Pipeline Board${activePipeline ? ` — ${activePipeline.name}` : ''}`;
    if (viewMode === 'list') return `Pipeline List${activePipeline ? ` — ${activePipeline.name}` : ''}`;
    if (viewMode === 'table') return `Pipeline Table${activePipeline ? ` — ${activePipeline.name}` : ''}`;
    return `Pipeline Overview${activePipeline ? ` — ${activePipeline.name}` : ''}`;
  }, [viewMode, activePipeline]);

  const sharedViewProps = activePipeline
    ? {
        pipeline: activePipeline,
        deals: filteredDeals,
        isLoading,
        showWeightedValue: savedSettings.showWeightedValue,
        showStageProbabilityBar: savedSettings.showStageProbabilityBar,
        enableDragAndDrop: savedSettings.enableDragAndDrop,
        canManagePipelines: permissions.canManagePipelines,
        canManageDeals: permissions.canManageDeals,
        onMoveDealStage: handleMoveDealStage,
        onStatusChange: handleDealStatusChange,
        onOpenCreateDeal: (stId?: string) => {
          setEditingDeal(null);
          setInitialDealStageId(stId);
          setIsDealModalOpen(true);
        },
        onEditDeal: (d: PipelineDeal) => {
          setEditingDeal(d);
          setIsDealModalOpen(true);
        },
        onDeleteDeal: (d: PipelineDeal) => setDealToDelete(d),
      }
    : null;

  return (
    <PipelinesLayout
      title={pageTitle}
      subtitle="Select a sales pipeline, track deals across stages, monitor win probabilities, and forecast weighted revenue."
      icon={<TrendingUpIcon size={22} />}
      activePipeline={activePipeline}
      pipelines={pipelines}
      onSelectPipelineId={handleSelectPipeline}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <>
          {activePipeline && permissions.canManagePipelines && (
            <>
              <Link
                to={`/pipelines/${activePipeline.id}/probability`}
                className="auth-btn btn-secondary"
              >
                <AwardIcon size={15} />
                <span>Stage Probability</span>
              </Link>
              <Link
                to={`/pipelines/${activePipeline.id}/edit`}
                className="auth-btn btn-secondary"
              >
                <EditIcon size={15} />
                <span>Edit Pipeline</span>
              </Link>
            </>
          )}
          {permissions.canManagePipelines && (
            <Link to="/pipelines/create" className="auth-btn btn-primary" id="btn-create-pipeline">
              <PlusIcon size={16} />
              <span>Create Pipeline</span>
            </Link>
          )}
        </>
      }
    >
      {isLoading && !activePipeline ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading sales pipelines..." />
        </div>
      ) : !activePipeline ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No Sales Pipelines Found"
            description="Create your first sales pipeline with custom stages and win probabilities to start tracking deals."
            action={
              permissions.canManagePipelines ? (
                <Link to="/pipelines/create" className="auth-btn btn-primary">
                  <PlusIcon size={16} />
                  <span>Create First Pipeline</span>
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          {/* KPI Stat Cards */}
          <section className="lg-stats-grid" aria-label="Pipeline metrics">
            <StatCard
              label="Total Pipeline Value"
              value={formatCurrency(metrics.totalValue)}
              hint={`${formatNumber(filteredDeals.length)} deal(s) in view`}
              tone="blue"
              icon={<DollarSignIcon size={18} />}
            />
            <StatCard
              label="Weighted Revenue Forecast"
              value={formatCurrency(metrics.weightedValue)}
              hint="Adjusted by stage win probability"
              tone="purple"
              icon={<TrendingUpIcon size={18} />}
            />
            <StatCard
              label="Open Active Deals"
              value={formatNumber(metrics.openCount)}
              hint={`Across ${activePipeline.stages?.length ?? 0} stages`}
              tone="amber"
              icon={<AwardIcon size={18} />}
            />
            <StatCard
              label="Closed Won Value"
              value={formatCurrency(metrics.wonValue)}
              hint="Status: WON"
              tone="green"
              icon={<CheckCircleIcon size={18} />}
            />
          </section>

          {/* Pipeline Selector & View Mode Switcher Bar */}
          <PipelineSelectorBar
            pipelines={pipelines}
            activePipeline={activePipeline}
            onSelectPipeline={handleSelectPipeline}
            viewMode={viewMode}
            onChangeViewMode={(nextMode) => setManualViewMode(nextMode)}
            canManagePipelines={permissions.canManagePipelines}
            canManageDeals={permissions.canManageDeals}
            onOpenCreateDeal={() => {
              setEditingDeal(null);
              setInitialDealStageId(activePipeline.stages?.[0]?.id);
              setIsDealModalOpen(true);
            }}
          />

          {/* Interactive Stage Funnel & Probability Strip */}
          <PipelineStageFunnelStrip
            pipeline={activePipeline}
            deals={deals}
            selectedStageId={stageFilter}
            onSelectStageFilter={setStageFilter}
          />

          {/* Search & Filter Bar */}
          <FilterBar
            onRefresh={() => loadPipelineWorkspace(activePipeline.id)}
            onReset={resetFilters}
            hasActiveFilters={Boolean(search || stageFilter || statusFilter || ownerFilter)}
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search deals by title, organization, contact, or owner..."
            />

            <FilterSelect
              label="Stage"
              value={stageFilter}
              onChange={setStageFilter}
              options={(activePipeline.stages || []).map((s) => ({
                value: s.id,
                label: `${s.order}. ${s.name} (${s.winProbability}%)`,
              }))}
              allLabel="All Stages"
            />

            <FilterSelect
              label="Deal Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={DEAL_STATUS_OPTIONS}
              allLabel="All Statuses"
            />

            <FilterSelect
              label="Owner"
              value={ownerFilter}
              onChange={setOwnerFilter}
              options={users.map((u) => ({ value: u.id, label: u.name }))}
              allLabel="All Owners"
            />
          </FilterBar>

          {/* Overview Mode: Stage Breakdown Table + Board Preview */}
          {viewMode === 'overview' && sharedViewProps && (
            <>
              <SectionCard
                title={`Stage Breakdown & Win Probability — ${activePipeline.name}`}
                subtitle="Stage-by-stage distribution of deals, win probability, total value, and weighted forecast."
                actions={
                  <div className="lg-badge-row">
                    <Link
                      to={`/pipelines/${activePipeline.id}/stage-management`}
                      className="auth-btn btn-secondary"
                    >
                      <SlidersIcon size={14} />
                      <span>Manage Stages</span>
                    </Link>
                    <Link
                      to={`/pipelines/${activePipeline.id}/probability`}
                      className="auth-btn btn-secondary"
                    >
                      <span>Stage Probability</span>
                    </Link>
                  </div>
                }
              >
                <div className="ld-items-stack">
                  {(activePipeline.stages || []).map((stage) => {
                    const { stageDeals, totalValue, weightedValue } = summarizeStageDeals(
                      stage,
                      filteredDeals,
                    );
                    return (
                      <div key={stage.id} className="ld-subcard">
                        <div className="ld-subcard-top">
                          <div className="lg-badge-row">
                            <span
                              className="ld-timeline-dot"
                              style={{ backgroundColor: stage.color || '#3b82f6' }}
                            />
                            <strong>
                              Stage {stage.order}: {stage.name}
                            </strong>
                            <Badge tone="slate">
                              {stageDeals.length} deal{stageDeals.length === 1 ? '' : 's'}
                            </Badge>
                          </div>
                          <div className="lg-badge-row">
                            <StageProbabilityBadge
                              probability={stage.winProbability}
                              showBar={savedSettings.showStageProbabilityBar}
                              color={stage.color}
                            />
                            <strong>{formatCurrency(totalValue)}</strong>
                            <span className="lg-muted">
                              (Weighted: {formatCurrency(weightedValue)})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <PipelineBoardView {...sharedViewProps} />
            </>
          )}

          {/* Board Mode */}
          {viewMode === 'board' && sharedViewProps && (
            <PipelineBoardView {...sharedViewProps} />
          )}

          {/* List Mode */}
          {viewMode === 'list' && sharedViewProps && <PipelineListView {...sharedViewProps} />}

          {/* Table Mode */}
          {viewMode === 'table' && sharedViewProps && (
            <PipelineTableView {...sharedViewProps} />
          )}
        </>
      )}

      {/* Quick Create / Edit Deal Modal */}
      <QuickDealModal
        isOpen={isDealModalOpen}
        pipeline={activePipeline}
        initialStageId={initialDealStageId}
        editingDeal={editingDeal}
        organizations={organizations}
        contacts={contacts}
        users={users}
        onClose={() => {
          setIsDealModalOpen(false);
          setEditingDeal(null);
        }}
        onSave={handleSaveDeal}
      />

      {/* Delete Deal Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(dealToDelete)}
        title="Delete Deal"
        message={`Are you sure you want to permanently delete deal "${dealToDelete?.title}"?`}
        confirmLabel="Delete Deal"
        onConfirm={handleConfirmDeleteDeal}
        onClose={() => setDealToDelete(null)}
        isLoading={isDeletingDeal}
      />
    </PipelinesLayout>
  );
};

