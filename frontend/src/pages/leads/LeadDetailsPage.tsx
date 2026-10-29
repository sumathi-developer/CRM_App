import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import type {
  Lead,
  LeadStatus,
  PipelineOption,
} from '../../types/lead.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import {
  formatCurrency,
  formatDateTime,
  humanize,
} from '../lead-generation/leadGenConstants';
import {
  getInitials,
  leadFullName,
  statusTone,
} from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import { LeadScoreDisplay, QualificationPipeline } from './components/LeadCard';
import {
  AssignLeadModal,
  ConvertLeadModal,
  QualifyLeadModal,
  ScoreLeadModal,
} from './components/LeadActionModals';
import {
  LeadActivitiesSection,
  LeadDocumentsSection,
  LeadNotesSection,
  LeadTimelineSection,
} from './components/LeadSubsections';
import {
  ActivityIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  AwardIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  DollarSignIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  TargetIcon,
  TrashIcon,
  UserIcon,
} from '../../components/common/Icons';

type DetailsTab = 'overview' | 'activities' | 'notes' | 'documents';

export const LeadDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users } = useUserOptions();

  const [lead, setLead] = useState<Lead | null>(null);
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailsTab>('overview');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isQualifyOpen, setIsQualifyOpen] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadLead = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [leadData, pipeData] = await Promise.all([
        leadService.getLeadById(id),
        leadService.getPipelines(),
      ]);
      setLead(leadData);
      setPipelines(pipeData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load lead details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  const handleStageSelect = async (nextStatus: LeadStatus) => {
    if (!lead) return;
    setError(null);
    try {
      const updated = await leadService.updateLeadStatus(lead.id, nextStatus);
      setLead((prev) => (prev ? { ...prev, ...updated } : updated));
      setSuccess(`Lead qualification status updated to ${nextStatus}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update lead status.');
    }
  };

  const handleQuickAssignChange = async (newOwnerId: string) => {
    if (!lead || !newOwnerId) return;
    setError(null);
    try {
      const updated = await leadService.assignLead(lead.id, newOwnerId);
      setLead((prev) => (prev ? { ...prev, ...updated } : updated));
      const ownerName = users.find((u) => u.id === newOwnerId)?.name || 'selected owner';
      setSuccess(`Assigned lead to ${ownerName}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign lead.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!lead) return;
    setIsDeleting(true);
    setError(null);
    try {
      await leadService.deleteLead(lead.id);
      navigate('/leads', {
        state: { flash: `Lead "${lead.title}" was permanently deleted.` },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to delete lead.');
      setIsDeleting(false);
    }
  };

  return (
    <LeadsLayout
      title={lead ? lead.title : 'Lead Details'}
      subtitle={
        lead
          ? `${leadFullName(lead)} · ${lead.companyName || lead.email}`
          : 'Inspect lead profile, timeline, activities, notes, documents, and conversion readiness.'
      }
      icon={<TargetIcon size={22} />}
      activeLead={lead}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link to="/leads" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to All Leads
        </Link>
      }
      actions={
        lead && (
          <>
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={() => setIsAssignOpen(true)}
            >
              <UserIcon size={15} />
              <span>Assign</span>
            </button>
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={() => setIsQualifyOpen(true)}
            >
              <CheckCircleIcon size={15} />
              <span>Qualify</span>
            </button>
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={() => setIsScoreOpen(true)}
            >
              <AwardIcon size={15} />
              <span>Score</span>
            </button>
            {lead.status !== 'CONVERTED' && (
              <button
                type="button"
                className="auth-btn btn-primary"
                onClick={() => setIsConvertOpen(true)}
                id="btn-convert-lead"
              >
                <ArrowRightIcon size={15} />
                <span>Convert Lead</span>
              </button>
            )}
            <Link to={`/leads/${lead.id}/edit`} className="auth-btn btn-secondary">
              <EditIcon size={15} />
              <span>Edit</span>
            </Link>
            <button
              type="button"
              className="auth-btn btn-danger"
              onClick={() => setIsDeleteOpen(true)}
              aria-label="Delete Lead"
            >
              <TrashIcon size={15} />
            </button>
          </>
        )
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading lead details..." />
        </div>
      ) : !lead ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Lead Not Found"
            description="The requested lead could not be found or has been deleted."
            action={
              <Link to="/leads" className="auth-btn btn-primary">
                Return to All Leads
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Qualification Stage Pipeline Card */}
          <div className="lg-card ld-details-stage-card">
            <div className="ld-stage-card-head">
              <div>
                <span className="lg-stat-label">Qualification Pipeline Stage</span>
                <p className="lg-field-hint">
                  Click any stage to transition qualification status or use Convert Lead when ready.
                </p>
              </div>
              <div className="lg-badge-row">
                <Badge tone={statusTone(lead.status)}>{humanize(lead.status)}</Badge>
                <Badge tone="slate">Source: {humanize(lead.source)}</Badge>
              </div>
            </div>
            <QualificationPipeline
              currentStatus={lead.status}
              onSelectStatus={handleStageSelect}
              disabled={lead.status === 'CONVERTED'}
            />
          </div>

          {/* KPI Summary Strip */}
          <div className="lg-stat-grid">
            <StatCard
              label="Estimated Value"
              value={formatCurrency(lead.estimatedValue)}
              hint="Expected deal opportunity"
              icon={<DollarSignIcon size={20} />}
              tone="green"
            />
            <StatCard
              label="Lead Score"
              value={`${lead.leadScore || 0} / 100`}
              hint="Click Score to adjust or recalculate"
              icon={<AwardIcon size={20} />}
              tone="amber"
            />
            <StatCard
              label="Sales Owner"
              value={lead.owner?.name || 'Unassigned'}
              hint={lead.owner?.email || 'Assign an owner below'}
              icon={<UserIcon size={20} />}
              tone="blue"
            />
            <StatCard
              label="Engagement"
              value={`${lead.activities?.length ?? 0} Activities`}
              hint={`${lead.notes?.length ?? 0} Notes · ${lead.tasks?.length ?? 0} Tasks`}
              icon={<ActivityIcon size={20} />}
              tone="purple"
            />
          </div>

          {/* Section Switcher Tabs */}
          <div className="lg-card ld-details-tabs-bar" role="tablist" aria-label="Lead workspace sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              className={`ld-pill-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview & Timeline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'activities'}
              className={`ld-pill-tab ${activeTab === 'activities' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('activities')}
            >
              Activities
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'notes'}
              className={`ld-pill-tab ${activeTab === 'notes' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'documents'}
              className={`ld-pill-tab ${activeTab === 'documents' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="ld-details-layout-grid">
              {/* Left Main Column */}
              <div className="ld-details-main-col">
                {/* Contact & Lead Information Card */}
                <SectionCard
                  title="Lead & Contact Information"
                  subtitle="Core contact attributes, organization, and attribution metadata."
                  actions={
                    <Link to={`/leads/${lead.id}/edit`} className="lg-link-btn">
                      Edit details →
                    </Link>
                  }
                >
                  <div className="ld-hero-identity">
                    <div className="ld-avatar-circle lg" aria-hidden="true">
                      {getInitials(leadFullName(lead))}
                    </div>
                    <div>
                      <h3 className="ld-hero-contact-name">{leadFullName(lead)}</h3>
                      <p className="lg-muted">{lead.companyName || 'Individual Prospect'}</p>
                    </div>
                  </div>

                  <div className="ld-kv-grid">
                    <div className="ld-kv-item">
                      <span className="ld-kv-label">Email Address</span>
                      <span className="ld-kv-value">
                        <MailIcon size={14} />
                        <a href={`mailto:${lead.email}`} className="ld-meta-link">
                          {lead.email}
                        </a>
                      </span>
                    </div>

                    <div className="ld-kv-item">
                      <span className="ld-kv-label">Phone Number</span>
                      <span className="ld-kv-value">
                        <PhoneIcon size={14} />
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="ld-meta-link">
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="lg-muted">Not provided</span>
                        )}
                      </span>
                    </div>

                    <div className="ld-kv-item">
                      <span className="ld-kv-label">Company / Organization</span>
                      <span className="ld-kv-value">
                        <BuildingIcon size={14} />
                        <span>{lead.companyName || 'Not specified'}</span>
                      </span>
                    </div>

                    <div className="ld-kv-item">
                      <span className="ld-kv-label">Lead Source</span>
                      <span className="ld-kv-value">{humanize(lead.source)}</span>
                    </div>

                    <div className="ld-kv-item">
                      <span className="ld-kv-label">Created At</span>
                      <span className="ld-kv-value">
                        <CalendarIcon size={14} />
                        <span>{formatDateTime(lead.createdAt)}</span>
                      </span>
                    </div>

                    <div className="ld-kv-item">
                      <span className="ld-kv-label">Last Updated</span>
                      <span className="ld-kv-value">{formatDateTime(lead.updatedAt)}</span>
                    </div>
                  </div>
                </SectionCard>

                {/* Activity Timeline */}
                <LeadTimelineSection leadId={lead.id} />
              </div>

              {/* Right Sidebar Controls Column */}
              <div className="ld-details-side-col">
                {/* Score Display & Controls Card */}
                <SectionCard
                  title="Lead Score"
                  subtitle="Engagement & fit score"
                  actions={
                    <Link to={`/leads/${lead.id}/scoring`} className="lg-link-btn">
                      Full scoring →
                    </Link>
                  }
                >
                  <LeadScoreDisplay score={lead.leadScore} />
                  <div className="ld-side-card-actions">
                    <button
                      type="button"
                      className="auth-btn btn-secondary btn-full-width"
                      onClick={() => setIsScoreOpen(true)}
                    >
                      <AwardIcon size={15} />
                      <span>Adjust / Recalculate Score</span>
                    </button>
                  </div>
                </SectionCard>

                {/* Assignment Controls Card */}
                <SectionCard
                  title="Lead Assignment"
                  subtitle="Sales representative ownership"
                  actions={
                    <Link to={`/leads/${lead.id}/assignment`} className="lg-link-btn">
                      Routing →
                    </Link>
                  }
                >
                  <div className="ld-owner-box">
                    <div className="ld-avatar-circle sm">
                      {getInitials(lead.owner?.name || 'U')}
                    </div>
                    <div>
                      <strong>{lead.owner?.name || 'Unassigned'}</strong>
                      <div className="lg-muted">
                        {lead.owner?.email || 'No sales rep assigned yet'}
                      </div>
                    </div>
                  </div>

                  <label className="lg-field" htmlFor="quick-owner-select">
                    <span className="lg-label">Quick Reassign Owner</span>
                    <select
                      id="quick-owner-select"
                      className="lg-select"
                      value={lead.ownerId || ''}
                      onChange={(e) => handleQuickAssignChange(e.target.value)}
                    >
                      <option value="">— Select owner —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </SectionCard>

                {/* Qualification & Conversion Card */}
                <SectionCard
                  title="Qualification & Conversion"
                  subtitle="Transition qualified lead to Deal"
                  actions={
                    <Link to={`/leads/${lead.id}/qualification`} className="lg-link-btn">
                      BANT →
                    </Link>
                  }
                >
                  {lead.status === 'CONVERTED' ? (
                    <div className="lg-inline-note">
                      <strong>Lead Converted</strong>
                      <p className="lg-field-hint">
                        Contact ID: {lead.convertedContactId || 'Linked'} · Deal ID:{' '}
                        {lead.convertedDealId || 'Linked'}
                      </p>
                    </div>
                  ) : (
                    <div className="ld-side-card-actions">
                      <button
                        type="button"
                        className="auth-btn btn-secondary btn-full-width"
                        onClick={() => setIsQualifyOpen(true)}
                      >
                        <CheckCircleIcon size={15} />
                        <span>Update Qualification</span>
                      </button>
                      <button
                        type="button"
                        className="auth-btn btn-primary btn-full-width"
                        onClick={() => setIsConvertOpen(true)}
                      >
                        <ArrowRightIcon size={15} />
                        <span>Convert to Contact & Deal</span>
                      </button>
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <LeadActivitiesSection
              leadId={lead.id}
              users={users}
              onChanged={(msg) => {
                if (msg) setSuccess(msg);
                loadLead();
              }}
            />
          )}

          {activeTab === 'notes' && (
            <LeadNotesSection
              leadId={lead.id}
              onChanged={(msg) => {
                if (msg) setSuccess(msg);
                loadLead();
              }}
            />
          )}

          {activeTab === 'documents' && (
            <LeadDocumentsSection
              leadId={lead.id}
              onChanged={(msg) => {
                if (msg) setSuccess(msg);
              }}
            />
          )}
        </>
      )}

      {/* Action Modals */}
      {lead && (
        <>
          <AssignLeadModal
            isOpen={isAssignOpen}
            leads={[lead]}
            users={users}
            onClose={() => setIsAssignOpen(false)}
            onSuccess={(msg) => {
              setSuccess(msg);
              loadLead();
            }}
          />

          <QualifyLeadModal
            isOpen={isQualifyOpen}
            lead={lead}
            onClose={() => setIsQualifyOpen(false)}
            onSuccess={(msg) => {
              setSuccess(msg);
              loadLead();
            }}
          />

          <ScoreLeadModal
            isOpen={isScoreOpen}
            lead={lead}
            onClose={() => setIsScoreOpen(false)}
            onSuccess={(msg) => {
              setSuccess(msg);
              loadLead();
            }}
          />

          <ConvertLeadModal
            isOpen={isConvertOpen}
            lead={lead}
            pipelines={pipelines}
            onClose={() => setIsConvertOpen(false)}
            onConverted={(res) => {
              setSuccess(res?.message || 'Lead converted successfully.');
              loadLead();
            }}
          />

          <ConfirmDeleteModal
            isOpen={isDeleteOpen}
            title="Confirm Lead Deletion"
            message={`Are you sure you want to permanently delete "${lead.title}"? This action cannot be undone.`}
            itemName={lead.title}
            confirmLabel="Delete Lead"
            isLoading={isDeleting}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </LeadsLayout>
  );
};

