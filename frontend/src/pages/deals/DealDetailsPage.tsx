import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dealService } from '../../services/deal.service';
import type { Deal, DealStatus, DealUserOption, Pipeline } from '../../types/deal.types';
import { DealsLayout } from './components/DealsLayout';
import { DealOutcomeModal, DealStageStepper } from './components/DealViews';
import {
  DealActivitiesSection,
  DealDocumentsSection,
  DealNotesSection,
  DealTimelineSection,
} from './components/DealSubsections';
import { getDealPermissions } from './dealConstants';
import {
  computeWeightedDealValue,
  dealStatusTone,
  probabilityTone,
} from '../pipelines/pipelineConstants';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../lead-generation/leadGenConstants';
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  EditIcon,
  TargetIcon,
  TrashIcon,
  TrendingUpIcon,
  UserIcon,
} from '../../components/common/Icons';

type DealDetailTab = 'overview' | 'activities' | 'notes' | 'documents';

export const DealDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = useMemo(() => getDealPermissions(user), [user]);

  const [deal, setDeal] = useState<Deal | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [users, setUsers] = useState<DealUserOption[]>([]);
  const [activeTab, setActiveTab] = useState<DealDetailTab>('overview');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [isAssigningOwner, setIsAssigningOwner] = useState(false);

  const [outcomeModalState, setOutcomeModalState] = useState<{
    isOpen: boolean;
    initialOutcome: DealStatus;
  }>({ isOpen: false, initialOutcome: 'WON' });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDealData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [dealRes, pipeRes, assignees] = await Promise.all([
        dealService.getDealById(id),
        dealService.getPipelines(),
        dealService.getAssignableUsers(),
      ]);
      setDeal(dealRes);
      setPipelines(pipeRes);
      setUsers(assignees);
      setSelectedOwnerId(dealRes?.ownerId || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load deal details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDealData();
  }, [loadDealData]);

  const stages = useMemo(() => {
    if (!deal) return [];
    const pipe =
      pipelines.find((p) => p.id === deal.pipelineId) ||
      pipelines.find((p) => p.isDefault) ||
      pipelines[0];
    return pipe?.stages || [];
  }, [deal, pipelines]);

  const handleStageChange = async (nextStageId: string) => {
    if (!deal || deal.stageId === nextStageId) return;
    try {
      await dealService.updateDealStage(deal.id, nextStageId);
      setBannerMessage('Deal pipeline stage updated.');
      await loadDealData();
    } catch (err: any) {
      setError(err?.message || 'Failed to move deal to the selected stage.');
    }
  };

  const handleAssignOwner = async () => {
    if (!deal || !selectedOwnerId) return;
    setIsAssigningOwner(true);
    try {
      await dealService.assignDeal(deal.id, selectedOwnerId);
      setBannerMessage('Deal owner assignment updated.');
      await loadDealData();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign deal owner.');
    } finally {
      setIsAssigningOwner(false);
    }
  };

  const handleConfirmOutcome = async (
    dealId: string,
    status: DealStatus,
    outcomeNote?: string,
  ) => {
    await dealService.updateDealStatus(dealId, status);
    if (outcomeNote) {
      try {
        await dealService.createNote({
          dealId,
          title: `Deal Outcome Recorded: ${status}`,
          content: outcomeNote,
        });
      } catch {
        // non-blocking note creation
      }
    }
    setBannerMessage(`Deal marked as ${status}.`);
    await loadDealData();
  };

  const handleConfirmDelete = async () => {
    if (!deal) return;
    setIsDeleting(true);
    try {
      await dealService.deleteDeal(deal.id);
      navigate('/deals');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete deal.');
      setIsDeleting(false);
    }
  };

  const weightedValue = useMemo(
    () => (deal ? computeWeightedDealValue(deal, deal.stage?.winProbability) : 0),
    [deal],
  );

  return (
    <DealsLayout
      title={deal ? deal.title : 'Deal Details'}
      subtitle={
        deal
          ? `${deal.organization?.name || 'Direct Opportunity'} · ${
              deal.pipeline?.name || 'Sales Pipeline'
            } · ${deal.stage?.name || 'Active Stage'}`
          : 'Comprehensive deal workspace, pipeline progression, and related records.'
      }
      activeDeal={deal}
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <Link to="/deals" className="auth-btn btn-secondary btn-size-small">
            <ArrowLeftIcon size={15} /> All Deals
          </Link>

          {deal && permissions.canManageDeals && (
            <>
              {deal.status !== 'WON' && (
                <button
                  type="button"
                  className="auth-btn btn-primary btn-size-small"
                  onClick={() =>
                    setOutcomeModalState({ isOpen: true, initialOutcome: 'WON' })
                  }
                >
                  <CheckCircleIcon size={15} /> Mark Won
                </button>
              )}
              {deal.status !== 'LOST' && (
                <button
                  type="button"
                  className="auth-btn btn-danger btn-size-small"
                  onClick={() =>
                    setOutcomeModalState({ isOpen: true, initialOutcome: 'LOST' })
                  }
                >
                  Mark Lost
                </button>
              )}
              <Link
                to={`/deals/${deal.id}/edit`}
                className="auth-btn btn-secondary btn-size-small"
              >
                <EditIcon size={15} /> Edit Deal
              </Link>
              <button
                type="button"
                className="lg-icon-btn danger"
                title="Delete Deal"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <TrashIcon size={16} />
              </button>
            </>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading deal details..." />
        </div>
      ) : !deal ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Deal Not Found"
            description="The requested deal does not exist or may have been deleted."
            action={
              <Link to="/deals" className="auth-btn btn-primary">
                Return to All Deals
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* KPI Stat Cards */}
          <div className="lg-stat-grid">
            <StatCard
              label="Deal Value"
              value={formatCurrency(deal.value)}
              hint={`Currency: ${deal.currency || 'USD'}`}
              tone="blue"
              icon={<TrendingUpIcon size={18} />}
            />
            <StatCard
              label="Weighted Forecast"
              value={formatCurrency(weightedValue)}
              hint={`Based on ${deal.probability ?? 0}% win probability`}
              tone="purple"
              icon={<TargetIcon size={18} />}
            />
            <StatCard
              label="Pipeline Stage & Status"
              value={deal.stage?.name || 'Unstaged'}
              hint={`Outcome Status: ${deal.status}`}
              tone={dealStatusTone(deal.status)}
              icon={<BriefcaseIcon size={18} />}
            />
            <StatCard
              label="Expected Close Date"
              value={
                deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : 'Not Set'
              }
              hint={`Owner: ${deal.owner?.name || 'Unassigned'}`}
              tone="amber"
              icon={<CalendarIcon size={18} />}
            />
          </div>

          {/* Pipeline Stage Progression Stepper */}
          {stages.length > 0 && (
            <SectionCard
              title="Sales Pipeline Stage Progression"
              subtitle={`Pipeline: ${
                deal.pipeline?.name || 'Default Pipeline'
              } — Click any stage to move this deal and update stage probability.`}
              actions={
                <div className="lg-badge-row">
                  <Badge tone={dealStatusTone(deal.status)}>{deal.status}</Badge>
                  <Badge tone={probabilityTone(deal.probability)}>
                    {deal.probability}% Probability
                  </Badge>
                </div>
              }
            >
              <DealStageStepper
                stages={stages}
                currentStageId={deal.stageId}
                onSelectStage={
                  permissions.canManageDeals ? handleStageChange : undefined
                }
                disabled={!permissions.canManageDeals}
              />
            </SectionCard>
          )}

          {/* Section Tabs */}
          <div className="ld-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              className={`ld-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview & Timeline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'activities'}
              className={`ld-tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
              onClick={() => setActiveTab('activities')}
            >
              Activities ({deal._count?.activities ?? 0})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'notes'}
              className={`ld-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes ({deal._count?.notes ?? 0})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'documents'}
              className={`ld-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="ld-detail-grid">
              <div className="ld-detail-main">
                <DealTimelineSection dealId={deal.id} />
              </div>

              <div className="ld-detail-side">
                <SectionCard
                  title="Deal Summary"
                  subtitle="Commercial terms, valuation, and timeline metadata."
                >
                  <div className="ld-kv-list">
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">Deal Title</span>
                      <strong>{deal.title}</strong>
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">Deal Value</span>
                      <strong>{formatCurrency(deal.value)}</strong>
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">Weighted Value</span>
                      <span>{formatCurrency(weightedValue)}</span>
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">Win Probability</span>
                      <Badge tone={probabilityTone(deal.probability)}>
                        {deal.probability}%
                      </Badge>
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">Status</span>
                      <Badge tone={dealStatusTone(deal.status)}>{deal.status}</Badge>
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">Expected Close</span>
                      <span>
                        {deal.expectedCloseDate
                          ? formatDate(deal.expectedCloseDate)
                          : '—'}
                      </span>
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">Created At</span>
                      <span>{formatDateTime(deal.createdAt)}</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Linked Account & Contact"
                  subtitle="Organization and primary stakeholder linked to this deal."
                >
                  <div className="ld-kv-list">
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">
                        <BuildingIcon size={13} /> Organization
                      </span>
                      <strong>{deal.organization?.name || 'Not Linked'}</strong>
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">
                        <UserIcon size={13} /> Primary Contact
                      </span>
                      {deal.contact ? (
                        <Link
                          to={`/contacts/${deal.contact.id || deal.contactId}`}
                          className="lg-row-link"
                        >
                          {deal.contact.firstName} {deal.contact.lastName}
                        </Link>
                      ) : (
                        <span>Not Linked</span>
                      )}
                    </div>
                    {deal.contact?.email && (
                      <div className="ld-kv-row">
                        <span className="ld-kv-label">Contact Email</span>
                        <span>{deal.contact.email}</span>
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Deal Ownership"
                  subtitle="Assign or transfer responsibility for this deal."
                >
                  <div className="ld-form-stack">
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">Current Owner</span>
                      <strong>{deal.owner?.name || 'Unassigned'}</strong>
                    </div>
                    {permissions.canManageDeals && (
                      <div className="lg-badge-row" style={{ marginTop: '0.5rem' }}>
                        <select
                          className="lg-select"
                          style={{ flex: 1 }}
                          value={selectedOwnerId}
                          onChange={(e) => setSelectedOwnerId(e.target.value)}
                          aria-label="Select deal owner"
                        >
                          <option value="">— Select Owner —</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="auth-btn btn-secondary btn-size-small"
                          disabled={
                            !selectedOwnerId ||
                            selectedOwnerId === deal.ownerId ||
                            isAssigningOwner
                          }
                          onClick={handleAssignOwner}
                        >
                          {isAssigningOwner ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <DealActivitiesSection
              dealId={deal.id}
              users={users}
              onChanged={loadDealData}
            />
          )}

          {activeTab === 'notes' && (
            <DealNotesSection dealId={deal.id} onChanged={loadDealData} />
          )}

          {activeTab === 'documents' && (
            <DealDocumentsSection dealId={deal.id} onChanged={loadDealData} />
          )}
        </>
      )}

      <DealOutcomeModal
        deal={deal}
        initialOutcome={outcomeModalState.initialOutcome}
        isOpen={outcomeModalState.isOpen}
        onClose={() => setOutcomeModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmOutcome}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Deal"
        message={`Are you sure you want to permanently delete "${deal?.title || 'this deal'}"?`}
        confirmLabel="Delete Deal"
        isLoading={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </DealsLayout>
  );
};

export default DealDetailsPage;
