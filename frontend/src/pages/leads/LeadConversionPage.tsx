import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import type {
  ConvertLeadResponse,
  Lead,
  PipelineOption,
} from '../../types/lead.types';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { Field, Toggle } from '../lead-generation/components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, humanize } from '../lead-generation/leadGenConstants';
import { leadFullName, statusTone } from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import { LeadScoreDisplay } from './components/LeadCard';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  DollarSignIcon,
  TargetIcon,
} from '../../components/common/Icons';

export const LeadConversionPage: React.FC = () => {
  const { id: routeLeadId } = useParams<{ id?: string }>();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Conversion form state
  const [companyName, setCompanyName] = useState('');
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState('0');
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConvertLeadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectLeadToConvert = useCallback(
    (lead: Lead, pipes: PipelineOption[]) => {
      setSelectedLead(lead);
      setCompanyName(lead.companyName || '');
      setDealTitle(`${lead.title} Deal`);
      setDealValue(String(lead.estimatedValue || 0));
      const defaultPipe = pipes.find((p) => p.isDefault) || pipes[0];
      setPipelineId(defaultPipe?.id || '');
      setStageId(defaultPipe?.stages?.[0]?.id || '');
      setConfirmed(false);
      setConversionResult(null);
      setError(null);
    },
    [],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, pipeRes, singleRes] = await Promise.all([
        leadService.getLeads({ limit: 50 }),
        leadService.getPipelines(),
        routeLeadId ? leadService.getLeadById(routeLeadId).catch(() => null) : Promise.resolve(null),
      ]);

      const items = listRes.data || [];
      setLeads(items);
      setPipelines(pipeRes);

      const initial =
        singleRes ||
        items.find((l) => l.id === routeLeadId) ||
        items.find((l) => l.status === 'QUALIFIED') ||
        items.find((l) => l.status !== 'CONVERTED') ||
        items[0] ||
        null;

      if (initial) {
        selectLeadToConvert(initial, pipeRes);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads for conversion.');
    } finally {
      setIsLoading(false);
    }
  }, [routeLeadId, selectLeadToConvert]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedPipeline = pipelines.find((p) => p.id === pipelineId);
  const stages = selectedPipeline?.stages || [];

  const handlePipelineChange = (newPipeId: string) => {
    setPipelineId(newPipeId);
    const found = pipelines.find((p) => p.id === newPipeId);
    setStageId(found?.stages?.[0]?.id || '');
  };

  const handleQualifyNow = async () => {
    if (!selectedLead) return;
    try {
      const updated = await leadService.updateLeadStatus(selectedLead.id, 'QUALIFIED');
      setSelectedLead((prev) => (prev ? { ...prev, ...updated } : updated));
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updated } : l)));
      setSuccess(`Lead "${selectedLead.title}" marked as QUALIFIED and ready for conversion.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to qualify lead.');
    }
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    if (selectedLead.status === 'CONVERTED') {
      setError('This lead has already been converted.');
      return;
    }
    if (!dealTitle.trim()) {
      setError('Deal title is required.');
      return;
    }
    if (!confirmed) {
      setError('Please check the confirmation toggle before converting this lead.');
      return;
    }

    setIsConverting(true);
    setError(null);
    try {
      const result = await leadService.convertLead(selectedLead.id, {
        companyName: companyName.trim() || undefined,
        dealTitle: dealTitle.trim(),
        dealValue: Math.max(0, Number(dealValue || 0)),
        pipelineId: pipelineId || undefined,
        stageId: stageId || undefined,
      });
      setConversionResult(result);
      setSelectedLead((prev) =>
        prev ? { ...prev, ...result.lead, status: 'CONVERTED' } : result.lead,
      );
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id ? { ...l, ...result.lead, status: 'CONVERTED' } : l,
        ),
      );
      setSuccess(
        `Lead "${selectedLead.title}" successfully converted into Contact and Deal "${result.deal?.title}".`,
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to convert lead.');
    } finally {
      setIsConverting(false);
    }
  };

  const qualifiedReady = leads.filter((l) => l.status === 'QUALIFIED');
  const alreadyConverted = leads.filter((l) => l.status === 'CONVERTED');

  return (
    <LeadsLayout
      title={selectedLead ? `Convert Lead — ${selectedLead.title}` : 'Lead Conversion'}
      subtitle="Convert qualified leads into linked Contact, Organization, and Sales Deal records."
      icon={<ArrowRightIcon size={22} />}
      activeLead={selectedLead}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link to={selectedLead ? `/leads/${selectedLead.id}` : '/leads'} className="lg-link-btn">
          <ArrowLeftIcon size={14} /> {selectedLead ? 'Back to Lead Details' : 'Back to All Leads'}
        </Link>
      }
    >
      <div className="lg-stat-grid">
        <StatCard
          label="Qualified & Ready"
          value={qualifiedReady.length}
          hint="Recommended for conversion"
          icon={<CheckCircleIcon size={20} />}
          tone="green"
        />
        <StatCard
          label="Already Converted"
          value={alreadyConverted.length}
          hint="Turned into opportunities"
          icon={<TargetIcon size={20} />}
          tone="purple"
        />
        <StatCard
          label="Qualified Pipeline"
          value={formatCurrency(
            qualifiedReady.reduce((s, l) => s + Number(l.estimatedValue || 0), 0),
          )}
          hint="Ready to move to Sales Deals"
          icon={<DollarSignIcon size={20} />}
          tone="blue"
        />
      </div>

      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading lead conversion workspace..." />
        </div>
      ) : leads.length === 0 ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No leads available"
            description="Create and qualify a lead first to convert it into a Deal."
            action={
              <Link to="/leads/create" className="auth-btn btn-primary">
                Create Lead
              </Link>
            }
          />
        </div>
      ) : (
        <div className="ld-workspace-split">
          {/* Left Lead Queue */}
          <SectionCard
            title="Conversion Queue"
            subtitle="Qualified leads prioritized first"
            className="ld-queue-panel"
          >
            <div className="ld-queue-list">
              {[...leads]
                .sort((a, b) => {
                  const scoreA = a.status === 'QUALIFIED' ? 2 : a.status === 'CONVERTED' ? 0 : 1;
                  const scoreB = b.status === 'QUALIFIED' ? 2 : b.status === 'CONVERTED' ? 0 : 1;
                  return scoreB - scoreA;
                })
                .map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => selectLeadToConvert(l, pipelines)}
                    className={`ld-queue-item ${selectedLead?.id === l.id ? 'is-active' : ''}`}
                  >
                    <div className="ld-queue-item-top">
                      <strong>{l.title}</strong>
                      <Badge tone={statusTone(l.status)}>{humanize(l.status)}</Badge>
                    </div>
                    <div className="ld-queue-item-sub">
                      <span>{leadFullName(l)}</span>
                      <span>{formatCurrency(l.estimatedValue)}</span>
                    </div>
                  </button>
                ))}
            </div>
          </SectionCard>

          {/* Right Conversion Workbench */}
          {selectedLead && (
            <SectionCard
              title={`Lead Conversion — ${selectedLead.title}`}
              subtitle={`${leadFullName(selectedLead)} (${selectedLead.email})`}
            >
              {conversionResult ? (
                <div className="ld-modal-stack">
                  <div className="lg-inline-note">
                    <strong>Conversion Completed Successfully!</strong>
                    <p className="lg-field-hint">
                      The lead has been marked as CONVERTED and linked to the records below.
                    </p>
                  </div>

                  <div className="ld-convert-summary-grid">
                    <div className="ld-convert-preview-card">
                      <span className="ld-convert-step-tag">Created Contact</span>
                      <strong>
                        {conversionResult.contact.firstName} {conversionResult.contact.lastName}
                      </strong>
                      <span className="lg-muted">{conversionResult.contact.email}</span>
                      <span className="lg-muted font-mono">ID: {conversionResult.contact.id}</span>
                    </div>

                    <div className="ld-convert-preview-card">
                      <span className="ld-convert-step-tag">Created Deal</span>
                      <strong>{conversionResult.deal.title}</strong>
                      <span className="lg-muted">
                        Value: {formatCurrency(conversionResult.deal.value)}
                      </span>
                      <span className="lg-muted font-mono">ID: {conversionResult.deal.id}</span>
                    </div>
                  </div>

                  <div className="lg-form-actions">
                    <Link to={`/leads/${selectedLead.id}`} className="auth-btn btn-primary">
                      View Converted Lead Record
                    </Link>
                  </div>
                </div>
              ) : selectedLead.status === 'CONVERTED' ? (
                <div className="ld-modal-stack">
                  <div className="lg-inline-note">
                    <strong>This lead has already been converted.</strong>
                    <p className="lg-field-hint">
                      Converted Contact ID: {selectedLead.convertedContactId || 'Linked'} ·
                      Converted Deal ID: {selectedLead.convertedDealId || 'Linked'}
                    </p>
                  </div>
                  <div className="lg-form-actions">
                    <Link to={`/leads/${selectedLead.id}`} className="auth-btn btn-secondary">
                      Open Lead Details
                    </Link>
                  </div>
                </div>
              ) : (
                <form className="ld-modal-stack" onSubmit={handleConvertSubmit} noValidate>
                  {selectedLead.status !== 'QUALIFIED' && (
                    <div className="ld-warning-banner">
                      <AlertCircleIcon size={16} />
                      <div className="ld-flex-1">
                        This lead currently has status <strong>{selectedLead.status}</strong>. Best
                        practice is to qualify the lead before conversion.
                      </div>
                      <button
                        type="button"
                        className="auth-btn btn-secondary btn-size-small"
                        onClick={handleQualifyNow}
                      >
                        Mark as QUALIFIED
                      </button>
                    </div>
                  )}

                  <div className="ld-convert-summary-grid">
                    <div className="ld-convert-preview-card">
                      <span className="ld-convert-step-tag">1. Contact Record</span>
                      <strong>{leadFullName(selectedLead)}</strong>
                      <span className="lg-muted">{selectedLead.email}</span>
                      <span className="lg-muted">{selectedLead.phone || 'No phone'}</span>
                    </div>

                    <div className="ld-convert-preview-card">
                      <span className="ld-convert-step-tag">2. Organization</span>
                      <strong>{companyName || 'Individual / No Organization'}</strong>
                      <span className="lg-muted">Matched or created automatically</span>
                    </div>

                    <div className="ld-convert-preview-card">
                      <span className="ld-convert-step-tag">3. Lead Score</span>
                      <LeadScoreDisplay score={selectedLead.leadScore} compact />
                      <span className="lg-muted">
                        Owner: {selectedLead.owner?.name || 'Current User'}
                      </span>
                    </div>
                  </div>

                  <div className="lg-form-grid">
                    <Field
                      label="Organization / Company Name"
                      htmlFor="page-convert-company"
                      hint="Links to an existing Organization or creates a new one."
                    >
                      <input
                        id="page-convert-company"
                        className="lg-input"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Daily Planet Media Group"
                      />
                    </Field>

                    <Field label="Sales Deal Title" htmlFor="page-convert-deal-title" required>
                      <input
                        id="page-convert-deal-title"
                        className="lg-input"
                        value={dealTitle}
                        onChange={(e) => setDealTitle(e.target.value)}
                        placeholder="e.g. Enterprise Security Solution Deal"
                      />
                    </Field>

                    <Field label="Deal Value (USD)" htmlFor="page-convert-deal-value">
                      <input
                        id="page-convert-deal-value"
                        type="number"
                        min={0}
                        step="100"
                        className="lg-input"
                        value={dealValue}
                        onChange={(e) => setDealValue(e.target.value)}
                      />
                    </Field>

                    {pipelines.length > 0 && (
                      <Field label="Sales Pipeline" htmlFor="page-convert-pipeline">
                        <select
                          id="page-convert-pipeline"
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
                      <Field label="Initial Deal Stage" htmlFor="page-convert-stage">
                        <select
                          id="page-convert-stage"
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
                      id="page-convert-confirm-toggle"
                      checked={confirmed}
                      onChange={setConfirmed}
                      label="I confirm converting this lead into a Contact, Organization, and Deal"
                      description="This action transitions the lead to CONVERTED and creates the linked records."
                    />
                  </div>

                  <div className="lg-form-actions">
                    <Link to={`/leads/${selectedLead.id}`} className="auth-btn btn-ghost">
                      Cancel
                    </Link>
                    <PrimaryButton
                      type="submit"
                      fullWidth={false}
                      isLoading={isConverting}
                      loadingText="Converting Lead..."
                      icon={<CheckCircleIcon size={16} />}
                    >
                      Confirm & Convert Lead
                    </PrimaryButton>
                  </div>
                </form>
              )}
            </SectionCard>
          )}
        </div>
      )}
    </LeadsLayout>
  );
};

