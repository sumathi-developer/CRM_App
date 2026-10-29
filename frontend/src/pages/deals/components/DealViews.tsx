import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  Deal,
  DealStatus,
  Pipeline,
  PipelineStage,
} from '../../../types/deal.types';
import { DataTable, type Column } from '../../lead-generation/components/DataTable';
import { Badge } from '../../lead-generation/components/Cards';
import { Field, FormModal } from '../../lead-generation/components/FormParts';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingIndicator } from '../../../components/auth/LoadingIndicator';
import { formatCurrency, formatDate, formatDateTime } from '../../lead-generation/leadGenConstants';
import {
  computeWeightedDealValue,
  dealStatusTone,
  probabilityTone,
} from '../../pipelines/pipelineConstants';
import {
  PipelineDealCard,
  StageProbabilityBadge,
} from '../../pipelines/components/PipelineDealComponents';
import { PipelineBoardView } from '../../pipelines/components/PipelineViews';
import {
  ActivityIcon,
  ArrowRightIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  EditIcon,
  EyeIcon,
  TrashIcon,
  TrendingUpIcon,
  UserIcon,
  XIcon,
} from '../../../components/common/Icons';

/* ============================================================================
   1. DEAL STAGE PIPELINE STEPPER
   ============================================================================ */

interface DealStageStepperProps {
  stages: PipelineStage[];
  currentStageId?: string | null;
  onSelectStage?: (stageId: string) => void;
  disabled?: boolean;
}

export const DealStageStepper: React.FC<DealStageStepperProps> = ({
  stages,
  currentStageId,
  onSelectStage,
  disabled = false,
}) => {
  if (!stages || stages.length === 0) return null;

  const currentStage = stages.find((s) => s.id === currentStageId);
  const currentOrder = currentStage?.order ?? -1;

  return (
    <div className="ld-qual-pipeline" role="group" aria-label="Deal pipeline stages">
      {stages.map((stage) => {
        const isCurrent = stage.id === currentStageId;
        const isPassed = currentOrder > stage.order && currentOrder !== -1;
        const tone = probabilityTone(stage.winProbability);

        return (
          <button
            key={stage.id}
            type="button"
            disabled={disabled || !onSelectStage}
            onClick={() => onSelectStage?.(stage.id)}
            className={`ld-qual-step tone-${tone} ${isCurrent ? 'is-current' : ''} ${
              isPassed ? 'is-passed' : ''
            }`}
            style={{
              borderLeft: stage.color ? `4px solid ${stage.color}` : undefined,
            }}
          >
            <span className="ld-qual-step-index">{stage.order}</span>
            <div className="ld-qual-step-text">
              <strong>{stage.name}</strong>
              <span>Win Probability: {stage.winProbability}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

/* ============================================================================
   2. DEALS TABLE VIEW (REUSING DATATABLE)
   ============================================================================ */

export interface SharedDealsViewProps {
  deals: Deal[];
  pipelines: Pipeline[];
  activePipeline: Pipeline | null;
  isLoading: boolean;
  selectedIds: string[];
  showWeightedValue?: boolean;
  canManageDeals?: boolean;
  onToggleSelect: (dealId: string) => void;
  onToggleSelectAll: () => void;
  onPreviewDeal: (deal: Deal) => void;
  onMoveDealStage: (deal: Deal, stageId: string) => void;
  onRecordOutcome: (deal: Deal, outcome: DealStatus) => void;
  onDeleteDeal: (deal: Deal) => void;
  onOpenCreateDeal?: (stageId?: string) => void;
  emptyAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export const DealsTableView: React.FC<SharedDealsViewProps> = ({
  deals,
  pipelines,
  isLoading,
  selectedIds,
  showWeightedValue = true,
  canManageDeals = true,
  onToggleSelect,
  onToggleSelectAll,
  onPreviewDeal,
  onMoveDealStage,
  onRecordOutcome,
  onDeleteDeal,
  emptyAction,
  footer,
}) => {
  const allSelected = deals.length > 0 && deals.every((d) => selectedIds.includes(d.id));

  const getStagesForDeal = (deal: Deal): PipelineStage[] => {
    const pipe =
      pipelines.find((p) => p.id === deal.pipelineId) ||
      pipelines.find((p) => p.isDefault) ||
      pipelines[0];
    return pipe?.stages || [];
  };

  const columns: Column<Deal>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          className="ld-checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          aria-label="Select all deals on page"
        />
      ),
      render: (deal) => (
        <input
          type="checkbox"
          className="ld-checkbox"
          checked={selectedIds.includes(deal.id)}
          onChange={() => onToggleSelect(deal.id)}
          aria-label={`Select ${deal.title}`}
        />
      ),
    },
    {
      key: 'deal',
      header: 'Deal & Account',
      render: (deal) => (
        <div className="lg-cell-stack">
          <Link to={`/deals/${deal.id}`} className="lg-row-link">
            {deal.title}
          </Link>
          <span className="lg-cell-sub">
            {deal.organization?.name || 'Independent Account'}
            {deal.contact
              ? ` · ${deal.contact.firstName} ${deal.contact.lastName}`
              : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'pipelineStage',
      header: 'Pipeline & Stage',
      render: (deal) => {
        const stages = getStagesForDeal(deal);
        return (
          <div className="lg-cell-stack">
            {canManageDeals && stages.length > 0 ? (
              <select
                className="lg-select ld-compact-select"
                value={deal.stageId || ''}
                onChange={(e) => onMoveDealStage(deal, e.target.value)}
                aria-label={`Change stage for ${deal.title}`}
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.order}. {st.name}
                  </option>
                ))}
              </select>
            ) : (
              <Badge tone="blue">{deal.stage?.name || 'Unstaged'}</Badge>
            )}
            <span className="lg-cell-sub">
              {deal.pipeline?.name || 'Default Pipeline'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'probability',
      header: 'Probability',
      render: (deal) => (
        <StageProbabilityBadge
          probability={deal.probability ?? deal.stage?.winProbability ?? 0}
          showBar
          color={deal.stage?.color}
        />
      ),
    },
    {
      key: 'value',
      header: 'Deal Value',
      align: 'right',
      render: (deal) => (
        <div className="lg-cell-stack">
          <strong>{formatCurrency(deal.value)}</strong>
          {showWeightedValue && (
            <span className="lg-cell-sub">
              W: {formatCurrency(computeWeightedDealValue(deal, deal.stage?.winProbability))}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (deal) => <Badge tone={dealStatusTone(deal.status)}>{deal.status}</Badge>,
    },
    {
      key: 'expectedClose',
      header: 'Expected Close',
      render: (deal) => (
        <span className="lg-muted">
          {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : '—'}
        </span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (deal) => (
        <span className="lg-muted">{deal.owner?.name || 'Unassigned'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (deal) => (
        <div className="lg-row-actions">
          <button
            type="button"
            className="lg-icon-btn"
            title="Quick Preview Drawer"
            onClick={() => onPreviewDeal(deal)}
          >
            <EyeIcon size={15} />
          </button>
          <Link to={`/deals/${deal.id}`} className="lg-icon-btn" title="Open Deal Details">
            <ArrowRightIcon size={15} />
          </Link>
          {canManageDeals && (
            <Link to={`/deals/${deal.id}/edit`} className="lg-icon-btn" title="Edit Deal">
              <EditIcon size={15} />
            </Link>
          )}
          {canManageDeals && deal.status !== 'WON' && (
            <button
              type="button"
              className="lg-icon-btn ld-convert-icon-btn"
              title="Mark as WON"
              onClick={() => onRecordOutcome(deal, 'WON')}
            >
              <CheckCircleIcon size={15} />
            </button>
          )}
          {canManageDeals && (
            <button
              type="button"
              className="lg-icon-btn danger"
              title="Delete Deal"
              onClick={() => onDeleteDeal(deal)}
            >
              <TrashIcon size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={deals}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      loadingMessage="Loading deals..."
      emptyTitle="No deals match the current filters"
      emptyDescription="Try clearing active search or stage/status filters, or create a new deal."
      emptyAction={emptyAction}
      footer={footer}
    />
  );
};

/* ============================================================================
   3. DEALS LIST VIEW (CARD LIST)
   ============================================================================ */

export const DealsListView: React.FC<SharedDealsViewProps> = ({
  deals,
  pipelines,
  isLoading,
  showWeightedValue = true,
  canManageDeals = true,
  onMoveDealStage,
  onRecordOutcome,
  onDeleteDeal,
  emptyAction,
}) => {
  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="large" message="Loading deal list..." />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="lg-card lg-state-box">
        <EmptyState
          title="No deals found"
          description="Adjust your search, pipeline, stage, or status filters, or create a new deal."
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="ld-cards-stack">
      {deals.map((deal) => {
        const pipe =
          pipelines.find((p) => p.id === deal.pipelineId) ||
          pipelines.find((p) => p.isDefault) ||
          pipelines[0];
        const stages = pipe?.stages || [];

        return (
          <div key={deal.id} className="ld-subcard">
            <PipelineDealCard
              deal={deal}
              stages={stages}
              showWeightedValue={showWeightedValue}
              canManageDeals={canManageDeals}
              onMoveStage={onMoveDealStage}
              onStatusChange={(d, nextStatus) => onRecordOutcome(d, nextStatus)}
              onDeleteDeal={onDeleteDeal}
            />
            <div className="ld-card-footer">
              <span className="lg-muted">
                Pipeline: {deal.pipeline?.name || pipe?.name || 'Default'} · Stage:{' '}
                {deal.stage?.name || 'Unstaged'}
              </span>
              <div className="lg-badge-row">
                <Link to={`/deals/${deal.id}`} className="auth-btn btn-secondary btn-size-small">
                  Open Deal Details
                </Link>
                {canManageDeals && (
                  <Link
                    to={`/deals/${deal.id}/edit`}
                    className="auth-btn btn-secondary btn-size-small"
                  >
                    Edit Deal
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================================
   4. DEALS BOARD VIEW (REUSING PIPELINE BOARD VIEW)
   ============================================================================ */

export const DealsBoardView: React.FC<SharedDealsViewProps> = ({
  deals,
  activePipeline,
  isLoading,
  showWeightedValue = true,
  canManageDeals = true,
  onMoveDealStage,
  onRecordOutcome,
  onPreviewDeal,
  onDeleteDeal,
  onOpenCreateDeal,
}) => {
  if (!activePipeline) {
    return (
      <div className="lg-card lg-state-box">
        <EmptyState
          title="No Pipeline Selected for Board View"
          description="Create or select a sales pipeline to view deals on a Kanban stage board."
          action={
            <Link to="/pipelines/create" className="auth-btn btn-primary">
              Create Pipeline
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <PipelineBoardView
      pipeline={activePipeline}
      deals={deals}
      isLoading={isLoading}
      showWeightedValue={showWeightedValue}
      enableDragAndDrop
      canManagePipelines={canManageDeals}
      canManageDeals={canManageDeals}
      onMoveDealStage={onMoveDealStage}
      onStatusChange={onRecordOutcome}
      onOpenCreateDeal={(stId) => onOpenCreateDeal?.(stId)}
      onEditDeal={onPreviewDeal}
      onDeleteDeal={onDeleteDeal}
    />
  );
};

/* ============================================================================
   5. DEAL QUICK PREVIEW DRAWER
   ============================================================================ */

interface DealQuickDrawerProps {
  deal: Deal | null;
  stages: PipelineStage[];
  isOpen: boolean;
  canManageDeals?: boolean;
  onClose: () => void;
  onMoveDealStage?: (deal: Deal, stageId: string) => void;
  onRecordOutcome?: (deal: Deal, outcome: DealStatus) => void;
}

export const DealQuickDrawer: React.FC<DealQuickDrawerProps> = ({
  deal,
  stages,
  isOpen,
  canManageDeals = true,
  onClose,
  onMoveDealStage,
  onRecordOutcome,
}) => {
  if (!isOpen || !deal) return null;

  const weighted = computeWeightedDealValue(deal, deal.stage?.winProbability);

  return (
    <div className="ld-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="ld-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Deal preview: ${deal.title}`}
      >
        <header className="ld-drawer-header">
          <div>
            <h3 className="ld-drawer-title">{deal.title}</h3>
            <p className="ld-drawer-subtitle">
              {deal.organization?.name || 'Direct Deal'} · {formatCurrency(deal.value)}
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
            <Badge tone={dealStatusTone(deal.status)}>{deal.status}</Badge>
            <Badge tone="blue">{deal.stage?.name || 'Unstaged'}</Badge>
            <Badge tone={probabilityTone(deal.probability)}>
              {deal.probability}% Win Prob
            </Badge>
          </div>

          {stages.length > 0 && (
            <div className="ld-drawer-section">
              <h4 className="ld-drawer-section-title">Pipeline Stage Progression</h4>
              <DealStageStepper
                stages={stages}
                currentStageId={deal.stageId}
                onSelectStage={
                  canManageDeals && onMoveDealStage
                    ? (stId) => onMoveDealStage(deal, stId)
                    : undefined
                }
                disabled={!canManageDeals}
              />
            </div>
          )}

          <div className="ld-drawer-section">
            <h4 className="ld-drawer-section-title">Deal Summary</h4>
            <div className="ld-kv-list">
              <div className="ld-kv-row">
                <span className="ld-kv-label">Deal Value</span>
                <strong>{formatCurrency(deal.value)}</strong>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">Weighted Value</span>
                <span>{formatCurrency(weighted)}</span>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <BuildingIcon size={13} /> Organization
                </span>
                <span>{deal.organization?.name || '—'}</span>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <UserIcon size={13} /> Primary Contact
                </span>
                <span>
                  {deal.contact
                    ? `${deal.contact.firstName} ${deal.contact.lastName}`
                    : '—'}
                </span>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <CalendarIcon size={13} /> Expected Close
                </span>
                <span>
                  {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : '—'}
                </span>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">Owner</span>
                <span>{deal.owner?.name || 'Unassigned'}</span>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">Created</span>
                <span>{formatDateTime(deal.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="ld-drawer-section">
            <h4 className="ld-drawer-section-title">Quick Navigation</h4>
            <div className="ld-drawer-nav-grid">
              <Link
                to={`/deals/${deal.id}`}
                className="ld-drawer-nav-btn"
                onClick={onClose}
              >
                <ArrowRightIcon size={14} /> Deal Details
              </Link>
              {canManageDeals && (
                <Link
                  to={`/deals/${deal.id}/edit`}
                  className="ld-drawer-nav-btn"
                  onClick={onClose}
                >
                  <EditIcon size={14} /> Edit Deal
                </Link>
              )}
              <Link
                to={`/deals/${deal.id}/activities`}
                className="ld-drawer-nav-btn"
                onClick={onClose}
              >
                <ActivityIcon size={14} /> Activities ({deal._count?.activities ?? 0})
              </Link>
              <Link
                to={`/deals/${deal.id}/notes`}
                className="ld-drawer-nav-btn"
                onClick={onClose}
              >
                Notes ({deal._count?.notes ?? 0})
              </Link>
              <Link
                to={`/deals/${deal.id}/documents`}
                className="ld-drawer-nav-btn"
                onClick={onClose}
              >
                Documents
              </Link>
            </div>
          </div>
        </div>

        <footer className="ld-drawer-footer">
          {canManageDeals && onRecordOutcome && deal.status !== 'WON' && (
            <button
              type="button"
              className="auth-btn btn-primary"
              onClick={() => {
                onClose();
                onRecordOutcome(deal, 'WON');
              }}
            >
              Mark as Won
            </button>
          )}
          {canManageDeals && onRecordOutcome && deal.status !== 'LOST' && (
            <button
              type="button"
              className="auth-btn btn-danger"
              onClick={() => {
                onClose();
                onRecordOutcome(deal, 'LOST');
              }}
            >
              Mark as Lost
            </button>
          )}
          <Link to={`/deals/${deal.id}`} className="auth-btn btn-secondary" onClick={onClose}>
            Full Details
          </Link>
        </footer>
      </aside>
    </div>
  );
};

/* ============================================================================
   6. RECORD WON / LOST OUTCOME MODAL
   ============================================================================ */

interface DealOutcomeModalProps {
  deal: Deal | null;
  initialOutcome: DealStatus;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dealId: string, status: DealStatus, outcomeNote?: string) => Promise<void>;
}

export const DealOutcomeModal: React.FC<DealOutcomeModalProps> = ({
  deal,
  initialOutcome,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [status, setStatus] = useState<DealStatus>(initialOutcome);
  const [outcomeNote, setOutcomeNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus(initialOutcome);
      setOutcomeNote('');
      setError(null);
    }
  }, [isOpen, initialOutcome]);

  if (!deal) return null;

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onConfirm(deal.id, status, outcomeNote.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update deal outcome.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      title={`Record Deal Outcome — ${deal.title}`}
      subtitle={`Value: ${formatCurrency(deal.value)} · Current Status: ${deal.status}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={`Confirm Deal as ${status}`}
      isSaving={isSaving}
      error={error}
    >
      <div className="ld-form-stack">
        <Field label="Deal Outcome / Status" htmlFor="deal-outcome-select" required>
          <select
            id="deal-outcome-select"
            className="lg-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as DealStatus)}
          >
            <option value="WON">WON — Closed Won Deal (100% Revenue Realized)</option>
            <option value="LOST">LOST — Closed Lost Opportunity</option>
            <option value="OPEN">OPEN — Reopen Active Deal</option>
          </select>
        </Field>

        <Field
          label={
            status === 'WON'
              ? 'Win Summary / Closing Note (Optional)'
              : status === 'LOST'
                ? 'Loss Reason / Post-Mortem Note (Optional)'
                : 'Reopen Note (Optional)'
          }
          htmlFor="deal-outcome-note"
          hint="If provided, this note will be automatically recorded on the deal timeline."
        >
          <textarea
            id="deal-outcome-note"
            className="lg-textarea"
            rows={3}
            placeholder={
              status === 'WON'
                ? 'e.g. Annual enterprise agreement signed after executive security review.'
                : 'e.g. Prospect deferred budget to Q3.'
            }
            value={outcomeNote}
            onChange={(e) => setOutcomeNote(e.target.value)}
          />
        </Field>

        <div className="ld-confirm-callout">
          <TrendingUpIcon size={16} />
          <span>
            Updating this deal to <strong>{status}</strong> will record the outcome in your
            Won/Lost views and pipeline analytics.
          </span>
        </div>
      </div>
    </FormModal>
  );
};

