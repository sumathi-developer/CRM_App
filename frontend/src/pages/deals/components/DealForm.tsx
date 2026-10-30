import React, { useEffect, useMemo, useState } from 'react';
import type {
  CreateDealPayload,
  Deal,
  DealOrganizationOption,
  DealStatus,
  DealUserOption,
  Pipeline,
  PipelineStage,
  UpdateDealPayload,
} from '../../../types/deal.types';
import type { Contact } from '../../../types/contact.types';
import { contactService } from '../../../services/contact.service';
import { dealService } from '../../../services/deal.service';
import { Field } from '../../lead-generation/components/FormParts';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { formatCurrency } from '../../lead-generation/leadGenConstants';
import { CURRENCY_OPTIONS } from '../dealConstants';
import { DealStageStepper } from './DealViews';

export interface DealFormProps {
  mode: 'create' | 'edit';
  initialDeal?: Deal | null;
  preselectedPipelineId?: string;
  preselectedStageId?: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onSubmit: (payload: CreateDealPayload | UpdateDealPayload) => Promise<void>;
  onCancel: () => void;
}

export const DealForm: React.FC<DealFormProps> = ({
  mode,
  initialDeal,
  preselectedPipelineId,
  preselectedStageId,
  isSubmitting = false,
  serverError = null,
  onSubmit,
  onCancel,
}) => {
  const settings = useMemo(() => dealService.getLocalSettings(), []);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [organizations, setOrganizations] = useState<DealOrganizationOption[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<DealUserOption[]>([]);

  const [title, setTitle] = useState(initialDeal?.title || '');
  const [value, setValue] = useState<string>(
    initialDeal?.value !== undefined ? String(initialDeal.value) : '',
  );
  const [currency, setCurrency] = useState(
    initialDeal?.currency || settings.defaultCurrency || 'USD',
  );
  const [pipelineId, setPipelineId] = useState(
    initialDeal?.pipelineId || preselectedPipelineId || '',
  );
  const [stageId, setStageId] = useState(
    initialDeal?.stageId || preselectedStageId || '',
  );
  const [probability, setProbability] = useState<number>(
    initialDeal?.probability ?? settings.defaultProbability ?? 20,
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    initialDeal?.expectedCloseDate
      ? initialDeal.expectedCloseDate.slice(0, 10)
      : '',
  );
  const [status, setStatus] = useState<DealStatus>(
    (initialDeal?.status as DealStatus) || 'OPEN',
  );
  const [organizationId, setOrganizationId] = useState(
    initialDeal?.organizationId || '',
  );
  const [contactId, setContactId] = useState(initialDeal?.contactId || '');
  const [ownerId, setOwnerId] = useState(initialDeal?.ownerId || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const loadLookups = async () => {
      try {
        const [pipes, orgs, contactRes, assignees] = await Promise.all([
          dealService.getPipelines(),
          dealService.getOrganizations(),
          contactService.getContacts({ limit: 100 }).catch(() => ({ data: [] })),
          dealService.getAssignableUsers(),
        ]);

        if (!active) return;

        setPipelines(pipes);
        setOrganizations(orgs);
        setContacts(Array.isArray(contactRes?.data) ? contactRes.data : []);
        setUsers(assignees);

        if (!initialDeal && pipes.length > 0) {
          const chosenPipe =
            pipes.find((p: Pipeline) => p.id === preselectedPipelineId) ||
            pipes.find((p: Pipeline) => p.isDefault) ||
            pipes[0];

          if (chosenPipe) {
            setPipelineId((prev) => prev || chosenPipe.id);
            const stages = chosenPipe.stages || [];
            const chosenStage =
              stages.find((s: PipelineStage) => s.id === preselectedStageId) || stages[0];
            if (chosenStage) {
              setStageId((prev) => prev || chosenStage.id);
              setProbability(chosenStage.winProbability);
            }
          }
        }
      } catch {
        // fallback gracefully
      }
    };

    loadLookups();
    return () => {
      active = false;
    };
  }, [initialDeal, preselectedPipelineId, preselectedStageId]);

  const activePipeline = useMemo(
    () =>
      pipelines.find((p) => p.id === pipelineId) ||
      pipelines.find((p) => p.isDefault) ||
      pipelines[0] ||
      null,
    [pipelines, pipelineId],
  );

  const availableStages = useMemo(
    () => activePipeline?.stages || [],
    [activePipeline],
  );

  const handlePipelineChange = (nextPipelineId: string) => {
    setPipelineId(nextPipelineId);
    const nextPipe = pipelines.find((p) => p.id === nextPipelineId);
    const firstStage = nextPipe?.stages?.[0];
    if (firstStage) {
      setStageId(firstStage.id);
      setProbability(firstStage.winProbability);
    } else {
      setStageId('');
    }
  };

  const handleStageChange = (nextStageId: string) => {
    setStageId(nextStageId);
    const st = availableStages.find((s) => s.id === nextStageId);
    if (st) {
      setProbability(st.winProbability);
    }
  };

  const numericValue = Number(value) || 0;
  const weightedValue = Math.round(
    numericValue * (Math.min(100, Math.max(0, probability)) / 100),
  );

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) {
      nextErrors.title = 'Deal title is required.';
    }
    if (value.trim() === '' || Number.isNaN(Number(value)) || Number(value) < 0) {
      nextErrors.value = 'Deal value is required and must be 0 or greater.';
    }
    if (probability < 0 || probability > 100) {
      nextErrors.probability = 'Probability must be between 0% and 100%.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const basePayload: CreateDealPayload = {
      title: title.trim(),
      value: Number(value),
      currency: currency || 'USD',
      pipelineId: pipelineId || undefined,
      stageId: stageId || undefined,
      probability: Number(probability),
      expectedCloseDate: expectedCloseDate
        ? new Date(expectedCloseDate).toISOString()
        : undefined,
      organizationId: organizationId || undefined,
      contactId: contactId || undefined,
      ownerId: ownerId || undefined,
    };

    if (mode === 'edit') {
      const updatePayload: UpdateDealPayload = {
        ...basePayload,
        status,
      };
      await onSubmit(updatePayload);
    } else {
      await onSubmit(basePayload);
    }
  };

  return (
    <form className="lg-card ld-form-card" onSubmit={handleSubmit} noValidate>
      <div className="ld-form-section">
        <h3 className="ld-form-section-title">Deal Opportunity Details</h3>
        <p className="ld-form-section-sub">
          Enter the core commercial details, valuation, and expected close date for this deal.
        </p>

        {serverError && <ErrorMessage error={serverError} />}

        <div className="lg-form-grid">
          <Field
            label="Deal Title"
            htmlFor="deal-title"
            required
            error={errors.title}
          >
            <input
              id="deal-title"
              type="text"
              className="lg-input"
              placeholder="e.g. Acme Corp — Enterprise Annual License"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
            />
          </Field>

          <Field
            label="Deal Value"
            htmlFor="deal-value"
            required
            error={errors.value}
            hint={`Weighted Forecast: ${formatCurrency(weightedValue)}`}
          >
            <input
              id="deal-value"
              type="number"
              min={0}
              step="any"
              className="lg-input"
              placeholder="50000"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (errors.value) setErrors((prev) => ({ ...prev, value: '' }));
              }}
            />
          </Field>

          <Field label="Currency" htmlFor="deal-currency">
            <select
              id="deal-currency"
              className="lg-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Expected Close Date"
            htmlFor="deal-expected-close"
            hint="Target date for closing this opportunity"
          >
            <input
              id="deal-expected-close"
              type="date"
              className="lg-input"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="ld-form-section">
        <h3 className="ld-form-section-title">Pipeline, Stage & Win Probability</h3>
        <p className="ld-form-section-sub">
          Assign this deal to a sales pipeline stage and configure its win likelihood.
        </p>

        {availableStages.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <DealStageStepper
              stages={availableStages}
              currentStageId={stageId}
              onSelectStage={handleStageChange}
            />
          </div>
        )}

        <div className="lg-form-grid">
          <Field label="Sales Pipeline" htmlFor="deal-pipeline">
            <select
              id="deal-pipeline"
              className="lg-select"
              value={pipelineId}
              onChange={(e) => handlePipelineChange(e.target.value)}
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pipeline Stage" htmlFor="deal-stage">
            <select
              id="deal-stage"
              className="lg-select"
              value={stageId}
              onChange={(e) => handleStageChange(e.target.value)}
            >
              {availableStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.order}. {s.name} ({s.winProbability}%)
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={`Win Probability (${probability}%)`}
            htmlFor="deal-probability"
            error={errors.probability}
            hint={`Weighted Value: ${formatCurrency(weightedValue)}`}
          >
            <div className="lg-badge-row" style={{ alignItems: 'center', gap: '0.75rem' }}>
              <input
                id="deal-probability"
                type="range"
                min={0}
                max={100}
                step={5}
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                min={0}
                max={100}
                className="lg-input"
                style={{ width: '82px' }}
                value={probability}
                onChange={(e) =>
                  setProbability(
                    Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  )
                }
                aria-label="Probability percentage"
              />
            </div>
          </Field>

          {mode === 'edit' && (
            <Field label="Deal Outcome / Status" htmlFor="deal-status">
              <select
                id="deal-status"
                className="lg-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as DealStatus)}
              >
                <option value="OPEN">OPEN — Active Opportunity</option>
                <option value="WON">WON — Closed Won</option>
                <option value="LOST">LOST — Closed Lost</option>
              </select>
            </Field>
          )}
        </div>
      </div>

      <div className="ld-form-section">
        <h3 className="ld-form-section-title">Account, Contact & Ownership</h3>
        <p className="ld-form-section-sub">
          Link this deal to an organization, primary stakeholder contact, and deal owner.
        </p>

        <div className="lg-form-grid">
          <Field label="Organization / Account" htmlFor="deal-organization">
            <select
              id="deal-organization"
              className="lg-select"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
            >
              <option value="">— No Organization Linked —</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Primary Contact" htmlFor="deal-contact">
            <select
              id="deal-contact"
              className="lg-select"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">— No Primary Contact —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Deal Owner" htmlFor="deal-owner">
            <select
              id="deal-owner"
              className="lg-select"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            >
              <option value="">— Assign to Current User —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="ld-form-actions">
        <button
          type="button"
          className="auth-btn btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="auth-btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Creating Deal...'
              : 'Saving Changes...'
            : mode === 'create'
              ? 'Create Deal'
              : 'Save Deal Changes'}
        </button>
      </div>
    </form>
  );
};
