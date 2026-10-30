import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pipelineService } from '../../services/pipeline.service';
import type { Pipeline } from '../../types/pipeline.types';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { formatDate } from '../lead-generation/leadGenConstants';
import { getPipelinePermissions, probabilityTone } from './pipelineConstants';
import { PipelinesLayout } from './components/PipelinesLayout';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  EditIcon,
  PlusIcon,
  SlidersIcon,
  TrashIcon,
  TrendingUpIcon,
} from '../../components/common/Icons';

export const PipelineSelectorPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const permissions = useMemo(() => getPipelinePermissions(currentUser), [currentUser]);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [savedPipelineId, setSavedPipelineId] = useState(
    () => pipelineService.getSavedPipelineId(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPipelines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await pipelineService.getPipelines();
      setPipelines(list);
      if (!savedPipelineId && list.length > 0) {
        const def = list.find((p) => p.isDefault) || list[0];
        setSavedPipelineId(def.id);
        pipelineService.setSavedPipelineId(def.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load pipelines.');
    } finally {
      setIsLoading(false);
    }
  }, [savedPipelineId]);

  useEffect(() => {
    loadPipelines();
  }, [loadPipelines]);

  const handleSelectActive = (pipeline: Pipeline, openView?: string) => {
    setSavedPipelineId(pipeline.id);
    pipelineService.setSavedPipelineId(pipeline.id);
    setSuccess(`Selected "${pipeline.name}" as your active sales pipeline.`);
    if (openView) {
      navigate(`/pipelines/${pipeline.id}/${openView}`);
    }
  };

  const handleSetDefault = async (pipeline: Pipeline) => {
    if (!permissions.canManagePipelines || pipeline.isDefault) return;
    setError(null);
    try {
      await pipelineService.updatePipeline(pipeline.id, { isDefault: true });
      setSuccess(`Set "${pipeline.name}" as the workspace default pipeline.`);
      await loadPipelines();
    } catch (err: any) {
      setError(err?.message || 'Failed to update default pipeline.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pipelineToDelete || !permissions.canDeletePipelines) return;
    setIsDeleting(true);
    setError(null);
    try {
      await pipelineService.deletePipeline(pipelineToDelete.id);
      setSuccess(`Deleted pipeline "${pipelineToDelete.name}".`);
      setPipelineToDelete(null);
      await loadPipelines();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete pipeline.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalStagesCount = useMemo(
    () => pipelines.reduce((sum, p) => sum + (p.stages?.length ?? 0), 0),
    [pipelines],
  );

  const totalDealsCount = useMemo(
    () => pipelines.reduce((sum, p) => sum + (p._count?.deals ?? 0), 0),
    [pipelines],
  );

  return (
    <PipelinesLayout
      title="Pipeline Selector"
      subtitle="Compare all sales pipelines, inspect ordered stage progressions, switch your active pipeline, or set the default pipeline."
      icon={<TrendingUpIcon size={22} />}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        permissions.canManagePipelines ? (
          <Link to="/pipelines/create" className="auth-btn btn-primary">
            <PlusIcon size={16} />
            <span>Create Pipeline</span>
          </Link>
        ) : undefined
      }
    >
      <section className="lg-stats-grid">
        <StatCard
          label="Configured Pipelines"
          value={pipelines.length}
          hint="Available sales workflows"
          tone="blue"
          icon={<TrendingUpIcon size={18} />}
        />
        <StatCard
          label="Total Pipeline Stages"
          value={totalStagesCount}
          hint="Across all pipelines"
          tone="purple"
          icon={<SlidersIcon size={18} />}
        />
        <StatCard
          label="Tracked Deals"
          value={totalDealsCount}
          hint="Linked to pipelines"
          tone="green"
          icon={<CheckCircleIcon size={18} />}
        />
      </section>

      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading sales pipelines..." />
        </div>
      ) : pipelines.length === 0 ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No Sales Pipelines Available"
            description="Create a sales pipeline to organize deals by stage and probability."
            action={
              permissions.canManagePipelines ? (
                <Link to="/pipelines/create" className="auth-btn btn-primary">
                  <PlusIcon size={16} />
                  <span>Create Pipeline</span>
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="ld-items-stack">
          {pipelines.map((pipeline) => {
            const isSelected = savedPipelineId === pipeline.id;
            const stages = pipeline.stages || [];

            return (
              <SectionCard
                key={pipeline.id}
                title={pipeline.name}
                subtitle={
                  pipeline.description ||
                  `Created ${formatDate(pipeline.createdAt)} · ${stages.length} stage(s)`
                }
                actions={
                  <div className="lg-badge-row">
                    {pipeline.isDefault && <Badge tone="green">Default Pipeline</Badge>}
                    {isSelected && <Badge tone="blue">Currently Active</Badge>}
                    <Badge tone="slate">{pipeline._count?.deals ?? 0} Deals</Badge>
                  </div>
                }
              >
                {/* Ordered Stage Pills */}
                {stages.length === 0 ? (
                  <p className="lg-muted">No stages configured yet for this pipeline.</p>
                ) : (
                  <div className="ld-qual-pipeline">
                    {stages.map((st) => (
                      <div
                        key={st.id}
                        className={`ld-qual-step tone-${probabilityTone(st.winProbability)}`}
                        style={{
                          borderLeft: st.color ? `4px solid ${st.color}` : undefined,
                        }}
                      >
                        <span className="ld-qual-step-index">{st.order}</span>
                        <div className="ld-qual-step-text">
                          <strong>{st.name}</strong>
                          <span>Win Probability: {st.winProbability}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="ld-card-footer">
                  <div className="lg-badge-row">
                    <button
                      type="button"
                      className={`auth-btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleSelectActive(pipeline, 'board')}
                    >
                      <ArrowRightIcon size={14} />
                      <span>Open Board</span>
                    </button>
                    <button
                      type="button"
                      className="auth-btn btn-secondary"
                      onClick={() => handleSelectActive(pipeline, 'list')}
                    >
                      <span>Open List</span>
                    </button>
                    <button
                      type="button"
                      className="auth-btn btn-secondary"
                      onClick={() => handleSelectActive(pipeline, 'table')}
                    >
                      <span>Open Table</span>
                    </button>
                  </div>

                  <div className="lg-row-actions">
                    {permissions.canManagePipelines && !pipeline.isDefault && (
                      <button
                        type="button"
                        className="auth-btn btn-secondary"
                        onClick={() => handleSetDefault(pipeline)}
                      >
                        Set as Default
                      </button>
                    )}
                    <Link
                      to={`/pipelines/${pipeline.id}/stage-management`}
                      className="auth-btn btn-secondary"
                    >
                      <SlidersIcon size={14} />
                      <span>Stages ({stages.length})</span>
                    </Link>
                    <Link
                      to={`/pipelines/${pipeline.id}/probability`}
                      className="auth-btn btn-secondary"
                    >
                      <span>Probabilities</span>
                    </Link>
                    {permissions.canManagePipelines && (
                      <Link
                        to={`/pipelines/${pipeline.id}/edit`}
                        className="lg-icon-btn"
                        title="Edit Pipeline"
                      >
                        <EditIcon size={15} />
                      </Link>
                    )}
                    {permissions.canDeletePipelines && (
                      <button
                        type="button"
                        className="lg-icon-btn danger"
                        title="Delete Pipeline"
                        onClick={() => setPipelineToDelete(pipeline)}
                      >
                        <TrashIcon size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pipelineToDelete)}
        title="Delete Sales Pipeline"
        message={`Are you sure you want to permanently delete pipeline "${pipelineToDelete?.name}" and its stages?`}
        confirmLabel="Delete Pipeline"
        onConfirm={handleConfirmDelete}
        onClose={() => setPipelineToDelete(null)}
        isLoading={isDeleting}
      />
    </PipelinesLayout>
  );
};

