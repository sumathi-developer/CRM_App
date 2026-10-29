import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pipelineService } from '../../services/pipeline.service';
import type {
  Pipeline,
  PipelineDeal,
  PipelineStage,
} from '../../types/pipeline.types';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { Field, FormModal } from '../lead-generation/components/FormParts';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { formatCurrency } from '../lead-generation/leadGenConstants';
import {
  DEFAULT_STARTER_STAGES,
  STAGE_COLOR_PRESETS,
  getPipelinePermissions,
  summarizeStageDeals,
} from './pipelineConstants';
import { PipelinesLayout } from './components/PipelinesLayout';
import { StageProbabilityBadge } from './components/PipelineDealComponents';
import {
  ArrowLeftIcon,
  AwardIcon,
  EditIcon,
  PlusIcon,
  SlidersIcon,
  TrendingUpIcon,
} from '../../components/common/Icons';

export const StageManagementPage: React.FC = () => {
  const { id: routePipelineId } = useParams<{ id?: string }>();
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const permissions = useMemo(() => getPipelinePermissions(currentUser), [currentUser]);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add / Edit Stage Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [stageName, setStageName] = useState('');
  const [stageOrder, setStageOrder] = useState<number>(1);
  const [stageProb, setStageProb] = useState<number>(20);
  const [stageColor, setStageColor] = useState('#3b82f6');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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
        pipelineService.setSavedPipelineId(targetId);
      } catch (err: any) {
        setError(err?.message || 'Failed to load pipeline stages.');
      } finally {
        setIsLoading(false);
      }
    },
    [routePipelineId],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateStageModal = () => {
    const nextOrder =
      stages.length > 0 ? Math.max(...stages.map((s) => s.order)) + 1 : 1;
    setEditingStage(null);
    setStageName('');
    setStageOrder(nextOrder);
    setStageProb(Math.min(100, nextOrder * 20));
    setStageColor(STAGE_COLOR_PRESETS[nextOrder % STAGE_COLOR_PRESETS.length].value);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditStageModal = (stage: PipelineStage) => {
    setEditingStage(stage);
    setStageName(stage.name);
    setStageOrder(stage.order);
    setStageProb(stage.winProbability ?? 10);
    setStageColor(stage.color || '#3b82f6');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveStage = async () => {
    if (!activePipeline) return;
    if (!stageName.trim()) {
      setModalError('Stage name is required.');
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      const payload = {
        name: stageName.trim(),
        order: Math.max(1, Math.round(Number(stageOrder) || 1)),
        winProbability: Math.max(0, Math.min(100, Math.round(Number(stageProb) || 0))),
        color: stageColor || '#3b82f6',
      };

      if (editingStage) {
        await pipelineService.updateStage(activePipeline.id, editingStage.id, payload);
        setSuccess(`Updated stage "${payload.name}".`);
      } else {
        await pipelineService.createStage(activePipeline.id, payload);
        setSuccess(`Added stage "${payload.name}" to "${activePipeline.name}".`);
      }
      setIsModalOpen(false);
      await loadData(activePipeline.id);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save stage.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveStageOrder = async (stage: PipelineStage, direction: 'up' | 'down') => {
    if (!activePipeline || !permissions.canManagePipelines) return;
    const idx = stages.findIndex((s) => s.id === stage.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= stages.length) return;

    const neighbor = stages[swapIdx];
    setError(null);
    try {
      await Promise.all([
        pipelineService.updateStage(activePipeline.id, stage.id, {
          order: neighbor.order,
        }),
        pipelineService.updateStage(activePipeline.id, neighbor.id, {
          order: stage.order,
        }),
      ]);
      setSuccess(`Reordered stage "${stage.name}".`);
      await loadData(activePipeline.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to reorder stages.');
    }
  };

  const handleSeedStarterStages = async () => {
    if (!activePipeline || !permissions.canManagePipelines) return;
    setError(null);
    try {
      for (const st of DEFAULT_STARTER_STAGES) {
        await pipelineService.createStage(activePipeline.id, st);
      }
      setSuccess(
        `Seeded ${DEFAULT_STARTER_STAGES.length} standard stages for "${activePipeline.name}".`,
      );
      await loadData(activePipeline.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to seed starter stages.');
    }
  };

  const isStagesOverviewRoute = location.pathname.endsWith('/stages');

  return (
    <PipelinesLayout
      title={
        isStagesOverviewRoute
          ? `Pipeline Stages${activePipeline ? ` — ${activePipeline.name}` : ''}`
          : `Stage Management${activePipeline ? ` — ${activePipeline.name}` : ''}`
      }
      subtitle="Add, edit, color-code, and reorder sales pipeline stages and win probabilities."
      icon={<SlidersIcon size={22} />}
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
            <Link
              to={`/pipelines/${activePipeline.id}/probability`}
              className="auth-btn btn-secondary"
            >
              <AwardIcon size={15} />
              <span>Configure Probabilities</span>
            </Link>
            <button
              type="button"
              className="auth-btn btn-primary"
              onClick={openCreateStageModal}
              id="btn-add-pipeline-stage"
            >
              <PlusIcon size={15} />
              <span>Add Stage</span>
            </button>
          </>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading pipeline stages..." />
        </div>
      ) : !activePipeline ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No Pipeline Selected"
            description="Create or select a pipeline to configure its stages."
            action={
              <Link to="/pipelines/create" className="auth-btn btn-primary">
                Create Pipeline
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <section className="lg-stats-grid">
            <StatCard
              label="Configured Stages"
              value={stages.length}
              hint={`In ${activePipeline.name}`}
              tone="blue"
              icon={<SlidersIcon size={18} />}
            />
            <StatCard
              label="Deals in Pipeline"
              value={deals.length}
              hint="Distributed across stages"
              tone="green"
              icon={<TrendingUpIcon size={18} />}
            />
            <StatCard
              label="Highest Stage Probability"
              value={`${
                stages.length > 0 ? Math.max(...stages.map((s) => s.winProbability)) : 0
              }%`}
              hint="Closing stage win rate"
              tone="purple"
              icon={<AwardIcon size={18} />}
            />
          </section>

          <SectionCard
            title={`Ordered Pipeline Stages (${stages.length})`}
            subtitle="Stages are displayed left-to-right on the Pipeline Board according to their order number."
            actions={
              permissions.canManagePipelines ? (
                <div className="lg-badge-row">
                  {stages.length === 0 && (
                    <button
                      type="button"
                      className="auth-btn btn-secondary"
                      onClick={handleSeedStarterStages}
                    >
                      Seed 5 Standard Stages
                    </button>
                  )}
                  <button
                    type="button"
                    className="auth-btn btn-primary"
                    onClick={openCreateStageModal}
                  >
                    <PlusIcon size={15} />
                    <span>Add Stage</span>
                  </button>
                </div>
              ) : undefined
            }
          >
            {stages.length === 0 ? (
              <EmptyState
                title="No stages in this pipeline yet"
                description="Add stages manually or seed the 5 standard B2B sales stages."
                action={
                  permissions.canManagePipelines ? (
                    <div className="lg-badge-row">
                      <button
                        type="button"
                        className="auth-btn btn-secondary"
                        onClick={handleSeedStarterStages}
                      >
                        Seed Standard Stages
                      </button>
                      <button
                        type="button"
                        className="auth-btn btn-primary"
                        onClick={openCreateStageModal}
                      >
                        <PlusIcon size={15} />
                        <span>Add First Stage</span>
                      </button>
                    </div>
                  ) : undefined
                }
              />
            ) : (
              <div className="ld-items-stack">
                {stages.map((stage, idx) => {
                  const { stageDeals, totalValue, weightedValue } = summarizeStageDeals(
                    stage,
                    deals,
                  );

                  return (
                    <div
                      key={stage.id}
                      className="ld-subcard"
                      style={{
                        borderLeft: stage.color ? `4px solid ${stage.color}` : undefined,
                      }}
                    >
                      <div className="ld-subcard-top">
                        <div className="lg-badge-row">
                          <Badge tone="blue">Order #{stage.order}</Badge>
                          <strong>{stage.name}</strong>
                          <Badge tone="slate">
                            {stageDeals.length} deal{stageDeals.length === 1 ? '' : 's'}
                          </Badge>
                        </div>

                        <div className="lg-row-actions">
                          <StageProbabilityBadge
                            probability={stage.winProbability}
                            showBar
                            color={stage.color}
                          />

                          {permissions.canManagePipelines && (
                            <>
                              <button
                                type="button"
                                className="auth-btn btn-secondary btn-size-small"
                                disabled={idx === 0}
                                onClick={() => handleMoveStageOrder(stage, 'up')}
                                title="Move stage earlier"
                              >
                                ↑ Up
                              </button>
                              <button
                                type="button"
                                className="auth-btn btn-secondary btn-size-small"
                                disabled={idx === stages.length - 1}
                                onClick={() => handleMoveStageOrder(stage, 'down')}
                                title="Move stage later"
                              >
                                ↓ Down
                              </button>
                              <button
                                type="button"
                                className="lg-icon-btn"
                                onClick={() => openEditStageModal(stage)}
                                title="Edit Stage"
                              >
                                <EditIcon size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="ld-subcard-meta">
                        <span>Total Value: {formatCurrency(totalValue)}</span>
                        <span>·</span>
                        <span>Weighted Forecast: {formatCurrency(weightedValue)}</span>
                        <span>·</span>
                        <span>Color: {stage.color || '#3b82f6'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </>
      )}

      {/* Create / Edit Stage Modal */}
      <FormModal
        isOpen={isModalOpen}
        title={editingStage ? `Edit Stage — ${editingStage.name}` : 'Add Pipeline Stage'}
        subtitle={
          activePipeline
            ? `Pipeline: ${activePipeline.name}`
            : 'Configure stage name, display order, win probability, and color.'
        }
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveStage}
        submitLabel={editingStage ? 'Save Stage Changes' : 'Create Stage'}
        isSaving={isSaving}
        error={modalError}
      >
        <div className="lg-form-grid">
          <Field label="Stage Name" htmlFor="stage-modal-name" required className="lg-span-2">
            <input
              id="stage-modal-name"
              className="lg-input"
              placeholder="e.g. Technical Evaluation"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
            />
          </Field>

          <Field
            label="Stage Order (Position)"
            htmlFor="stage-modal-order"
            required
            hint="1 = leftmost column on the Pipeline Board"
          >
            <input
              id="stage-modal-order"
              type="number"
              min={1}
              className="lg-input"
              value={stageOrder}
              onChange={(e) => setStageOrder(Number(e.target.value) || 1)}
            />
          </Field>

          <Field
            label={`Win Probability (${stageProb}%)`}
            htmlFor="stage-modal-prob"
            required
            hint="0% = Lost, 100% = Won"
          >
            <input
              id="stage-modal-prob"
              type="number"
              min={0}
              max={100}
              className="lg-input"
              value={stageProb}
              onChange={(e) =>
                setStageProb(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
              }
            />
          </Field>

          <Field
            label="Probability Slider"
            htmlFor="stage-modal-prob-range"
            className="lg-span-2"
          >
            <input
              id="stage-modal-prob-range"
              type="range"
              min={0}
              max={100}
              step={5}
              value={stageProb}
              onChange={(e) => setStageProb(Number(e.target.value))}
            />
          </Field>

          <Field label="Stage Color" htmlFor="stage-modal-color" className="lg-span-2">
            <select
              id="stage-modal-color"
              className="lg-select"
              value={stageColor}
              onChange={(e) => setStageColor(e.target.value)}
            >
              {STAGE_COLOR_PRESETS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormModal>
    </PipelinesLayout>
  );
};

