import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { Lead, LeadStatus } from '../../types/lead.types';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { Field } from '../lead-generation/components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, humanize } from '../lead-generation/leadGenConstants';
import {
  BANT_CHECKLIST_ITEMS,
  LEAD_STATUSES,
  leadFullName,
  statusTone,
} from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import { LeadScoreDisplay, QualificationPipeline } from './components/LeadCard';
import {
  ArrowRightIcon,
  AwardIcon,
  CheckCircleIcon,
  SparklesIcon,
  TargetIcon,
} from '../../components/common/Icons';

export const LeadQualificationPage: React.FC = () => {
  const { id: routeLeadId } = useParams<{ id?: string }>();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Qualification form state
  const [targetStatus, setTargetStatus] = useState<LeadStatus>('QUALIFIED');
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({
    budget: false,
    authority: false,
    need: false,
    timeline: false,
  });
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectLeadForReview = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    const st = (lead.status || 'NEW').toUpperCase() as LeadStatus;
    setTargetStatus(st === 'CONVERTED' ? 'QUALIFIED' : st);
    setNotes(lead.qualificationNotes || '');
    const isQual = st === 'QUALIFIED' || st === 'CONVERTED';
    setCheckedCriteria({
      budget: isQual,
      authority: isQual,
      need: isQual || st === 'CONTACTED',
      timeline: isQual,
    });
  }, []);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, singleRes] = await Promise.all([
        leadService.getLeads({ limit: 50 }),
        routeLeadId ? leadService.getLeadById(routeLeadId).catch(() => null) : Promise.resolve(null),
      ]);
      const items = listRes.data || [];
      setLeads(items);

      const initial =
        singleRes ||
        items.find((l) => l.id === routeLeadId) ||
        items.find((l) => l.status !== 'CONVERTED') ||
        items[0] ||
        null;

      if (initial) {
        selectLeadForReview(initial);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads for qualification.');
    } finally {
      setIsLoading(false);
    }
  }, [routeLeadId, selectLeadForReview]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleAutoEvaluate = async () => {
    if (!selectedLead) return;
    setIsEvaluating(true);
    setError(null);
    try {
      const res = await leadGenerationService.evaluateLeadQualification(selectedLead.id);
      const recommended = res?.qualification?.recommendedStatus || res?.lead?.status;
      if (recommended && recommended !== 'CONVERTED') {
        setTargetStatus(recommended as LeadStatus);
      }
      setSuccess(
        `Evaluated qualification rules for "${selectedLead.title}" — Status: ${
          recommended || selectedLead.status
        }.`,
      );
      await loadLeads();
    } catch (err: any) {
      setError(err?.message || 'Failed to evaluate qualification rules.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await leadService.updateLeadStatus(selectedLead.id, targetStatus);
      const criteriaSummary = BANT_CHECKLIST_ITEMS.filter((item) => checkedCriteria[item.id])
        .map((item) => item.label)
        .join(', ');

      if (notes.trim() || criteriaSummary) {
        await leadService
          .createNote({
            leadId: selectedLead.id,
            title: `Qualification Assessment (${targetStatus})`,
            content: `${
              criteriaSummary ? `Verified BANT Criteria: ${criteriaSummary}.\n` : ''
            }${notes.trim()}`,
          })
          .catch(() => null);
      }

      setSelectedLead((prev) => (prev ? { ...prev, ...updated } : updated));
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updated } : l)));
      setSuccess(`Updated "${selectedLead.title}" qualification status to ${targetStatus}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update lead qualification.');
    } finally {
      setIsSaving(false);
    }
  };

  const metCount = Object.values(checkedCriteria).filter(Boolean).length;

  return (
    <LeadsLayout
      title={selectedLead ? `Lead Qualification — ${selectedLead.title}` : 'Lead Qualification'}
      subtitle="Assess BANT criteria, evaluate automated qualification rules, and update qualification stage."
      icon={<CheckCircleIcon size={22} />}
      activeLead={selectedLead}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <>
          <Link to="/lead-generation/qualification" className="auth-btn btn-secondary">
            <SparklesIcon size={15} />
            <span>Qualification Rules</span>
          </Link>
          {selectedLead && selectedLead.status !== 'CONVERTED' && (
            <Link to={`/leads/${selectedLead.id}/convert`} className="auth-btn btn-primary">
              <span>Proceed to Conversion</span>
              <ArrowRightIcon size={15} />
            </Link>
          )}
        </>
      }
    >
      {/* Top Funnel KPIs */}
      <div className="lg-stat-grid">
        <StatCard
          label="New Leads"
          value={leads.filter((l) => l.status === 'NEW').length}
          hint="Awaiting initial outreach"
          icon={<TargetIcon size={20} />}
          tone="blue"
        />
        <StatCard
          label="Contacted"
          value={leads.filter((l) => l.status === 'CONTACTED').length}
          hint="In discovery"
          icon={<AwardIcon size={20} />}
          tone="cyan"
        />
        <StatCard
          label="Qualified"
          value={leads.filter((l) => l.status === 'QUALIFIED').length}
          hint="Ready to convert"
          icon={<CheckCircleIcon size={20} />}
          tone="green"
        />
        <StatCard
          label="Unqualified"
          value={leads.filter((l) => l.status === 'UNQUALIFIED').length}
          hint="Disqualified / Nurture"
          icon={<TargetIcon size={20} />}
          tone="red"
        />
      </div>

      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading qualification workspace..." />
        </div>
      ) : leads.length === 0 ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No leads available"
            description="Create a lead first to evaluate and update its qualification status."
            action={
              <Link to="/leads/create" className="auth-btn btn-primary">
                Create Lead
              </Link>
            }
          />
        </div>
      ) : (
        <div className="ld-workspace-split">
          {/* Left Queue Picker */}
          <SectionCard
            title="Lead Queue"
            subtitle="Select a lead to qualify"
            className="ld-queue-panel"
          >
            <div className="ld-queue-list">
              {leads.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => selectLeadForReview(l)}
                  className={`ld-queue-item ${selectedLead?.id === l.id ? 'is-active' : ''}`}
                >
                  <div className="ld-queue-item-top">
                    <strong>{l.title}</strong>
                    <Badge tone={statusTone(l.status)}>{humanize(l.status)}</Badge>
                  </div>
                  <div className="ld-queue-item-sub">
                    <span>{leadFullName(l)}</span>
                    <span>Score: {l.leadScore || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Right Qualification Inspector */}
          {selectedLead && (
            <SectionCard
              title={`Qualification Assessment — ${selectedLead.title}`}
              subtitle={`${leadFullName(selectedLead)} · ${
                selectedLead.companyName || selectedLead.email
              } · Value: ${formatCurrency(selectedLead.estimatedValue)}`}
              actions={
                <button
                  type="button"
                  className="auth-btn btn-secondary"
                  onClick={handleAutoEvaluate}
                  disabled={isEvaluating}
                >
                  <SparklesIcon size={15} />
                  <span>{isEvaluating ? 'Evaluating...' : 'Run Auto-Qualification'}</span>
                </button>
              }
            >
              <form className="ld-modal-stack" onSubmit={handleSaveQualification}>
                <QualificationPipeline
                  currentStatus={targetStatus}
                  onSelectStatus={setTargetStatus}
                />

                <div className="ld-drawer-grid-2">
                  <div className="ld-drawer-box">
                    <span className="ld-drawer-section-label">Current Lead Score</span>
                    <LeadScoreDisplay score={selectedLead.leadScore} />
                  </div>
                  <div className="ld-drawer-box">
                    <span className="ld-drawer-section-label">BANT Readiness</span>
                    <div className="ld-drawer-big-value">{metCount} / 4 Criteria Met</div>
                    <span className="lg-muted">
                      {metCount >= 3
                        ? 'Strong qualification fit — recommended QUALIFIED'
                        : 'Complete discovery checklist below'}
                    </span>
                  </div>
                </div>

                <Field label="BANT Qualification Checklist">
                  <div className="ld-bant-grid">
                    {BANT_CHECKLIST_ITEMS.map((item) => (
                      <label
                        key={item.id}
                        className={`ld-bant-card ${checkedCriteria[item.id] ? 'is-checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={ Boolean(checkedCriteria[item.id]) }
                          onChange={(e) =>
                            setCheckedCriteria((prev) => ({
                              ...prev,
                              [item.id]: e.target.checked,
                            }))
                          }
                        />
                        <div>
                          <strong>{item.label}</strong>
                          <p className="lg-field-hint">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Target Qualification Stage" required>
                  <div className="ld-status-radio-grid">
                    {LEAD_STATUSES.filter((s) => s.value !== 'CONVERTED').map((s) => (
                      <label
                        key={s.value}
                        className={`ld-status-option-card ${
                          targetStatus === s.value ? 'is-selected' : ''
                        } tone-${s.tone}`}
                      >
                        <input
                          type="radio"
                          name="qualStage"
                          value={s.value}
                          checked={targetStatus === s.value}
                          onChange={() => setTargetStatus(s.value)}
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
                  label="Qualification Decision Notes"
                  htmlFor="qual-decision-notes"
                  hint="Logged as a timestamped note on the lead's timeline."
                >
                  <textarea
                    id="qual-decision-notes"
                    className="lg-textarea"
                    rows={3}
                    placeholder="Document budget range, decision maker authority, timeline, or reason for disqualification..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>

                <div className="lg-form-actions">
                  <Link to={`/leads/${selectedLead.id}`} className="auth-btn btn-ghost">
                    View Full Lead
                  </Link>
                  <PrimaryButton
                    type="submit"
                    fullWidth={false}
                    isLoading={isSaving}
                    loadingText="Saving..."
                  >
                    Save Qualification Decision
                  </PrimaryButton>
                </div>
              </form>
            </SectionCard>
          )}
        </div>
      )}
    </LeadsLayout>
  );
};

