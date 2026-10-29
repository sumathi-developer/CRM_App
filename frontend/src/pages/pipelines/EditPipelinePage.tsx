import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pipelineService } from '../../services/pipeline.service';
import type { CreatePipelinePayload, Pipeline } from '../../types/pipeline.types';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { getPipelinePermissions } from './pipelineConstants';
import { PipelinesLayout } from './components/PipelinesLayout';
import { PipelineForm } from './components/PipelineForm';
import { ArrowLeftIcon, EditIcon, SlidersIcon } from '../../components/common/Icons';

export const EditPipelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const permissions = useMemo(() => getPipelinePermissions(currentUser), [currentUser]);

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);

  const loadPipeline = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await pipelineService.getPipelineById(id);
      setPipeline(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load pipeline details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  const handleUpdate = async (payload: CreatePipelinePayload) => {
    if (!id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await pipelineService.updatePipeline(id, payload);
      navigate(`/pipelines/${updated.id}/board`, {
        state: { flash: `Pipeline "${updated.name}" updated successfully.` },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to update pipeline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PipelinesLayout
      title={pipeline ? `Edit Pipeline — ${pipeline.name}` : 'Edit Pipeline'}
      subtitle="Update pipeline name, description, and default pipeline status."
      icon={<EditIcon size={22} />}
      activePipeline={pipeline}
      error={error}
      onDismissError={() => setError(null)}
      breadcrumbs={
        <Link to={id ? `/pipelines/${id}/board` : '/pipelines'} className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to Pipeline Board
        </Link>
      }
      actions={
        pipeline && (
          <Link
            to={`/pipelines/${pipeline.id}/stage-management`}
            className="auth-btn btn-secondary"
          >
            <SlidersIcon size={15} />
            <span>Manage Stages ({pipeline.stages?.length ?? 0})</span>
          </Link>
        )
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading pipeline..." />
        </div>
      ) : !pipeline ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Pipeline Not Found"
            description="The pipeline you are trying to edit could not be found."
            action={
              <Link to="/pipelines" className="auth-btn btn-primary">
                Return to Pipelines
              </Link>
            }
          />
        </div>
      ) : !permissions.canManagePipelines ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Insufficient Permissions"
            description="Your role does not have permission to edit sales pipelines."
          />
        </div>
      ) : (
        <PipelineForm
          initialPipeline={pipeline}
          includeInitialStages={false}
          isSubmitting={isSubmitting}
          submitLabel="Save Pipeline Changes"
          cancelPath={`/pipelines/${pipeline.id}/board`}
          onSubmit={handleUpdate}
        />
      )}
    </PipelinesLayout>
  );
};

