import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  Lead,
  LeadStatus,
  PipelineOption,
} from '../../../types/lead.types';
import type { UserOption } from '../../lead-generation/leadGenHooks';
import { leadService } from '../../../services/lead.service';
import { leadGenerationService } from '../../../services/lead-generation.service';
import { Field, FormModal, Toggle } from '../../lead-generation/components/FormParts';
import { Badge } from '../../lead-generation/components/Cards';
import { PrimaryButton } from '../../../components/auth/PrimaryButton';
import { formatCurrency, formatDateTime, humanize } from '../../lead-generation/leadGenConstants';
import {
  LEAD_STATUSES,
  leadFullName,
  statusTone,
} from '../leadConstants';
import { LeadScoreDisplay, QualificationPipeline } from './LeadCard';
import {
  XIcon,
  UserIcon,
  AwardIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  AlertCircleIcon,
  SparklesIcon,
} from '../../../components/common/Icons';

/* ============================================================================
   1. LEAD QUICK PREVIEW DRAWER
   ============================================================================ */

interface LeadQuickDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onAssign: (lead: Lead) => void;
  onQualify: (lead: Lead) => void;
  onScore: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onQuickStatusChange: (lead: Lead, status: LeadStatus) => void;
}

export const LeadQuickDrawer: React.FC<LeadQuickDrawerProps> = ({
  lead,
  onClose,
  onAssign,
  onQualify,
  onScore,
  onConvert,
  onQuickStatusChange,
}) => {
  if (!lead) return null;

  return (
    <div className="ld-drawer-backdrop" role="dialog" aria-modal="true" aria-label="Lead preview drawer">
      <div className="ld-drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="ld-drawer-panel">
        <div className="ld-drawer-header">
          <div>
            <div className="lg-badge-row">
              <Badge tone={statusTone(lead.status)}>{humanize(lead.status)}</Badge>
              <Badge tone="slate">{humanize(lead.source)}</Badge>
            </div>
            <h2 className="ld-drawer-title">{lead.title}</h2>
            <p className="lg-muted">{leadFullName(lead)}</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close preview drawer"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="ld-drawer-body">
          {/* Qualification Stage Stepper */}
          <div className="ld-drawer-section">
            <span className="ld-drawer-section-label">Qualification Stage</span>
            <QualificationPipeline
              currentStatus={lead.status}
              onSelectStatus={(s) => onQuickStatusChange(lead, s)}
            />
          </div>

          {/* Score & Value */}
          <div className="ld-drawer-grid-2">
            <div className="ld-drawer-box">
              <span className="ld-drawer-section-label">Lead Score</span>
              <LeadScoreDisplay score={lead.leadScore} />
            </div>
            <div className="ld-drawer-box">
              <span className="ld-drawer-section-label">Estimated Deal Value</span>
              <div className="ld-drawer-big-value">{formatCurrency(lead.estimatedValue)}</div>
              <span className="lg-muted">
                Owner: {lead.owner?.name || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="ld-drawer-section">
            <span className="ld-drawer-section-label">Contact & Organization</span>
            <div className="ld-drawer-kv-list">
              <div className="ld-drawer-kv">
                <MailIcon size={14} />
                <a href={`mailto:${lead.email}`} className="ld-meta-link">
                  {lead.email}
                </a>
              </div>
              <div className="ld-drawer-kv">
                <PhoneIcon size={14} />
                <span>{lead.phone || 'No phone provided'}</span>
              </div>
              <div className="ld-drawer-kv">
                <BuildingIcon size={14} />
                <span>{lead.companyName || 'No organization specified'}</span>
              </div>
              <div className="ld-drawer-kv">
                <UserIcon size={14} />
                <span>
                  Assigned to:{' '}
                  <strong>{lead.owner ? `${lead.owner.name} (${lead.owner.email})` : 'Unassigned'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="ld-drawer-section">
            <span className="ld-drawer-section-label">Lead Controls</span>
            <div className="ld-drawer-action-grid">
              <button
                type="button"
                className="auth-btn btn-secondary"
                onClick={() => onAssign(lead)}
              >
                <UserIcon size={15} />
                <span>Assign Owner</span>
              </button>
              <button
                type="button"
                className="auth-btn btn-secondary"
                onClick={() => onQualify(lead)}
              >
                <CheckCircleIcon size={15} />
                <span>Qualify Lead</span>
              </button>
              <button
                type="button"
                className="auth-btn btn-secondary"
                onClick={() => onScore(lead)}
              >
                <AwardIcon size={15} />
                <span>Update Score</span>
              </button>
              {lead.status !== 'CONVERTED' && (
                <button
                  type="button"
                  className="auth-btn btn-primary"
                  onClick={() => onConvert(lead)}
                >
                  <ArrowRightIcon size={15} />
                  <span>Convert Lead</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div className="ld-drawer-section">
            <span className="ld-drawer-section-label">Related Lead Sections</span>
            <div className="ld-drawer-shortcuts">
              <Link to={`/leads/${lead.id}`} className="ld-shortcut-chip" onClick={onClose}>
                Full Details
              </Link>
              <Link to={`/leads/${lead.id}/activities`} className="ld-shortcut-chip" onClick={onClose}>
                Activities ({lead._count?.activities ?? 0})
              </Link>
              <Link to={`/leads/${lead.id}/notes`} className="ld-shortcut-chip" onClick={onClose}>
                Notes ({lead._count?.notes ?? 0})
              </Link>
              <Link to={`/leads/${lead.id}/documents`} className="ld-shortcut-chip" onClick={onClose}>
                Documents
              </Link>
              <Link to={`/leads/${lead.id}/scoring`} className="ld-shortcut-chip" onClick={onClose}>
                Scoring Breakdown
              </Link>
              <Link to={`/leads/${lead.id}/qualification`} className="ld-shortcut-chip" onClick={onClose}>
                Qualification
              </Link>
            </div>
          </div>

          <div className="lg-muted">
            Created {formatDateTime(lead.createdAt)}
            {lead.updatedAt ? ` · Updated ${formatDateTime(lead.updatedAt)}` : ''}
          </div>
        </div>

        <div className="ld-drawer-footer">
          <Link
            to={`/leads/${lead.id}/edit`}
            className="auth-btn btn-ghost"
            onClick={onClose}
          >
            <EditIcon size={15} />
            <span>Edit Lead</span>
          </Link>
          <Link
            to={`/leads/${lead.id}`}
            className="auth-btn btn-primary"
            onClick={onClose}
          >
            <span>Open Lead Workspace</span>
            <ArrowRightIcon size={15} />
          </Link>
        </div>
      </aside>
    </div>
  );
};

/* ============================================================================
   2. ASSIGN LEAD MODAL (Single or Bulk)
   ============================================================================ */

interface AssignLeadModalProps {
  isOpen: boolean;
  leads: Lead[];
  users: UserOption[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const AssignLeadModal: React.FC<AssignLeadModalProps> = ({
  isOpen,
  leads,
  users,
  onClose,
  onSuccess,
}) => {
  const [ownerId, setOwnerId] = useState('');
  const [useAutoRoute, setUseAutoRoute] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOwnerId(leads.length === 1 ? leads[0]?.ownerId || '' : '');
      setUseAutoRoute(false);
      setError(null);
    }
  }, [isOpen, leads]);

  const handleSubmit = async () => {
    if (!useAutoRoute && !ownerId) {
      setError('Please select a sales owner or enable automatic rule-based routing.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (leads.length === 1) {
        const target = leads[0];
        if (useAutoRoute) {
          await leadGenerationService.routeLead(target.id, {});
          onSuccess(`Lead "${target.title}" routed automatically via active assignment rules.`);
        } else {
          await leadService.assignLead(target.id, ownerId);
          const ownerName = users.find((u) => u.id === ownerId)?.name || 'selected owner';
          onSuccess(`Lead "${target.title}" assigned to ${ownerName}.`);
        }
      } else {
        const leadIds = leads.map((l) => l.id);
        await leadGenerationService.bulkAssign({
          leadIds,
          ownerId: useAutoRoute ? undefined : ownerId,
        });
        onSuccess(`Successfully assigned ${leadIds.length} leads.`);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign lead(s).');
    } finally {
      setIsSaving(false);
    }
  };

  const title =
    leads.length === 1 ? `Assign Lead — ${leads[0]?.title}` : `Bulk Assign ${leads.length} Leads`;

  return (
    <FormModal
      isOpen={isOpen}
      title={title}
      subtitle="Assign lead ownership to a sales representative or execute automated routing rules."
      onClose={onClose}
      onSubmit={handleSubmit}
      isSaving={isSaving}
      submitLabel={useAutoRoute ? 'Execute Auto-Routing' : 'Assign Owner'}
      error={error}
    >
      <div className="ld-modal-stack">
        <Field
          label="Sales Owner"
          htmlFor="assign-owner-select"
          required={!useAutoRoute}
          hint="Select the team member responsible for following up with this lead."
        >
          <select
            id="assign-owner-select"
            className="lg-select"
            value={ownerId}
            disabled={useAutoRoute || isSaving}
            onChange={(e) => setOwnerId(e.target.value)}
          >
            <option value="">— Select sales owner —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </Field>

        <Toggle
          id="assign-auto-route-toggle"
          checked={useAutoRoute}
          onChange={setUseAutoRoute}
          label="Use automated assignment rules"
          description="Automatically route using active round-robin, load-balanced, or source-based rules."
          disabled={isSaving}
        />
      </div>
    </FormModal>
  );
};

/* ============================================================================
   3. QUALIFY LEAD MODAL
   ============================================================================ */

interface QualifyLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const QualifyLeadModal: React.FC<QualifyLeadModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState<LeadStatus>('QUALIFIED');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evalMessage, setEvalMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lead) {
      const current = (lead.status || 'NEW').toUpperCase() as LeadStatus;
      setStatus(current === 'CONVERTED' ? 'QUALIFIED' : current);
      setNotes(lead.qualificationNotes || '');
      setError(null);
      setEvalMessage(null);
    }
  }, [isOpen, lead]);

  if (!lead) return null;

  const handleAutoEvaluate = async () => {
    setIsEvaluating(true);
    setError(null);
    setEvalMessage(null);
    try {
      const res = await leadGenerationService.evaluateLeadQualification(lead.id);
      const nextStatus = res?.qualification?.recommendedStatus || res?.lead?.status;
      if (nextStatus && nextStatus !== 'CONVERTED') {
        setStatus(nextStatus as LeadStatus);
      }
      setEvalMessage(
        `Evaluated against workspace rules: recommended status is ${nextStatus || 'unchanged'}.`,
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to evaluate qualification rules.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await leadService.updateLeadStatus(lead.id, status);
      if (notes.trim()) {
        await leadService
          .createNote({
            leadId: lead.id,
            title: `Qualification Update (${status})`,
            content: notes.trim(),
          })
          .catch(() => null);
      }
      onSuccess(`Lead "${lead.title}" qualification status updated to ${status}.`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update lead qualification.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      title={`Qualify Lead — ${lead.title}`}
      subtitle="Update qualification stage or evaluate against automated qualification criteria."
      onClose={onClose}
      onSubmit={handleSubmit}
      isSaving={isSaving}
      submitLabel="Save Qualification"
      error={error}
    >
      <div className="ld-modal-stack">
        {evalMessage && <div className="lg-inline-note">{evalMessage}</div>}

        <div className="ld-eval-banner">
          <div>
            <strong>Automated Rule Evaluation</strong>
            <p className="lg-field-hint">
              Run workspace qualification rules against this lead&apos;s score, value, and profile.
            </p>
          </div>
          <button
            type="button"
            className="auth-btn btn-secondary"
            onClick={handleAutoEvaluate}
            disabled={isEvaluating || isSaving}
          >
            <SparklesIcon size={15} />
            <span>{isEvaluating ? 'Evaluating...' : 'Auto-Evaluate'}</span>
          </button>
        </div>

        <Field label="Qualification Stage" required>
          <div className="ld-status-radio-grid">
            {LEAD_STATUSES.filter((s) => s.value !== 'CONVERTED').map((s) => (
              <label
                key={s.value}
                className={`ld-status-option-card ${status === s.value ? 'is-selected' : ''} tone-${s.tone}`}
              >
                <input
                  type="radio"
                  name="qualificationStatus"
                  value={s.value}
                  checked={status === s.value}
                  onChange={() => setStatus(s.value)}
                />
                <div className="ld-status-option-head">
                  <Badge tone={s.tone}>{s.label}</Badge>
                </div>
                <span className="ld-status-option-desc">{s.description}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field
          label="Qualification Notes (Optional)"
          htmlFor="qualify-notes-input"
          hint="Saved to the lead's notes timeline for team visibility."
        >
          <textarea
            id="qualify-notes-input"
            className="lg-textarea"
            rows={3}
            placeholder="Summarize BANT fit, budget confirmation, decision maker, or disqualification reason..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
    </FormModal>
  );
};

/* ============================================================================
   4. SCORE LEAD MODAL
   ============================================================================ */

interface ScoreLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ScoreLeadModal: React.FC<ScoreLeadModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSuccess,
}) => {
  const [score, setScore] = useState<number>(0);
  const [estimatedValue, setEstimatedValue] = useState<string>('0');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recalcNote, setRecalcNote] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lead) {
      setScore(Number(lead.leadScore || 0));
      setEstimatedValue(String(lead.estimatedValue ?? 0));
      setError(null);
      setRecalcNote(null);
    }
  }, [isOpen, lead]);

  if (!lead) return null;

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setError(null);
    setRecalcNote(null);
    try {
      const res = await leadGenerationService.recalculateLeadScore(lead.id);
      const computed = res?.leadScore ?? res?.score ?? res?.lead?.leadScore ?? score;
      setScore(Number(computed));
      setRecalcNote(`Score recalculated from active scoring rules: ${computed} points.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to recalculate lead score.');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleSubmit = async () => {
    const numericScore = Number(score);
    const numericValue = Number(estimatedValue);
    if (Number.isNaN(numericScore) || numericScore < 0) {
      setError('Lead score must be 0 or greater.');
      return;
    }
    if (Number.isNaN(numericValue) || numericValue < 0) {
      setError('Estimated value must be 0 or greater.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await leadService.updateLead(lead.id, {
        leadScore: Math.round(numericScore),
        estimatedValue: numericValue,
      });
      onSuccess(`Updated score for "${lead.title}" to ${Math.round(numericScore)}.`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update lead score.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      title={`Lead Scoring — ${lead.title}`}
      subtitle="Adjust lead score manually or recalculate using workspace scoring rules."
      onClose={onClose}
      onSubmit={handleSubmit}
      isSaving={isSaving}
      submitLabel="Update Score"
      error={error}
    >
      <div className="ld-modal-stack">
        {recalcNote && <div className="lg-inline-note">{recalcNote}</div>}

        <LeadScoreDisplay score={score} />

        <div className="ld-eval-banner">
          <div>
            <strong>Rule-Based Score Calculation</strong>
            <p className="lg-field-hint">
              Evaluate demographic, firmographic, and behavioral rules for this lead.
            </p>
          </div>
          <button
            type="button"
            className="auth-btn btn-secondary"
            onClick={handleRecalculate}
            disabled={isRecalculating || isSaving}
          >
            <AwardIcon size={15} />
            <span>{isRecalculating ? 'Calculating...' : 'Recalculate Score'}</span>
          </button>
        </div>

        <Field
          label={`Lead Score (${score} / 100)`}
          htmlFor="lead-score-range"
          hint="Hot: 70–100 · Warm: 40–69 · Cold: 0–39"
        >
          <div className="ld-score-slider-row">
            <input
              id="lead-score-range"
              type="range"
              min={0}
              max={100}
              value={Math.min(100, Math.max(0, score))}
              onChange={(e) => setScore(Number(e.target.value))}
              className="ld-score-range-input"
            />
            <input
              type="number"
              min={0}
              max={1000}
              value={score}
              onChange={(e) => setScore(Math.max(0, Number(e.target.value)))}
              className="lg-input ld-score-number-input"
              aria-label="Numeric lead score"
            />
          </div>
        </Field>

        <Field
          label="Estimated Deal Value (USD)"
          htmlFor="lead-score-value-input"
          hint="Expected revenue opportunity if this lead converts."
        >
          <input
            id="lead-score-value-input"
            type="number"
            min={0}
            step="100"
            className="lg-input"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
          />
        </Field>
      </div>
    </FormModal>
  );
};

/* ============================================================================
   5. CONVERT LEAD MODAL (With Confirmation Step)
   ============================================================================ */

interface ConvertLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  pipelines: PipelineOption[];
  onClose: () => void;
  onConverted: (result: any) => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  isOpen,
  lead,
  pipelines,
  onClose,
  onConverted,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState('0');
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lead) {
      setCompanyName(lead.companyName || '');
      setDealTitle(`${lead.title} Deal`);
      setDealValue(String(lead.estimatedValue || 0));
      const defaultPipe = pipelines.find((p) => p.isDefault) || pipelines[0];
      setPipelineId(defaultPipe?.id || '');
      setStageId(defaultPipe?.stages?.[0]?.id || '');
      setConfirmed(false);
      setError(null);
    }
  }, [isOpen, lead, pipelines]);

  if (!isOpen || !lead) return null;

  const selectedPipeline = pipelines.find((p) => p.id === pipelineId);
  const stages = selectedPipeline?.stages || [];

  const handlePipelineChange = (newPipeId: string) => {
    setPipelineId(newPipeId);
    const found = pipelines.find((p) => p.id === newPipeId);
    setStageId(found?.stages?.[0]?.id || '');
  };

  const handleConvert = async () => {
    if (!dealTitle.trim()) {
      setError('Deal title is required for conversion.');
      return;
    }
    if (!confirmed) {
      setError('Please confirm that you want to convert this lead into a Contact, Organization, and Deal.');
      return;
    }

    setIsConverting(true);
    setError(null);
    try {
      const result = await leadService.convertLead(lead.id, {
        companyName: companyName.trim() || undefined,
        dealTitle: dealTitle.trim(),
        dealValue: Number(dealValue) || 0,
        pipelineId: pipelineId || undefined,
        stageId: stageId || undefined,
      });
      onConverted(result);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to convert lead.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="convert-modal-title">
      <div className="modal-container modal-wide lg-modal">
        <div className="modal-header">
          <div className="modal-header-text">
            <h3 id="convert-modal-title" className="modal-title">
              Convert Lead — {lead.title}
            </h3>
            <p className="modal-subtitle">
              Create a linked Contact, Organization, and Sales Deal from this lead.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isConverting}
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-body lg-modal-body">
          {error && (
            <div className="lg-inline-alert" role="alert">
              <AlertCircleIcon size={16} />
              <span>{error}</span>
            </div>
          )}

          {lead.status !== 'QUALIFIED' && (
            <div className="ld-warning-banner">
              <AlertCircleIcon size={16} />
              <span>
                Note: This lead currently has status <strong>{lead.status}</strong>. Converting will
                immediately transition the lead to <strong>CONVERTED</strong>.
              </span>
            </div>
          )}

          <div className="ld-convert-summary-grid">
            <div className="ld-convert-preview-card">
              <span className="ld-convert-step-tag">1. Contact Record</span>
              <strong>{leadFullName(lead)}</strong>
              <span className="lg-muted">{lead.email}</span>
              {lead.phone && <span className="lg-muted">{lead.phone}</span>}
            </div>

            <div className="ld-convert-preview-card">
              <span className="ld-convert-step-tag">2. Organization</span>
              <strong>{companyName || 'Individual / No Organization'}</strong>
              <span className="lg-muted">Matched or created automatically</span>
            </div>

            <div className="ld-convert-preview-card">
              <span className="ld-convert-step-tag">3. Sales Opportunity</span>
              <strong>{dealTitle || `${lead.title} Deal`}</strong>
              <span className="lg-muted">{formatCurrency(Number(dealValue || 0))}</span>
            </div>
          </div>

          <div className="lg-form-grid">
            <Field
              label="Organization / Company Name"
              htmlFor="convert-company-input"
              hint="Creates or links an active Organization record."
            >
              <input
                id="convert-company-input"
                className="lg-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corporation"
              />
            </Field>

            <Field label="Deal Title" htmlFor="convert-deal-title" required>
              <input
                id="convert-deal-title"
                className="lg-input"
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                placeholder="e.g. Enterprise Annual License"
              />
            </Field>

            <Field label="Deal Value (USD)" htmlFor="convert-deal-value">
              <input
                id="convert-deal-value"
                type="number"
                min={0}
                step="100"
                className="lg-input"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
              />
            </Field>

            {pipelines.length > 0 && (
              <Field label="Sales Pipeline" htmlFor="convert-pipeline-select">
                <select
                  id="convert-pipeline-select"
                  className="lg-select"
                  value={pipelineId}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {stages.length > 0 && (
              <Field label="Initial Pipeline Stage" htmlFor="convert-stage-select">
                <select
                  id="convert-stage-select"
                  className="lg-select"
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          <div className="ld-confirm-box">
            <Toggle
              id="confirm-lead-conversion-toggle"
              checked={confirmed}
              onChange={setConfirmed}
              label="I confirm converting this lead into a Contact, Organization, and Deal"
              description="Once converted, the lead status is locked as CONVERTED and linked to the newly created CRM records."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="auth-btn btn-ghost"
            onClick={onClose}
            disabled={isConverting}
          >
            Cancel
          </button>
          <PrimaryButton
            type="button"
            fullWidth={false}
            isLoading={isConverting}
            loadingText="Converting..."
            onClick={handleConvert}
            icon={<CheckCircleIcon size={16} />}
          >
            Confirm & Convert Lead
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

