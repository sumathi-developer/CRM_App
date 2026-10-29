import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  DealStatus,
  Pipeline,
  PipelineDeal,
} from '../../../types/pipeline.types';
import { DataTable, type Column } from '../../lead-generation/components/DataTable';
import { Badge, SectionCard } from '../../lead-generation/components/Cards';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingIndicator } from '../../../components/auth/LoadingIndicator';
import { formatCurrency, formatDate } from '../../lead-generation/leadGenConstants';
import {
  computeWeightedDealValue,
  dealStatusTone,
  probabilityTone,
  summarizeStageDeals,
} from '../pipelineConstants';
import { PipelineDealCard, StageProbabilityBadge } from './PipelineDealComponents';
import {
  BuildingIcon,
  CheckCircleIcon,
  EditIcon,
  PlusIcon,
  SlidersIcon,
  TrashIcon,
  UserIcon,
} from '../../../components/common/Icons';

export interface SharedPipelineViewProps {
  pipeline: Pipeline;
  deals: PipelineDeal[];
  isLoading?: boolean;
  showWeightedValue?: boolean;
  showStageProbabilityBar?: boolean;
  enableDragAndDrop?: boolean;
  canManagePipelines?: boolean;
  canManageDeals?: boolean;
  onMoveDealStage: (deal: PipelineDeal, nextStageId: string) => void;
  onStatusChange: (deal: PipelineDeal, nextStatus: DealStatus) => void;
  onOpenCreateDeal: (stageId?: string) => void;
  onEditDeal: (deal: PipelineDeal) => void;
  onDeleteDeal: (deal: PipelineDeal) => void;
}

/* ============================================================================
   1. STAGE FUNNEL OVERVIEW STRIP
   ============================================================================ */

export const PipelineStageFunnelStrip: React.FC<{
  pipeline: Pipeline;
  deals: PipelineDeal[];
  onSelectStageFilter?: (stageId: string) => void;
  selectedStageId?: string;
}> = ({ pipeline, deals, onSelectStageFilter, selectedStageId = '' }) => {
  const stages = pipeline.stages || [];

  if (stages.length === 0) return null;

  return (
    <div className="lg-card ld-details-stage-card">
      <div className="ld-stage-card-head">
        <div>
          <span className="lg-stat-label">
            Stage Funnel & Win Probability — {pipeline.name}
          </span>
          <p className="lg-field-hint">
            Click a stage to filter deals or inspect stage probability and weighted revenue.
          </p>
        </div>
        <div className="lg-badge-row">
          {selectedStageId && onSelectStageFilter && (
            <button
              type="button"
              className="lg-link-btn"
              onClick={() => onSelectStageFilter('')}
            >
              Show All Stages
            </button>
          )}
          <Link to={`/pipelines/${pipeline.id}/probability`} className="lg-link-btn">
            Configure Probabilities
          </Link>
        </div>
      </div>

      <div className="ld-qual-pipeline" role="group" aria-label="Pipeline stages">
        {stages.map((stage) => {
          const { stageDeals, totalValue, weightedValue } = summarizeStageDeals(stage, deals);
          const isSelected = selectedStageId === stage.id;
          const tone = probabilityTone(stage.winProbability);

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() =>
                onSelectStageFilter?.(isSelected ? '' : stage.id)
              }
              className={`ld-qual-step tone-${tone} ${isSelected ? 'is-current' : ''}`}
              style={{
                borderLeft: stage.color ? `4px solid ${stage.color}` : undefined,
              }}
            >
              <span className="ld-qual-step-index">{stage.order}</span>
              <div className="ld-qual-step-text">
                <strong>
                  {stage.name} ({stage.winProbability}%)
                </strong>
                <span>
                  {stageDeals.length} deal{stageDeals.length === 1 ? '' : 's'} ·{' '}
                  {formatCurrency(totalValue)} (W: {formatCurrency(weightedValue)})
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   2. PIPELINE BOARD VIEW (KANBAN WITH STAGE COLUMNS & DRAG-AND-DROP)
   ============================================================================ */

export const PipelineBoardView: React.FC<SharedPipelineViewProps> = ({
  pipeline,
  deals,
  isLoading = false,
  showWeightedValue = true,
  enableDragAndDrop = true,
  canManagePipelines = true,
  canManageDeals = true,
  onMoveDealStage,
  onStatusChange,
  onOpenCreateDeal,
  onEditDeal,
  onDeleteDeal,
}) => {
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const stages = pipeline.stages || [];

  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="large" message="Loading pipeline board..." />
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="lg-card lg-state-box">
        <EmptyState
          title="No stages configured in this pipeline"
          description="Add stages to organize deals into a visual Kanban board."
          action={
            canManagePipelines ? (
              <Link
                to={`/pipelines/${pipeline.id}/stage-management`}
                className="auth-btn btn-primary"
              >
                <SlidersIcon size={15} />
                <span>Configure Pipeline Stages</span>
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, deal: PipelineDeal) => {
    setDraggedDealId(deal.id);
    e.dataTransfer.setData('text/plain', deal.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, stageId: string) => {
    if (!enableDragAndDrop || !canManageDeals) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    setDraggedDealId(null);
    setDragOverStageId(null);

    if (!dealId || !enableDragAndDrop || !canManageDeals) return;
    const deal = deals.find((d) => d.id === dealId);
    if (deal && deal.stageId !== targetStageId) {
      onMoveDealStage(deal, targetStageId);
    }
  };

  return (
    <div className="ld-board-scroll" role="region" aria-label="Sales pipeline Kanban board">
      <div className="ld-board-columns">
        {stages.map((stage) => {
          const { stageDeals, totalValue, weightedValue } = summarizeStageDeals(stage, deals);
          const isDropTarget = dragOverStageId === stage.id;
          const tone = probabilityTone(stage.winProbability);

          return (
            <section
              key={stage.id}
              className={`ld-board-col tone-${tone} ${isDropTarget ? 'is-drop-target' : ''}`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={() => setDragOverStageId(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
              aria-label={`Stage ${stage.order}: ${stage.name}`}
            >
              <header
                className="ld-board-col-header"
                style={{
                  borderTop: stage.color ? `3px solid ${stage.color}` : undefined,
                }}
              >
                <div className="ld-board-col-title">
                  <span
                    className="ld-timeline-dot"
                    style={{ backgroundColor: stage.color || '#3b82f6' }}
                  />
                  <strong>
                    {stage.order}. {stage.name}
                  </strong>
                  <Badge tone={tone}>{stage.winProbability}%</Badge>
                </div>
                <div className="ld-board-col-stats">
                  <span>
                    {stageDeals.length} deal{stageDeals.length === 1 ? '' : 's'}
                  </span>
                  <span>·</span>
                  <strong>{formatCurrency(totalValue)}</strong>
                  {showWeightedValue && (
                    <>
                      <span>·</span>
                      <span className="lg-muted" title="Weighted stage value">
                        W: {formatCurrency(weightedValue)}
                      </span>
                    </>
                  )}
                </div>
              </header>

              <div className="ld-board-col-body">
                {stageDeals.length === 0 ? (
                  <div className="ld-board-empty">
                    <span>No deals in {stage.name}</span>
                    {canManageDeals && (
                      <button
                        type="button"
                        className="lg-link-btn"
                        onClick={() => onOpenCreateDeal(stage.id)}
                      >
                        + Add Deal Here
                      </button>
                    )}
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <PipelineDealCard
                      key={deal.id}
                      deal={deal}
                      stages={stages}
                      compact
                      showWeightedValue={showWeightedValue}
                      draggable={enableDragAndDrop}
                      canManageDeals={canManageDeals}
                      onDragStart={handleDragStart}
                      onMoveStage={onMoveDealStage}
                      onStatusChange={onStatusChange}
                      onEditDeal={onEditDeal}
                      onDeleteDeal={onDeleteDeal}
                    />
                  ))
                )}
              </div>

              {canManageDeals && (
                <footer className="ld-card-footer">
                  <button
                    type="button"
                    className="lg-link-btn"
                    onClick={() => onOpenCreateDeal(stage.id)}
                  >
                    <PlusIcon size={13} /> Add Deal to {stage.name}
                  </button>
                </footer>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   3. PIPELINE LIST VIEW (GROUPED BY STAGE)
   ============================================================================ */

export const PipelineListView: React.FC<SharedPipelineViewProps> = ({
  pipeline,
  deals,
  isLoading = false,
  showWeightedValue = true,
  showStageProbabilityBar = true,
  canManageDeals = true,
  onMoveDealStage,
  onStatusChange,
  onOpenCreateDeal,
  onEditDeal,
  onDeleteDeal,
}) => {
  const stages = pipeline.stages || [];

  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="large" message="Loading pipeline list..." />
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="lg-card lg-state-box">
        <EmptyState
          title="No stages in this pipeline"
          description="Add stages to view deals grouped by stage."
        />
      </div>
    );
  }

  return (
    <div className="ld-items-stack">
      {stages.map((stage) => {
        const { stageDeals, totalValue, weightedValue } = summarizeStageDeals(stage, deals);

        return (
          <SectionCard
            key={stage.id}
            title={`Stage ${stage.order}: ${stage.name} (${stageDeals.length} Deals)`}
            subtitle={`Total Value: ${formatCurrency(totalValue)}${
              showWeightedValue ? ` · Weighted Forecast: ${formatCurrency(weightedValue)}` : ''
            }`}
            actions={
              <div className="lg-badge-row">
                <StageProbabilityBadge
                  probability={stage.winProbability}
                  showBar={showStageProbabilityBar}
                  color={stage.color}
                />
                {canManageDeals && (
                  <button
                    type="button"
                    className="auth-btn btn-secondary btn-size-small"
                    onClick={() => onOpenCreateDeal(stage.id)}
                  >
                    <PlusIcon size={14} />
                    <span>Add Deal</span>
                  </button>
                )}
              </div>
            }
          >
            {stageDeals.length === 0 ? (
              <p className="lg-muted">No deals currently in {stage.name}.</p>
            ) : (
              <div className="ld-cards-stack">
                {stageDeals.map((deal) => (
                  <PipelineDealCard
                    key={deal.id}
                    deal={deal}
                    stages={stages}
                    showWeightedValue={showWeightedValue}
                    canManageDeals={canManageDeals}
                    onMoveStage={onMoveDealStage}
                    onStatusChange={onStatusChange}
                    onEditDeal={onEditDeal}
                    onDeleteDeal={onDeleteDeal}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        );
      })}
    </div>
  );
};

/* ============================================================================
   4. PIPELINE TABLE VIEW (REUSING DATATABLE)
   ============================================================================ */

export const PipelineTableView: React.FC<SharedPipelineViewProps> = ({
  pipeline,
  deals,
  isLoading = false,
  showWeightedValue = true,
  showStageProbabilityBar = true,
  canManageDeals = true,
  onMoveDealStage,
  onStatusChange,
  onOpenCreateDeal,
  onEditDeal,
  onDeleteDeal,
}) => {
  const stages = pipeline.stages || [];

  const columns: Column<PipelineDeal>[] = [
    {
      key: 'deal',
      header: 'Deal & Account',
      render: (deal) => (
        <div className="lg-cell-stack">
          <strong>{deal.title}</strong>
          <span className="lg-cell-sub">
            {deal.organization?.name && (
              <>
                <BuildingIcon size={12} /> {deal.organization.name}{' '}
              </>
            )}
            {deal.contact && (
              <>
                · <UserIcon size={12} /> {deal.contact.firstName} {deal.contact.lastName}
              </>
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Pipeline Stage',
      render: (deal) =>
        canManageDeals && stages.length > 0 ? (
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
        ),
    },
    {
      key: 'probability',
      header: 'Stage Probability',
      render: (deal) => {
        const st = stages.find((s) => s.id === deal.stageId) || deal.stage;
        const prob = deal.probability ?? st?.winProbability ?? 0;
        return (
          <StageProbabilityBadge
            probability={prob}
            showBar={showStageProbabilityBar}
            color={st?.color}
          />
        );
      },
    },
    {
      key: 'value',
      header: 'Deal Value',
      align: 'right',
      render: (deal) => <strong>{formatCurrency(deal.value)}</strong>,
    },
    ...(showWeightedValue
      ? [
          {
            key: 'weighted',
            header: 'Weighted Value',
            align: 'right' as const,
            render: (deal: PipelineDeal) => {
              const st = stages.find((s) => s.id === deal.stageId) || deal.stage;
              return (
                <span className="lg-muted">
                  {formatCurrency(computeWeightedDealValue(deal, st?.winProbability))}
                </span>
              );
            },
          },
        ]
      : []),
    {
      key: 'status',
      header: 'Status',
      render: (deal) => <Badge tone={dealStatusTone(deal.status)}>{deal.status}</Badge>,
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (deal) => (
        <span className="lg-muted">{deal.owner?.name || 'Unassigned'}</span>
      ),
    },
    {
      key: 'closeDate',
      header: 'Expected Close',
      render: (deal) => (
        <span className="lg-muted">
          {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (deal) => (
        <div className="lg-row-actions">
          {canManageDeals && deal.status !== 'WON' && (
            <button
              type="button"
              className="lg-icon-btn ld-convert-icon-btn"
              title="Mark as WON"
              onClick={() => onStatusChange(deal, 'WON')}
            >
              <CheckCircleIcon size={15} />
            </button>
          )}
          {canManageDeals && (
            <button
              type="button"
              className="lg-icon-btn"
              title="Edit Deal"
              onClick={() => onEditDeal(deal)}
            >
              <EditIcon size={15} />
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
      loadingMessage="Loading pipeline deals..."
      emptyTitle="No deals in this pipeline"
      emptyDescription="Add your first deal or clear active search/stage filters."
      emptyAction={
        canManageDeals ? (
          <button
            type="button"
            className="auth-btn btn-primary"
            onClick={() => onOpenCreateDeal()}
          >
            <PlusIcon size={15} />
            <span>Add First Deal</span>
          </button>
        ) : undefined
      }
    />
  );
};
