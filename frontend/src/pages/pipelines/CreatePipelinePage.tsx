import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pipelineService } from '../../services/pipeline.service';
import type {
  CreatePipelinePayload,
  CreatePipelineStagePayload,
} from '../../types/pipeline.types';
import { EmptyState } from '../../components/common/EmptyState';
import { getPipelinePermissions } from './pipelineConstants';
import { PipelinesLayout } from './components/PipelinesLayout';
import { PipelineForm } from './components/PipelineForm';
import { ArrowLeftIcon, PlusIcon } from '../../components/common/Icons';

export const CreatePipelinePage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const permissions = useMemo(() => getPipelinePermissions(currentUser), [currentUser]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);

  const handleCreate = async (
    payload: CreatePipelinePayload,
    initialStages: CreatePipelineStagePayload[],
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await pipelineService.createPipeline(payload);
      // Create initial stages sequentially in order
      for (const stagePayload of initialStages) {
        await pipelineService.createStage(created.id, stagePayload);
      }
      pipelineService.setSavedPipelineId(created.id);
      navigate(`/pipelines/${created.id}/board`, {
        state: {
          flash: `Pipeline "${created.name}" created with ${initialStages.length} stage(s).`,
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to create pipeline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PipelinesLayout
      title="Create Pipeline"
      subtitle="Create a new sales pipeline and optionally initialize its ordered stages and win probabilities."
      icon={<PlusIcon size={22} />}
      error={error}
      onDismissError={() => setError(null)}
      breadcrumbs={
        <Link to="/pipelines" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to Pipeline Overview
        </Link>
      }
    >
      {!permissions.canManagePipelines ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Insufficient Permissions"
            description="Your role does not have permission to create sales pipelines."
            action={
              <Link to="/pipelines" className="auth-btn btn-secondary">
                Return to Pipelines
              </Link>
            }
          />
        </div>
      ) : (
        <PipelineForm
          includeInitialStages
          isSubmitting={isSubmitting}
          submitLabel="Create Sales Pipeline"
          cancelPath="/pipelines"
          onSubmit={handleCreate}
        />
      )}
    </PipelinesLayout>
  );
};

