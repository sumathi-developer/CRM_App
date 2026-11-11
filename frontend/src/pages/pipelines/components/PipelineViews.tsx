import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  MoreVerticalIcon,
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

      <div
        className="ld-qual-pipeline"
        role="group"
        aria-label="Pipeline stages"
        style={
          stages.length > 0 && stages.length <= 7
            ? { gridTemplateColumns: `repeat(${stages.length}, minmax(130px, 1fr))` }
            : undefined
        }
      >
        {stages.map((stage) => {
          const { stageDeals, totalValue, weightedValue } = summarizeStageDeals(stage, deals);
          const isSelected = selectedStageId === stage.id;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() =>
                onSelectStageFilter?.(isSelected ? '' : stage.id)
              }
              className={`ld-qual-step ${isSelected ? 'is-current' : ''}`}
            >
              <span className="ld-qual-step-index">{stage.order}</span>
              <div className="ld-qual-step-text">
                <div className="ld-qual-step-name">
                  <strong>{stage.name}</strong>
                  <span className="ld-qual-prob-badge">({stage.winProbability}%)</span>
                </div>
                <div className="ld-qual-step-meta">
                  <span className="ld-qual-deals-count">
                    {stageDeals.length} {stageDeals.length === 1 ? 'deal' : 'deals'}
                  </span>
                  <span className="ld-qual-sep">·</span>
                  <span className="ld-qual-val">{formatCurrency(totalValue)}</span>
                  <span className="ld-qual-wval">(W: {formatCurrency(weightedValue)})</span>
                </div>
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
              className={`ld-board-col ${isDropTarget ? 'is-drop-target' : ''}`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={() => setDragOverStageId(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
              aria-label={`Stage ${stage.order}: ${stage.name}`}
            >
              <header className="ld-board-col-header">
                {/* Row 1: Stage Title & Win Probability Badge */}
                <div className="ld-board-col-title-row">
                  <div className="ld-board-col-title">
                    <span className="ld-board-order-dot">{stage.order}</span>
                    <strong title={stage.name}>{stage.name}</strong>
                  </div>
                  <Badge tone={tone}>{stage.winProbability}%</Badge>
                </div>

                {/* Row 2: Deals count and Value Summary */}
                <div className="ld-board-col-stats-row">
                  <span className="ld-board-count-pill">
                    {stageDeals.length} {stageDeals.length === 1 ? 'deal' : 'deals'}
                  </span>
                  <div className="ld-board-val-wrap">
                    <strong className="ld-board-val-total">{formatCurrency(totalValue)}</strong>
                    {showWeightedValue && (
                      <span className="ld-board-val-weighted" title="Weighted stage value">
                        · W: {formatCurrency(weightedValue)}
                      </span>
                    )}
                  </div>
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
                <footer className="ld-board-col-footer">
                  <button
                    type="button"
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
              <p className="lg-muted" style={{ padding: '0.75rem 0', margin: 0 }}>
                No deals currently in {stage.name}.
              </p>
            ) : (
              <div className="ld-cards-stack">
                <div className="ld-deal-list-table-header" aria-hidden="true">
                  <span>Deal & Account</span>
                  <span>Financials & Win Prob</span>
                  <span>Timeline & Owner</span>
                  <span style={{ textAlign: 'right' }}>Move Stage & Actions</span>
                </div>
                {stageDeals.map((deal) => (
                  <PipelineDealCard
                    key={deal.id}
                    deal={deal}
                    stages={stages}
                    layout="row"
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
   4. PIPELINE TABLE VIEW WITH DYNAMIC COLUMN VISIBILITY ("THREE DOTS")
   ============================================================================ */

const STORAGE_KEY_PIPELINE_TABLE_COLUMNS = 'crm_pipeline_table_visible_columns_v2';
const DEFAULT_PIPELINE_TABLE_COLUMNS = ['deal', 'stage', 'value', 'status', 'actions'];

const ALL_AVAILABLE_TABLE_COLUMNS: { id: string; label: string; isMandatory?: boolean }[] = [
  { id: 'deal', label: 'Deal & Account', isMandatory: true },
  { id: 'stage', label: 'Pipeline Stage' },
  { id: 'value', label: 'Deal Value' },
  { id: 'status', label: 'Status' },
  { id: 'probability', label: 'Stage Probability' },
  { id: 'weighted', label: 'Weighted Value' },
  { id: 'owner', label: 'Owner' },
  { id: 'closeDate', label: 'Expected Close' },
  { id: 'actions', label: 'Actions', isMandatory: true },
];

const ColumnPickerHeader: React.FC<{
  visibleColumns: string[];
  onToggleColumn: (colId: string) => void;
  onResetColumns: () => void;
}> = ({ visibleColumns, onToggleColumn, onResetColumns }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ bottom: number; right: number }>({ bottom: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const bottomDistance = Math.max(16, window.innerHeight - rect.top + 8);
      setCoords({
        bottom: bottomDistance,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div className="ld-col-picker-container">
      <button
        ref={triggerRef}
        type="button"
        className={`ld-col-picker-trigger-btn ${isOpen ? 'is-active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        title="Customize columns"
        aria-label="Customize columns"
      >
        <MoreVerticalIcon size={18} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="ld-col-picker-dropdown is-above"
            style={{
              position: 'fixed',
              bottom: `${coords.bottom}px`,
              right: `${coords.right}px`,
            }}
          >
            <div className="ld-col-picker-head">
              <span className="ld-col-picker-title">Add / Remove Columns</span>
              <span className="ld-col-picker-hint">Check columns to show or uncheck to hide</span>
            </div>

            <div className="ld-col-picker-list">
              {ALL_AVAILABLE_TABLE_COLUMNS.map((col) => {
                const isChecked = visibleColumns.includes(col.id);
                return (
                  <label
                    key={col.id}
                    className={`ld-col-picker-row ${col.isMandatory ? 'is-disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={col.isMandatory}
                      onChange={() => onToggleColumn(col.id)}
                      className="ld-col-picker-checkbox"
                    />
                    <span className="ld-col-picker-item-label">{col.label}</span>
                    {col.isMandatory && (
                      <span className="ld-col-picker-required-tag">Required</span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="ld-col-picker-actions">
              <button
                type="button"
                className="ld-col-picker-reset-btn"
                onClick={onResetColumns}
              >
                Reset to default
              </button>
              <button
                type="button"
                className="auth-btn btn-primary btn-size-small ld-col-picker-close-btn"
                onClick={() => setIsOpen(false)}
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

const DealRowActionsMenu: React.FC<{
  deal: PipelineDeal;
  canManageDeals: boolean;
  onStatusChange?: (deal: PipelineDeal, nextStatus: DealStatus) => void;
  onEditDeal?: (deal: PipelineDeal) => void;
  onDeleteDeal?: (deal: PipelineDeal) => void;
}> = ({ deal, canManageDeals, onStatusChange, onEditDeal, onDeleteDeal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  if (!canManageDeals) return null;

  return (
    <div className="ld-row-action-menu-wrap">
      <button
        ref={triggerRef}
        type="button"
        className={`lg-icon-btn ld-row-action-btn ${isOpen ? 'is-active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        title="Deal actions"
        aria-label={`Actions for ${deal.title}`}
      >
        <MoreVerticalIcon size={18} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="ld-row-action-dropdown"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              right: `${coords.right}px`,
            }}
          >
            {deal.status !== 'WON' && onStatusChange && (
              <button
                type="button"
                className="ld-row-action-item"
                onClick={() => {
                  setIsOpen(false);
                  onStatusChange(deal, 'WON');
                }}
              >
                <CheckCircleIcon size={14} className="tone-green" />
                <span>Mark as WON</span>
              </button>
            )}
            {onEditDeal && (
              <button
                type="button"
                className="ld-row-action-item"
                onClick={() => {
                  setIsOpen(false);
                  onEditDeal(deal);
                }}
              >
                <EditIcon size={14} />
                <span>Edit Deal</span>
              </button>
            )}
            {onDeleteDeal && (
              <button
                type="button"
                className="ld-row-action-item danger"
                onClick={() => {
                  setIsOpen(false);
                  onDeleteDeal(deal);
                }}
              >
                <TrashIcon size={14} />
                <span>Delete Deal</span>
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

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

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PIPELINE_TABLE_COLUMNS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_PIPELINE_TABLE_COLUMNS;
  });

  const handleToggleColumn = (colId: string) => {
    if (colId === 'deal' || colId === 'actions') return;
    setVisibleColumns((prev) => {
      const next = prev.includes(colId)
        ? prev.filter((id) => id !== colId)
        : [...prev, colId];
      try {
        localStorage.setItem(STORAGE_KEY_PIPELINE_TABLE_COLUMNS, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_PIPELINE_TABLE_COLUMNS);
    try {
      localStorage.setItem(
        STORAGE_KEY_PIPELINE_TABLE_COLUMNS,
        JSON.stringify(DEFAULT_PIPELINE_TABLE_COLUMNS)
      );
    } catch {}
  };

  const allColumnsMap: Record<string, Column<PipelineDeal>> = {
    deal: {
      key: 'deal',
      header: 'Deal & Account',
      className: 'ld-col-deal',
      render: (deal) => {
        const contactName = deal.contact
          ? `${deal.contact.firstName || ''} ${deal.contact.lastName || ''}`.trim()
          : '';
        return (
          <div className="ld-table-deal-cell">
            <Link to={`/deals/${deal.id}`} className="ld-table-deal-title">
              {deal.title}
            </Link>
            <div className="ld-table-deal-sub">
              {deal.organization?.name && (
                <span className="ld-table-org">
                  <BuildingIcon size={12} />
                  <span>{deal.organization.name}</span>
                </span>
              )}
              {contactName && (
                <>
                  {deal.organization?.name && <span className="ld-dot">·</span>}
                  <span className="ld-table-contact">
                    <UserIcon size={12} />
                    <span>{contactName}</span>
                  </span>
                </>
              )}
              {!deal.organization?.name && !contactName && (
                <span className="lg-muted">No account linked</span>
              )}
            </div>
          </div>
        );
      },
    },
    stage: {
      key: 'stage',
      header: 'Pipeline Stage',
      className: 'ld-col-stage',
      render: (deal) =>
        canManageDeals && stages.length > 0 ? (
          <select
            className="lg-select ld-table-stage-select"
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
    value: {
      key: 'value',
      header: 'Deal Value',
      className: 'ld-col-val',
      align: 'left',
      render: (deal) => (
        <strong className="ld-table-deal-value">{formatCurrency(deal.value)}</strong>
      ),
    },
    status: {
      key: 'status',
      header: 'Status',
      className: 'ld-col-status',
      render: (deal) => <Badge tone={dealStatusTone(deal.status)}>{deal.status}</Badge>,
    },
    probability: {
      key: 'probability',
      header: 'Stage Probability',
      className: 'ld-col-prob',
      render: (deal) => {
        const st = stages.find((s) => s.id === deal.stageId) || deal.stage;
        const prob = deal.probability ?? st?.winProbability ?? 0;
        const tone = probabilityTone(prob);
        return (
          <div className="ld-table-prob-cell" title={`Win Probability: ${prob}%`}>
            <Badge tone={tone}>{prob}% WIN PROB</Badge>
            {showStageProbabilityBar && (
              <div className="ld-score-bar-track ld-table-prob-bar" aria-hidden="true">
                <div
                  className={`ld-score-bar-fill tone-${tone}`}
                  style={{
                    width: `${prob}%`,
                    backgroundColor: st?.color || undefined,
                  }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    weighted: {
      key: 'weighted',
      header: 'Weighted Value',
      className: 'ld-col-wval',
      align: 'left',
      render: (deal: PipelineDeal) => {
        const st = stages.find((s) => s.id === deal.stageId) || deal.stage;
        return (
          <span className="ld-table-weighted-value">
            {formatCurrency(computeWeightedDealValue(deal, st?.winProbability))}
          </span>
        );
      },
    },
    owner: {
      key: 'owner',
      header: 'Owner',
      className: 'ld-col-owner',
      render: (deal) => (
        <span className="ld-table-owner-name">{deal.owner?.name || 'Unassigned'}</span>
      ),
    },
    closeDate: {
      key: 'closeDate',
      header: 'Expected Close',
      className: 'ld-col-close',
      render: (deal) => (
        <span className="ld-table-close-date">
          {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : '—'}
        </span>
      ),
    },
    actions: {
      key: 'actions',
      header: (
        <ColumnPickerHeader
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
          onResetColumns={handleResetColumns}
        />
      ),
      className: 'ld-col-actions',
      align: 'right',
      render: (deal) => (
        <DealRowActionsMenu
          deal={deal}
          canManageDeals={canManageDeals}
          onStatusChange={onStatusChange}
          onEditDeal={onEditDeal}
          onDeleteDeal={onDeleteDeal}
        />
      ),
    },
  };

  const columns: Column<PipelineDeal>[] = [
    allColumnsMap.deal,
    ...(visibleColumns.includes('stage') ? [allColumnsMap.stage] : []),
    ...(visibleColumns.includes('value') ? [allColumnsMap.value] : []),
    ...(visibleColumns.includes('status') ? [allColumnsMap.status] : []),
    ...(visibleColumns.includes('probability') ? [allColumnsMap.probability] : []),
    ...(visibleColumns.includes('weighted') && showWeightedValue ? [allColumnsMap.weighted] : []),
    ...(visibleColumns.includes('owner') ? [allColumnsMap.owner] : []),
    ...(visibleColumns.includes('closeDate') ? [allColumnsMap.closeDate] : []),
    allColumnsMap.actions,
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
