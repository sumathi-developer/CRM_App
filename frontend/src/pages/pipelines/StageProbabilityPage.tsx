import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pipelineService } from '../../services/pipeline.service';
import type {
  Pipeline,
  PipelineDeal,
  PipelineStage,
} from '../../types/pipeline.types';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { formatCurrency } from '../lead-generation/leadGenConstants';
import {
  PROBABILITY_PRESETS,
  getPipelinePermissions,
  probabilityTone,
} from './pipelineConstants';
import { PipelinesLayout } from './components/PipelinesLayout';
import {
  ArrowLeftIcon,
  AwardIcon,
  DollarSignIcon,
  SlidersIcon,
  TrendingUpIcon,
} from '../../components/common/Icons';

export const StageProbabilityPage: React.FC = () => {
  const { id: routePipelineId } = useParams<{ id?: string }>();
  const { user: currentUser } = useAuth();
  const permissions = useMemo(() => getPipelinePermissions(currentUser), [currentUser]);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [draftProbabilities, setDraftProbabilities] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingStageId, setSavingStageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(
    async (preferredId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const allPipelines = await pipelineService.getPipelines();
        setPipelines(allPipelines);

        const targetId =
          preferredId ||
          routePipelineId ||
          pipelineService.getSavedPipelineId() ||
          allPipelines.find((p) => p.isDefault)?.id ||
          allPipelines[0]?.id ||
          '';

        if (!targetId) {
          setActivePipeline(null);
          setStages([]);
          setDeals([]);
          return;
        }

        const [pipelineData, stagesData, dealsRes] = await Promise.all([
          pipelineService.getPipelineById(targetId),
          pipelineService.getStages(targetId),
          pipelineService.getDeals({ pipelineId: targetId, limit: 100 }),
        ]);

        setActivePipeline(pipelineData);
        setStages(stagesData);
        setDeals(dealsRes.data || []);
        const map: Record<string, number> = {};
        stagesData.forEach((st) => {
          map[st.id] = st.winProbability ?? 10;
        });
        setDraftProbabilities(map);
        pipelineService.setSavedPipelineId(targetId);
      } catch (err: any) {
        setError(err?.message || 'Failed to load stage probabilities.');
      } finally {
        setIsLoading(false);
      }
    },
    [routePipelineId],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDraftChange = (stageId: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setDraftProbabilities((prev) => ({
      ...prev,
      [stageId]: clamped,
    }));
  };

  const handleSaveSingleStage = async (stage: PipelineStage) => {
    if (!activePipeline || !permissions.canManagePipelines) return;
    const nextProb = draftProbabilities[stage.id] ?? stage.winProbability;
    setSavingStageId(stage.id);
    setError(null);
    try {
      await pipelineService.updateStage(activePipeline.id, stage.id, {
        winProbability: nextProb,
      });
      setSuccess(`Updated "${stage.name}" win probability to ${nextProb}%.`);
      await loadData(activePipeline.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to update stage probability.');
    } finally {
      setSavingStageId(null);
    }
  };

  const handleSaveAllProbabilities = async () => {
    if (!activePipeline || !permissions.canManagePipelines) return;
    setIsSavingAll(true);
    setError(null);
    try {
      const changedStages = stages.filter(
        (st) => (draftProbabilities[st.id] ?? st.winProbability) !== st.winProbability,
      );
      for (const st of changedStages) {
        await pipelineService.updateStage(activePipeline.id, st.id, {
          winProbability: draftProbabilities[st.id],
        });
      }
      setSuccess(
        changedStages.length > 0
          ? `Saved win probability updates for ${changedStages.length} stage(s).`
          : 'All stage probabilities are up to date.',
      );
      await loadData(activePipeline.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to save stage probabilities.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const applyLinearDistribution = () => {
    if (stages.length === 0) return;
    const next: Record<string, number> = {};
    stages.forEach((st, idx) => {
      if (stages.length === 1) {
        next[st.id] = 50;
      } else {
        next[st.id] = Math.round(((idx + 1) / stages.length) * 100);
      }
    });
    setDraftProbabilities(next);
  };

  // Live revenue forecast calculations using draft probabilities
  const forecastSummary = useMemo(() => {
    const totalUnweighted = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const currentWeighted = deals.reduce((sum, d) => {
      const st = stages.find((s) => s.id === d.stageId);
      const prob = st?.winProbability ?? d.probability ?? 0;
      return sum + Math.round((Number(d.value) || 0) * (prob / 100));
    }, 0);
    const projectedWeighted = deals.reduce((sum, d) => {
      const prob = draftProbabilities[d.stageId || ''] ?? d.probability ?? 0;
      return sum + Math.round((Number(d.value) || 0) * (prob / 100));
    }, 0);
    return { totalUnweighted, currentWeighted, projectedWeighted };
  }, [deals, stages, draftProbabilities]);

  return (
    <PipelinesLayout
      title={
        activePipeline
          ? `Stage Probability — ${activePipeline.name}`
          : 'Stage Probability'
      }
      subtitle="Calibrate win probability percentages for each pipeline stage and preview live weighted revenue forecasts."
      icon={<AwardIcon size={22} />}
      activePipeline={activePipeline}
      pipelines={pipelines}
      onSelectPipelineId={(newId) => loadData(newId)}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link
          to={activePipeline ? `/pipelines/${activePipeline.id}/board` : '/pipelines'}
          className="lg-link-btn"
        >
          <ArrowLeftIcon size={14} /> Back to Pipeline Board
        </Link>
      }
      actions={
        activePipeline && permissions.canManagePipelines ? (
          <>
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={applyLinearDistribution}
            >
              Auto-Distribute Evenly
            </button>
            <div className="ld-submit-btn-wrap">
              <PrimaryButton
                type="button"
                isLoading={isSavingAll}
                onClick={handleSaveAllProbabilities}
              >
                Save All Probabilities
              </PrimaryButton>
            </div>
          </>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading stage probabilities..." />
        </div>
      ) : !activePipeline ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No Pipeline Selected"
            description="Create or select a pipeline to configure stage probabilities."
          />
        </div>
      ) : (
        <>
          <section className="lg-stats-grid">
            <StatCard
              label="Total Unweighted Pipeline"
              value={formatCurrency(forecastSummary.totalUnweighted)}
              hint={`${deals.length} active deal(s)`}
              tone="blue"
              icon={<DollarSignIcon size={18} />}
            />
            <StatCard
              label="Saved Weighted Forecast"
              value={formatCurrency(forecastSummary.currentWeighted)}
              hint="Based on saved probabilities"
              tone="slate"
              icon={<TrendingUpIcon size={18} />}
            />
            <StatCard
              label="Projected Weighted Forecast"
              value={formatCurrency(forecastSummary.projectedWeighted)}
              hint="Live preview with slider changes"
              tone="green"
              icon={<AwardIcon size={18} />}
            />
          </section>

          <SectionCard
            title="Stage Win Probability Controls"
            subtitle="Adjust the win probability slider (0%–100%) or select a preset for each stage."
            actions={
              <Link
                to={`/pipelines/${activePipeline.id}/stage-management`}
                className="auth-btn btn-secondary"
              >
                <SlidersIcon size={14} />
                <span>Add / Reorder Stages</span>
              </Link>
            }
          >
            {stages.length === 0 ? (
              <EmptyState
                title="No stages in this pipeline"
                description="Add stages in Stage Management first to configure probabilities."
                action={
                  <Link
                    to={`/pipelines/${activePipeline.id}/stage-management`}
                    className="auth-btn btn-primary"
                  >
                    Go to Stage Management
                  </Link>
                }
              />
            ) : (
              <div className="ld-items-stack">
                {stages.map((stage) => {
                  const draftVal = draftProbabilities[stage.id] ?? stage.winProbability;
                  const stageDeals = deals.filter((d) => d.stageId === stage.id);
                  const stageTotal = stageDeals.reduce(
                    (sum, d) => sum + (Number(d.value) || 0),
                    0,
                  );
                  const stageWeighted = Math.round(stageTotal * (draftVal / 100));
                  const isDirty = draftVal !== stage.winProbability;

                  return (
                    <div key={stage.id} className="ld-subcard">
                      <div className="ld-subcard-top">
                        <div className="lg-badge-row">
                          <Badge tone="blue">Stage #{stage.order}</Badge>
                          <strong>{stage.name}</strong>
                          <Badge tone={probabilityTone(draftVal)}>
                            {draftVal}% Win Probability
                          </Badge>
                          {isDirty && <Badge tone="amber">Unsaved Change</Badge>}
                        </div>

                        {permissions.canManagePipelines && (
                          <button
                            type="button"
                            className="auth-btn btn-secondary btn-size-small"
                            disabled={!isDirty || savingStageId === stage.id}
                            onClick={() => handleSaveSingleStage(stage)}
                          >
                            {savingStageId === stage.id ? 'Saving...' : 'Save Stage'}
                          </button>
                        )}
                      </div>

                      <div className="lg-form-grid">
                        <div className="lg-span-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            disabled={!permissions.canManagePipelines}
                            value={draftVal}
                            onChange={(e) =>
                              handleDraftChange(stage.id, Number(e.target.value))
                            }
                            aria-label={`Win probability slider for ${stage.name}`}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      <div className="lg-badge-row">
                        {PROBABILITY_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            disabled={!permissions.canManagePipelines}
                            className={`ld-pill-tab ${
                              draftVal === preset.value ? 'is-active' : ''
                            }`}
                            onClick={() => handleDraftChange(stage.id, preset.value)}
                            title={preset.desc}
                          >
                            {preset.value}%
                          </button>
                        ))}
                      </div>

                      <div className="ld-subcard-meta">
                        <span>{stageDeals.length} deal(s) in stage</span>
                        <span>·</span>
                        <span>Unweighted: {formatCurrency(stageTotal)}</span>
                        <span>·</span>
                        <strong>Projected Weighted: {formatCurrency(stageWeighted)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </PipelinesLayout>
  );
};

