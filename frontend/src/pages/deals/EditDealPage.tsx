import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { dealService } from '../../services/deal.service';
import type { Deal, UpdateDealPayload } from '../../types/deal.types';
import { DealsLayout } from './components/DealsLayout';
import { DealForm } from './components/DealForm';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { ArrowLeftIcon } from '../../components/common/Icons';

export const EditDealPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const loadDeal = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await dealService.getDealById(id);
      setDeal(data);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load deal details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDeal();
  }, [loadDeal]);

  const handleSubmit = async (payload: UpdateDealPayload) => {
    if (!id) return;
    setIsSubmitting(true);
    setServerError(null);
    try {
      await dealService.updateDeal(id, payload);
      navigate(`/deals/${id}`);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to update deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DealsLayout
      title={deal ? `Edit Deal — ${deal.title}` : 'Edit Deal'}
      subtitle="Update deal valuation, pipeline stage, win probability, expected close date, or linked account."
      activeDeal={deal}
      error={loadError}
      onDismissError={() => setLoadError(null)}
      actions={
        <Link
          to={id ? `/deals/${id}` : '/deals'}
          className="auth-btn btn-secondary btn-size-small"
        >
          <ArrowLeftIcon size={15} /> Back to Deal Details
        </Link>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading deal record..." />
        </div>
      ) : !deal ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Deal Not Found"
            description="The deal you are trying to edit could not be found."
            action={
              <Link to="/deals" className="auth-btn btn-primary">
                Return to All Deals
              </Link>
            }
          />
        </div>
      ) : (
        <DealForm
          mode="edit"
          initialDeal={deal}
          isSubmitting={isSubmitting}
          serverError={serverError}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/deals/${deal.id}`)}
        />
      )}
    </DealsLayout>
  );
};

export default EditDealPage;
