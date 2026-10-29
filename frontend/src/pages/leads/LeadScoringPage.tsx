import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { Lead } from '../../types/lead.types';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { Field } from '../lead-generation/components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, humanize } from '../lead-generation/leadGenConstants';
import { getScoreTier, leadFullName, statusTone } from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import { LeadScoreDisplay } from './components/LeadCard';
import {
  AwardIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
} from '../../components/common/Icons';

export const LeadScoringPage: React.FC = () => {
  const { id: routeLeadId } = useParams<{ id?: string }>();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [score, setScore] = useState<number>(0);
  const [estimatedValue, setEstimatedValue] = useState<string>('0');
  const [breakdown, setBreakdown] = useState<Array<{ ruleName?: string; category?: string; points: number }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setScore(Number(lead.leadScore || 0));
    setEstimatedValue(String(lead.estimatedValue ?? 0));
    setBreakdown(Array.isArray(lead.scoringBreakdown) ? lead.scoringBreakdown : []);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, singleRes] = await Promise.all([
        leadService.getLeads({ limit: 50 }),
        routeLeadId ? leadService.getLeadById(routeLeadId).catch(() => null) : Promise.resolve(null),
      ]);
      const items = listRes.data || [];
      setLeads(items);

      const initial = singleRes || items.find((l) => l.id === routeLeadId) || items[0] || null;
      if (initial) selectLead(initial);
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads for scoring.');
    } finally {
      setIsLoading(false);
    }
  }, [routeLeadId, selectLead]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecalculate = async () => {
    if (!selectedLead) return;
    setIsCalculating(true);
    setError(null);
    try {
      const res = await leadGenerationService.recalculateLeadScore(selectedLead.id);
      const newScore = Number(res?.leadScore ?? res?.score ?? res?.lead?.leadScore ?? score);
      const newBreakdown = res?.breakdown || res?.matchedRules || res?.lead?.scoringBreakdown || [];
      setScore(newScore);
      if (Array.isArray(newBreakdown)) setBreakdown(newBreakdown);
      setSuccess(`Recalculated score for "${selectedLead.title}": ${newScore} points.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to recalculate lead score.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await leadService.updateLead(selectedLead.id, {
        leadScore: Math.max(0, Math.round(Number(score))),
        estimatedValue: Math.max(0, Number(estimatedValue || 0)),
      });
      setSelectedLead((prev) => (prev ? { ...prev, ...updated } : updated));
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updated } : l)));
      setSuccess(`Saved lead score (${updated.leadScore}) for "${selectedLead.title}".`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update lead score.');
    } finally {
      setIsSaving(false);
    }
  };

  const hotCount = leads.filter((l) => getScoreTier(l.leadScore).tier === 'HOT').length;
  const warmCount = leads.filter((l) => getScoreTier(l.leadScore).tier === 'WARM').length;
  const coldCount = leads.filter((l) => getScoreTier(l.leadScore).tier === 'COLD').length;
  const avgScore =
    leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + Number(l.leadScore || 0), 0) / leads.length)
      : 0;

  return (
    <LeadsLayout
      title={selectedLead ? `Lead Scoring — ${selectedLead.title}` : 'Lead Scoring'}
      subtitle="Inspect lead scores, adjust scores manually, or recalculate against automated scoring rules."
      icon={<AwardIcon size={22} />}
      activeLead={selectedLead}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <Link to="/lead-generation/scoring" className="auth-btn btn-secondary">
          <SparklesIcon size={15} />
          <span>Manage Scoring Rules</span>
        </Link>
      }
    >
      <div className="lg-stat-grid">
        <StatCard
          label="Average Score"
          value={`${avgScore} / 100`}
          hint="Across all visible leads"
          icon={<AwardIcon size={20} />}
          tone="amber"
        />
        <StatCard
          label="Hot Leads (70+)"
          value={hotCount}
          hint="High priority sales-ready"
          icon={<TrendingUpIcon size={20} />}
          tone="green"
        />
        <StatCard
          label="Warm Leads (40–69)"
          value={warmCount}
          hint="Active nurturing"
          icon={<TargetIcon size={20} />}
          tone="blue"
        />
        <StatCard
          label="Cold Leads (<40)"
          value={coldCount}
          hint="Early stage / low fit"
          icon={<TargetIcon size={20} />}
          tone="slate"
        />
      </div>

      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading lead scores..." />
        </div>
      ) : leads.length === 0 ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No leads found"
            description="Create a lead first to evaluate and manage lead scores."
            action={
              <Link to="/leads/create" className="auth-btn btn-primary">
                Create Lead
              </Link>
            }
          />
        </div>
      ) : (
        <div className="ld-workspace-split">
          {/* Left Lead List Sorted by Score */}
          <SectionCard
            title="Leads Ranked by Score"
            subtitle="Select a lead to adjust or recalculate score"
            className="ld-queue-panel"
          >
            <div className="ld-queue-list">
              {[...leads]
                .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
                .map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => selectLead(l)}
                    className={`ld-queue-item ${selectedLead?.id === l.id ? 'is-active' : ''}`}
                  >
                    <div className="ld-queue-item-top">
                      <strong>{l.title}</strong>
                      <LeadScoreDisplay score={l.leadScore} compact />
                    </div>
                    <div className="ld-queue-item-sub">
                      <span>{leadFullName(l)}</span>
                      <Badge tone={statusTone(l.status)}>{humanize(l.status)}</Badge>
                    </div>
                  </button>
                ))}
            </div>
          </SectionCard>

          {/* Right Score Workbench */}
          {selectedLead && (
            <SectionCard
              title={`Score Workbench — ${selectedLead.title}`}
              subtitle={`${leadFullName(selectedLead)} · ${
                selectedLead.companyName || selectedLead.email
              }`}
              actions={
                <button
                  type="button"
                  className="auth-btn btn-secondary"
                  onClick={handleRecalculate}
                  disabled={isCalculating}
                >
                  <SparklesIcon size={15} />
                  <span>{isCalculating ? 'Calculating...' : 'Recalculate from Rules'}</span>
                </button>
              }
            >
              <form className="ld-modal-stack" onSubmit={handleSaveScore}>
                <LeadScoreDisplay score={score} />

                <div className="lg-form-grid">
                  <Field
                    label={`Lead Score (${score} / 100)`}
                    htmlFor="workbench-score-range"
                    hint="Drag slider or enter exact score."
                  >
                    <div className="ld-score-slider-row">
                      <input
                        id="workbench-score-range"
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
                        className="lg-input ld-score-number-input"
                        value={score}
                        onChange={(e) => setScore(Math.max(0, Number(e.target.value)))}
                        aria-label="Numeric lead score"
                      />
                    </div>
                  </Field>

                  <Field
                    label="Estimated Deal Value (USD)"
                    htmlFor="workbench-value-input"
                    hint="Pipeline value contributes to firmographic scoring."
                  >
                    <input
                      id="workbench-value-input"
                      type="number"
                      min={0}
                      step="100"
                      className="lg-input"
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(e.target.value)}
                    />
                  </Field>
                </div>

                {/* Quick Score Presets */}
                <div className="ld-score-presets">
                  <span className="lg-label">Quick Score Presets:</span>
                  <button
                    type="button"
                    className="ld-shortcut-chip"
                    onClick={() => setScore(25)}
                  >
                    Cold (25)
                  </button>
                  <button
                    type="button"
                    className="ld-shortcut-chip"
                    onClick={() => setScore(55)}
                  >
                    Warm (55)
                  </button>
                  <button
                    type="button"
                    className="ld-shortcut-chip"
                    onClick={() => setScore(85)}
                  >
                    Hot (85)
                  </button>
                  <button
                    type="button"
                    className="ld-shortcut-chip"
                    onClick={() => setScore(95)}
                  >
                    Enterprise Fit (95)
                  </button>
                </div>

                {/* Rule Breakdown */}
                <div className="ld-breakdown-box">
                  <span className="lg-label">Scoring Rule Breakdown</span>
                  {breakdown.length === 0 ? (
                    <p className="lg-field-hint">
                      Click &ldquo;Recalculate from Rules&rdquo; above to evaluate active scoring
                      rules and view matched point contributions.
                    </p>
                  ) : (
                    <div className="ld-items-stack">
                      {breakdown.map((b, idx) => (
                        <div key={idx} className="ld-item-card">
                          <div className="ld-item-card-top">
                            <strong>{b.ruleName || `Rule #${idx + 1}`}</strong>
                            <Badge tone={b.points >= 0 ? 'green' : 'red'}>
                              {b.points >= 0 ? `+${b.points}` : b.points} pts
                            </Badge>
                          </div>
                          {b.category && <span className="lg-muted">{humanize(b.category)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg-form-actions">
                  <Link to={`/leads/${selectedLead.id}`} className="auth-btn btn-ghost">
                    View Lead Profile
                  </Link>
                  <PrimaryButton
                    type="submit"
                    fullWidth={false}
                    isLoading={isSaving}
                    loadingText="Saving..."
                  >
                    Save Score & Value
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
