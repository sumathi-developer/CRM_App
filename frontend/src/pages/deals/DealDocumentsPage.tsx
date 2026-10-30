import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { dealService } from '../../services/deal.service';
import type { Deal } from '../../types/deal.types';
import { DealsLayout } from './components/DealsLayout';
import { DealDocumentsSection } from './components/DealSubsections';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency } from '../lead-generation/leadGenConstants';
import { ArrowLeftIcon } from '../../components/common/Icons';

export const DealDocumentsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string>(id || '');
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dealsRes = await dealService.getDeals({ limit: 100 });
      const list: Deal[] = Array.isArray(dealsRes?.data) ? dealsRes.data : [];
      setDeals(list);

      const targetId = id || selectedDealId || list[0]?.id || '';
      setSelectedDealId(targetId);

      if (targetId) {
        const found =
          list.find((d: Deal) => d.id === targetId) ||
          (await dealService.getDealById(targetId).catch(() => null));
        setActiveDeal(found);
      } else {
        setActiveDeal(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load deal documents workspace.');
    } finally {
      setIsLoading(false);
    }
  }, [id, selectedDealId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleDealSelectChange = (nextDealId: string) => {
    setSelectedDealId(nextDealId);
    const found = deals.find((d) => d.id === nextDealId) || null;
    setActiveDeal(found);
    if (id && nextDealId) {
      navigate(`/deals/${nextDealId}/documents`);
    }
  };

  return (
    <DealsLayout
      title={
        activeDeal ? `Deal Documents — ${activeDeal.title}` : 'Deal Documents'
      }
      subtitle="Upload proposals, MSAs, order forms, security documents, and pricing files for deals."
      activeDeal={activeDeal}
      error={error}
      onDismissError={() => setError(null)}
      actions={
        <div className="lg-badge-row">
          {deals.length > 0 && (
            <select
              className="lg-select"
              value={selectedDealId}
              onChange={(e) => handleDealSelectChange(e.target.value)}
              aria-label="Select deal for documents"
            >
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({formatCurrency(d.value)} · {d.status})
                </option>
              ))}
            </select>
          )}
          <Link
            to={activeDeal ? `/deals/${activeDeal.id}` : '/deals'}
            className="auth-btn btn-secondary btn-size-small"
          >
            <ArrowLeftIcon size={15} /> {activeDeal ? 'Deal Details' : 'All Deals'}
          </Link>
        </div>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading deal documents..." />
        </div>
      ) : !selectedDealId ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No Deal Available"
            description="Create a deal first to upload and link proposals or contracts."
            action={
              <Link to="/deals/create" className="auth-btn btn-primary">
                Create Deal
              </Link>
            }
          />
        </div>
      ) : (
        <DealDocumentsSection dealId={selectedDealId} onChanged={loadWorkspace} />
      )}
    </DealsLayout>
  );
};

export default DealDocumentsPage;
