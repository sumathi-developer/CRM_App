import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { dealService } from '../../services/deal.service';
import type { CreateDealPayload, UpdateDealPayload } from '../../types/deal.types';
import { DealsLayout } from './components/DealsLayout';
import { DealForm } from './components/DealForm';
import { ArrowLeftIcon } from '../../components/common/Icons';

export const CreateDealPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPipelineId = searchParams.get('pipelineId') || undefined;
  const preselectedStageId = searchParams.get('stageId') || undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (payload: CreateDealPayload | UpdateDealPayload) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const created = await dealService.createDeal(payload as CreateDealPayload);
      navigate(`/deals/${created.id}`);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to create deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DealsLayout
      title="Create Deal"
      subtitle="Create a new revenue opportunity and assign it to a sales pipeline stage."
      actions={
        <Link to="/deals" className="auth-btn btn-secondary btn-size-small">
          <ArrowLeftIcon size={15} /> Back to Deals
        </Link>
      }
    >
      <DealForm
        mode="create"
        preselectedPipelineId={preselectedPipelineId}
        preselectedStageId={preselectedStageId}
        isSubmitting={isSubmitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/deals')}
      />
    </DealsLayout>
  );
};

export default CreateDealPage;

