import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  CreatePipelineDealPayload,
  DealStatus,
  Pipeline,
  PipelineDeal,
  PipelineStage,
  PipelineViewMode,
  UpdatePipelineDealPayload,
} from '../../../types/pipeline.types';
import type { Contact, ContactOrganization } from '../../../types/contact.types';
import type { UserOption } from '../../lead-generation/leadGenHooks';
import { Badge } from '../../lead-generation/components/Cards';
import { Field, FormModal } from '../../lead-generation/components/FormParts';
import { formatCurrency, formatDate } from '../../lead-generation/leadGenConstants';
import {
  DEAL_STATUS_OPTIONS,
  computeWeightedDealValue,
  dealStatusTone,
  probabilityTone,
} from '../pipelineConstants';
import {
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  EditIcon,
  PlusIcon,
  SlidersIcon,
  TrashIcon,
  UserIcon,
} from '../../../components/common/Icons';

/* ============================================================================
   1. STAGE PROBABILITY BADGE & BAR
   ============================================================================ */

interface StageProbabilityBadgeProps {
  probability: number;
  showBar?: boolean;
  color?: string | null;
}

export const StageProbabilityBadge: React.FC<StageProbabilityBadgeProps> = ({
  probability,
  showBar = true,
  color,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(probability || 0))));
  const tone = probabilityTone(clamped);

  return (
    <div className="ld-score-widget is-compact" title={`Win probability: ${clamped}%`}>
      <div className="ld-score-top">
        <Badge tone={tone}>{clamped}% Win Prob</Badge>
      </div>
      {showBar && (
        <div className="ld-score-bar-track" aria-hidden="true">
          <div
            className={`ld-score-bar-fill tone-${tone}`}
            style={{
              width: `${clamped}%`,
              backgroundColor: color || undefined,
            }}
          />
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   2. PIPELINE SELECTOR BAR
   ============================================================================ */

interface PipelineSelectorBarProps {
  pipelines: Pipeline[];
  activePipeline: Pipeline | null;
  onSelectPipeline: (pipelineId: string) => void;
  viewMode?: PipelineViewMode;
  onChangeViewMode?: (mode: PipelineViewMode) => void;
  canManagePipelines?: boolean;
  canManageDeals?: boolean;
  onOpenCreateDeal?: () => void;
}

export const PipelineSelectorBar: React.FC<PipelineSelectorBarProps> = ({
  pipelines,
  activePipeline,
  onSelectPipeline,
  viewMode,
  onChangeViewMode,
  canManagePipelines = true,
  canManageDeals = true,
  onOpenCreateDeal,
}) => {
  return (
    <div className="lg-card ld-view-switcher-bar">
      <div className="ld-context-main">
        <label htmlFor="pipeline-selector-dropdown" className="lg-label">
          Active Pipeline:
        </label>
        <select
          id="pipeline-selector-dropdown"
          className="lg-select ld-lead-picker-select"
          value={activePipeline?.id || ''}
          onChange={(e) => onSelectPipeline(e.target.value)}
        >
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.stages?.length ?? 0} stages)
              {p.isDefault ? ' ★ Default' : ''}
            </option>
          ))}
        </select>

        {activePipeline?.isDefault && <Badge tone="green">Default</Badge>}

        <Link to="/pipelines/selector" className="lg-link-btn">
          Compare All ({pipelines.length})
        </Link>
      </div>

      <div className="ld-view-right-controls">
        {canManageDeals && onOpenCreateDeal && (
          <button
            type="button"
            className="auth-btn btn-primary btn-size-small"
            onClick={onOpenCreateDeal}
            id="btn-pipeline-add-deal"
          >
            <PlusIcon size={14} />
            <span>Add Deal</span>
          </button>
        )}

        {canManagePipelines && activePipeline && (
          <Link
            to={`/pipelines/${activePipeline.id}/stage-management`}
            className="auth-btn btn-secondary btn-size-small"
          >
            <SlidersIcon size={14} />
            <span>Manage Stages</span>
          </Link>
        )}

        {viewMode && onChangeViewMode && (
          <div className="ld-view-mode-group" role="group" aria-label="Switch pipeline view">
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'overview' ? 'is-active' : ''}`}
              onClick={() => onChangeViewMode('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'board' ? 'is-active' : ''}`}
              onClick={() => onChangeViewMode('board')}
            >
              Board
            </button>
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => onChangeViewMode('list')}
            >
              List
            </button>
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'table' ? 'is-active' : ''}`}
              onClick={() => onChangeViewMode('table')}
            >
              Table
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   3. REUSABLE PIPELINE DEAL CARD
   ============================================================================ */

interface PipelineDealCardProps {
  deal: PipelineDeal;
  stages: PipelineStage[];
  compact?: boolean;
  showWeightedValue?: boolean;
  draggable?: boolean;
  canManageDeals?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, deal: PipelineDeal) => void;
  onMoveStage?: (deal: PipelineDeal, nextStageId: string) => void;
  onStatusChange?: (deal: PipelineDeal, nextStatus: DealStatus) => void;
  onEditDeal?: (deal: PipelineDeal) => void;
  onDeleteDeal?: (deal: PipelineDeal) => void;
}

export const PipelineDealCard: React.FC<PipelineDealCardProps> = ({
  deal,
  stages,
  compact = false,
  showWeightedValue = true,
  draggable = false,
  canManageDeals = true,
  onDragStart,
  onMoveStage,
  onStatusChange,
  onEditDeal,
  onDeleteDeal,
}) => {
  const stageObj = stages.find((s) => s.id === deal.stageId) || deal.stage;
  const prob = deal.probability ?? stageObj?.winProbability ?? 0;
  const weighted = computeWeightedDealValue(deal, stageObj?.winProbability);
  const contactName = deal.contact
    ? `${deal.contact.firstName || ''} ${deal.contact.lastName || ''}`.trim()
    : '';

  return (
    <div
      className={`ld-card ${compact ? 'is-compact' : ''}`}
      draggable={draggable && canManageDeals}
      onDragStart={(e) => onDragStart?.(e, deal)}
    >
      <div className="ld-card-top">
        <div className="ld-card-titles">
          <strong className="ld-card-title-link">{deal.title}</strong>
          <div className="ld-card-subtitle">
            {deal.organization?.name && (
              <span className="ld-company-inline">
                <BuildingIcon size={12} />
                {deal.organization.name}
              </span>
            )}
            {contactName && (
              <>
                {deal.organization?.name && <span className="ld-dot">·</span>}
                <span>
                  <UserIcon size={12} /> {contactName}
                </span>
              </>
            )}
          </div>
        </div>

        <Badge tone={dealStatusTone(deal.status)}>{deal.status}</Badge>
      </div>

      <div className="ld-card-grid">
        <div className="ld-card-meta-item">
          <strong>{formatCurrency(deal.value)}</strong>
          {showWeightedValue && (
            <span className="lg-muted"> · Weighted: {formatCurrency(weighted)}</span>
          )}
        </div>
        <div className="ld-card-meta-item">
          <Badge tone={probabilityTone(prob)}>{prob}% Win Prob</Badge>
        </div>
        {deal.expectedCloseDate && (
          <div className="ld-card-meta-item">
            <CalendarIcon size={12} />
            <span>Close: {formatDate(deal.expectedCloseDate)}</span>
          </div>
        )}
        {deal.owner && (
          <div className="ld-card-meta-item">
            <UserIcon size={12} />
            <span>{deal.owner.name}</span>
          </div>
        )}
      </div>

      <div className="ld-card-footer">
        {canManageDeals && onMoveStage && stages.length > 0 ? (
          <select
            className="lg-select ld-compact-select"
            value={deal.stageId || ''}
            onChange={(e) => onMoveStage(deal, e.target.value)}
            aria-label={`Move ${deal.title} to stage`}
          >
            {stages.map((st) => (
              <option key={st.id} value={st.id}>
                Stage {st.order}: {st.name} ({st.winProbability}%)
              </option>
            ))}
          </select>
        ) : (
          <span className="lg-muted">{stageObj?.name || 'Unstaged'}</span>
        )}

        <div className="ld-card-actions">
          {canManageDeals && onStatusChange && deal.status !== 'WON' && (
            <button
              type="button"
              className="lg-icon-btn ld-convert-icon-btn"
              title="Mark Deal as WON"
              onClick={() => onStatusChange(deal, 'WON')}
            >
              <CheckCircleIcon size={14} />
            </button>
          )}
          {canManageDeals && onEditDeal && (
            <button
              type="button"
              className="lg-icon-btn"
              title="Edit Deal"
              onClick={() => onEditDeal(deal)}
            >
              <EditIcon size={14} />
            </button>
          )}
          {canManageDeals && onDeleteDeal && (
            <button
              type="button"
              className="lg-icon-btn danger"
              title="Delete Deal"
              onClick={() => onDeleteDeal(deal)}
            >
              <TrashIcon size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   4. QUICK CREATE / EDIT DEAL MODAL
   ============================================================================ */

interface QuickDealModalProps {
  isOpen: boolean;
  pipeline: Pipeline | null;
  initialStageId?: string;
  editingDeal?: PipelineDeal | null;
  organizations?: ContactOrganization[];
  contacts?: Contact[];
  users?: UserOption[];
  onClose: () => void;
  onSave: (
    payload: CreatePipelineDealPayload | UpdatePipelineDealPayload,
    dealId?: string,
  ) => Promise<void>;
}

export const QuickDealModal: React.FC<QuickDealModalProps> = ({
  isOpen,
  pipeline,
  initialStageId,
  editingDeal,
  organizations = [],
  contacts = [],
  users = [],
  onClose,
  onSave,
}) => {
  const stages = pipeline?.stages || [];
  const [title, setTitle] = useState('');
  const [value, setValue] = useState<string>('25000');
  const [stageId, setStageId] = useState('');
  const [probability, setProbability] = useState<string>('20');
  const [status, setStatus] = useState<DealStatus>('OPEN');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [contactId, setContactId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingDeal) {
      setTitle(editingDeal.title || '');
      setValue(String(editingDeal.value ?? 0));
      setStageId(editingDeal.stageId || stages[0]?.id || '');
      setProbability(String(editingDeal.probability ?? 20));
      setStatus(((editingDeal.status || 'OPEN').toUpperCase() as DealStatus) || 'OPEN');
      setExpectedCloseDate(
        editingDeal.expectedCloseDate ? editingDeal.expectedCloseDate.slice(0, 10) : '',
      );
      setOrganizationId(editingDeal.organizationId || '');
      setContactId(editingDeal.contactId || '');
      setOwnerId(editingDeal.ownerId || '');
    } else {
      const targetStage =
        stages.find((s) => s.id === initialStageId) || stages[0] || null;
      setTitle('');
      setValue('25000');
      setStageId(targetStage?.id || '');
      setProbability(String(targetStage?.winProbability ?? 20));
      setStatus('OPEN');
      setExpectedCloseDate('');
      setOrganizationId('');
      setContactId('');
      setOwnerId('');
    }
  }, [isOpen, editingDeal, initialStageId, stages]);

  const handleStageSelect = (nextStageId: string) => {
    setStageId(nextStageId);
    const st = stages.find((s) => s.id === nextStageId);
    if (st) {
      setProbability(String(st.winProbability));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Deal title is required.');
      return;
    }
    const numericVal = Number(value);
    if (Number.isNaN(numericVal) || numericVal < 0) {
      setError('Deal value must be 0 or greater.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload: UpdatePipelineDealPayload = {
        title: title.trim(),
        value: numericVal,
        pipelineId: pipeline?.id,
        stageId: stageId || undefined,
        probability: Math.max(0, Math.min(100, Math.round(Number(probability) || 0))),
        expectedCloseDate: expectedCloseDate
          ? new Date(expectedCloseDate).toISOString()
          : undefined,
        organizationId: organizationId || undefined,
        contactId: contactId || undefined,
        ownerId: ownerId || undefined,
        ...(editingDeal ? { status } : {}),
      };
      await onSave(payload, editingDeal?.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save deal.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      title={editingDeal ? `Edit Deal — ${editingDeal.title}` : 'Add Deal to Pipeline'}
      subtitle={
        pipeline
          ? `Pipeline: ${pipeline.name}`
          : 'Create or update a sales deal and assign it to a pipeline stage.'
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={editingDeal ? 'Save Deal Changes' : 'Create Deal'}
      isSaving={isSaving}
      error={error}
    >
      <div className="lg-form-grid">
        <Field label="Deal Title" htmlFor="pipe-deal-title" required className="lg-span-2">
          <input
            id="pipe-deal-title"
            className="lg-input"
            placeholder="e.g. Enterprise Cloud Expansion"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Deal Value (USD)" htmlFor="pipe-deal-value" required>
          <input
            id="pipe-deal-value"
            type="number"
            min={0}
            step="500"
            className="lg-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>

        <Field label="Win Probability (%)" htmlFor="pipe-deal-prob">
          <input
            id="pipe-deal-prob"
            type="number"
            min={0}
            max={100}
            className="lg-input"
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
          />
        </Field>

        <Field
          label="Pipeline Stage"
          htmlFor="pipe-deal-stage"
          className={editingDeal ? '' : 'lg-span-2'}
        >
          <select
            id="pipe-deal-stage"
            className="lg-select"
            value={stageId}
            onChange={(e) => handleStageSelect(e.target.value)}
          >
            {stages.map((st) => (
              <option key={st.id} value={st.id}>
                Stage {st.order}: {st.name} ({st.winProbability}% win probability)
              </option>
            ))}
          </select>
        </Field>

        {editingDeal && (
          <Field label="Deal Status" htmlFor="pipe-deal-status">
            <select
              id="pipe-deal-status"
              className="lg-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as DealStatus)}
            >
              {DEAL_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Expected Close Date" htmlFor="pipe-deal-close">
          <input
            id="pipe-deal-close"
            type="date"
            className="lg-input"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />
        </Field>

        <Field label="Assigned Owner" htmlFor="pipe-deal-owner">
          <select
            id="pipe-deal-owner"
            className="lg-select"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>

        {organizations.length > 0 && (
          <Field label="Organization" htmlFor="pipe-deal-org">
            <select
              id="pipe-deal-org"
              className="lg-select"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
            >
              <option value="">None</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {contacts.length > 0 && (
          <Field label="Primary Contact" htmlFor="pipe-deal-contact">
            <select
              id="pipe-deal-contact"
              className="lg-select"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </FormModal>
  );
};

