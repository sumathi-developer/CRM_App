import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contactService } from '../../services/contact.service';
import type {
  Contact,
  ContactDeal,
  ContactOrganization,
  ContactStage,
  ConvertContactPayload,
  PipelineOption,
} from '../../types/contact.types';
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
import { getInitials } from '../leads/leadConstants';
import {
  contactFullName,
  contactStageTone,
  getContactPermissions,
} from './contactConstants';
import { ContactsLayout } from './components/ContactsLayout';
import { ContactStagePipeline, ConvertContactModal } from './components/ContactViews';
import {
  ContactActivitiesSection,
  ContactDocumentsSection,
  ContactNotesSection,
  ContactTimelineSection,
} from './components/ContactSubsections';
import {
  ActivityIcon,
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  DollarSignIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  TrashIcon,
  UserIcon,
} from '../../components/common/Icons';

type ContactDetailsTab = 'overview' | 'activities' | 'notes' | 'documents' | 'deals';

export const ContactDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { users } = useUserOptions();
  const permissions = useMemo(() => getContactPermissions(currentUser), [currentUser]);

  const [contact, setContact] = useState<Contact | null>(null);
  const [deals, setDeals] = useState<ContactDeal[]>([]);
  const [organizations, setOrganizations] = useState<ContactOrganization[]>([]);
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContactDetailsTab>('overview');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadContact = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [contactData, dealsData, orgsData, pipesData] = await Promise.all([
        contactService.getContactById(id),
        contactService.getContactDeals(id).catch(() => []),
        contactService.getOrganizations(),
        contactService.getPipelines(),
      ]);
      setContact(contactData);
      setDeals(dealsData.length > 0 ? dealsData : contactData.deals || []);
      setOrganizations(orgsData);
      setPipelines(pipesData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load contact details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const handleStageSelect = async (nextStage: ContactStage) => {
    if (!contact || !permissions.canEdit) return;
    if ((contact.stage || '').toUpperCase() === nextStage) return;

    if (nextStage === 'CUSTOMER' && contact.stage !== 'CUSTOMER') {
      setIsConvertOpen(true);
      return;
    }

    setError(null);
    try {
      const updated = await contactService.updateContact(contact.id, { stage: nextStage });
      setContact((prev) => (prev ? { ...prev, ...updated } : updated));
      setSuccess(`Contact lifecycle stage updated to ${nextStage}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update contact stage.');
    }
  };

  const handleQuickOwnerChange = async (newOwnerId: string) => {
    if (!contact || !permissions.canEdit) return;
    setError(null);
    try {
      const updated = await contactService.updateContact(contact.id, {
        ownerId: newOwnerId || undefined,
      });
      setContact((prev) => (prev ? { ...prev, ...updated } : updated));
      const ownerName =
        users.find((u) => u.id === newOwnerId)?.name || 'Unassigned';
      setSuccess(`Updated contact owner to ${ownerName}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update contact owner.');
    }
  };

  const handleQuickOrganizationChange = async (newOrgId: string) => {
    if (!contact || !permissions.canEdit) return;
    setError(null);
    try {
      const updated = await contactService.updateContact(contact.id, {
        organizationId: newOrgId || undefined,
      });
      setContact((prev) => (prev ? { ...prev, ...updated } : updated));
      const orgName =
        organizations.find((o) => o.id === newOrgId)?.name || 'Independent Contact';
      setSuccess(`Linked contact to ${orgName}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update contact organization.');
    }
  };

  const handleConvertSubmit = async (contactId: string, payload: ConvertContactPayload) => {
    const res = await contactService.convertContact(contactId, payload);
    setSuccess(
      res.message ||
        `Contact converted to Customer${res.deal ? ` with deal "${res.deal.title}"` : ''}.`,
    );
    await loadContact();
    return res;
  };

  const handleConfirmDelete = async () => {
    if (!contact || !permissions.canDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await contactService.deleteContact(contact.id);
      navigate('/contacts', {
        state: { flash: `Contact "${contactFullName(contact)}" was permanently deleted.` },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to delete contact.');
      setIsDeleting(false);
    }
  };

  const totalDealValue = useMemo(
    () => deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    [deals],
  );

  return (
    <ContactsLayout
      title={contact ? contactFullName(contact) : 'Contact Details'}
      subtitle={
        contact
          ? `${contact.jobTitle || 'Contact'}${
              contact.department ? ` (${contact.department})` : ''
            } · ${contact.organization?.name || contact.email}`
          : 'Inspect contact profile, organization, deals, timeline, activities, notes, and documents.'
      }
      icon={<UserIcon size={22} />}
      activeContact={contact}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link to="/contacts" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to All Contacts
        </Link>
      }
      actions={
        contact && (
          <>
            {permissions.canEdit && contact.stage !== 'CUSTOMER' && (
              <button
                type="button"
                className="auth-btn btn-primary"
                onClick={() => setIsConvertOpen(true)}
                id="btn-convert-contact"
              >
                <CheckCircleIcon size={15} />
                <span>Convert to Customer</span>
              </button>
            )}
            {permissions.canEdit && (
              <Link to={`/contacts/${contact.id}/edit`} className="auth-btn btn-secondary">
                <EditIcon size={15} />
                <span>Edit</span>
              </Link>
            )}
            {permissions.canDelete && (
              <button
                type="button"
                className="auth-btn btn-danger"
                onClick={() => setIsDeleteOpen(true)}
                aria-label="Delete Contact"
              >
                <TrashIcon size={15} />
              </button>
            )}
          </>
        )
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading contact details..." />
        </div>
      ) : !contact ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Contact Not Found"
            description="The requested contact could not be found or has been deleted."
            action={
              <Link to="/contacts" className="auth-btn btn-primary">
                Return to All Contacts
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Lifecycle Stage Pipeline Card */}
          <div className="lg-card ld-details-stage-card">
            <div className="ld-stage-card-head">
              <div>
                <span className="lg-stat-label">Contact Lifecycle Stage</span>
                <p className="lg-field-hint">
                  Click any stage to transition the contact lifecycle or convert to a paying
                  Customer.
                </p>
              </div>
              <div className="lg-badge-row">
                <Badge tone={contactStageTone(contact.stage)}>{humanize(contact.stage)}</Badge>
                {contact.department && (
                  <Badge tone="slate">Dept: {contact.department}</Badge>
                )}
              </div>
            </div>
            <ContactStagePipeline
              currentStage={contact.stage}
              onSelectStage={permissions.canEdit ? handleStageSelect : undefined}
              disabled={!permissions.canEdit}
            />
          </div>

          {/* KPI Stat Cards */}
          <section className="lg-stats-grid">
            <StatCard
              label="Lifecycle Stage"
              value={humanize(contact.stage)}
              hint={
                contact.organization?.name
                  ? `Company: ${contact.organization.name}`
                  : 'Independent contact'
              }
              tone={
                contactStageTone(contact.stage) === 'red'
                  ? 'amber'
                  : (contactStageTone(contact.stage) as 'blue' | 'green' | 'amber' | 'slate')
              }
              icon={<CheckCircleIcon size={18} />}
            />
            <StatCard
              label="Linked Deals Value"
              value={formatCurrency(totalDealValue)}
              hint={`${deals.length} linked deal(s)`}
              tone="green"
              icon={<DollarSignIcon size={18} />}
            />
            <StatCard
              label="Logged Activities"
              value={contact._count?.activities ?? contact.activities?.length ?? 0}
              hint={`${contact._count?.tasks ?? contact.tasks?.length ?? 0} tasks`}
              tone="blue"
              icon={<ActivityIcon size={18} />}
            />
            <StatCard
              label="Contact Owner"
              value={contact.owner?.name || 'Unassigned'}
              hint={contact.owner?.email || 'Assign a representative below'}
              tone="purple"
              icon={<UserIcon size={18} />}
            />
          </section>

          {/* Details Inner Section Tabs */}
          <div className="ld-details-tabs" role="tablist" aria-label="Contact detail sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              className={`ld-details-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview & Timeline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'activities'}
              className={`ld-details-tab ${activeTab === 'activities' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('activities')}
            >
              Activities ({contact._count?.activities ?? contact.activities?.length ?? 0})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'notes'}
              className={`ld-details-tab ${activeTab === 'notes' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes ({contact._count?.notes ?? contact.notes?.length ?? 0})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'documents'}
              className={`ld-details-tab ${activeTab === 'documents' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'deals'}
              className={`ld-details-tab ${activeTab === 'deals' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('deals')}
            >
              Linked Deals ({deals.length})
            </button>
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="lg-two-col">
                {/* Left Column: Contact & Organization Profile */}
                <SectionCard
                  title="Contact & Organization Information"
                  subtitle="Primary communication channels, role, and company affiliation."
                  actions={
                    permissions.canEdit ? (
                      <Link
                        to={`/contacts/${contact.id}/edit`}
                        className="auth-btn btn-secondary"
                      >
                        <EditIcon size={14} />
                        <span>Edit Info</span>
                      </Link>
                    ) : undefined
                  }
                >
                  <div className="ld-profile-head">
                    <div className="ld-avatar ld-avatar-lg">
                      {getInitials(contactFullName(contact))}
                    </div>
                    <div>
                      <h3 className="ld-profile-name">{contactFullName(contact)}</h3>
                      <p className="lg-muted">
                        {contact.jobTitle || 'Stakeholder'}
                        {contact.department ? ` · ${contact.department}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="ld-kv-list">
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">
                        <MailIcon size={14} /> Email
                      </span>
                      <a href={`mailto:${contact.email}`} className="ld-meta-link">
                        {contact.email}
                      </a>
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">
                        <PhoneIcon size={14} /> Phone
                      </span>
                      {contact.phone ? (
                        <a href={`tel:${contact.phone}`} className="ld-meta-link">
                          {contact.phone}
                        </a>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">
                        <BriefcaseIcon size={14} /> Job Title
                      </span>
                      <span>{contact.jobTitle || '—'}</span>
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">Department</span>
                      <span>{contact.department || '—'}</span>
                    </div>
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">
                        <BuildingIcon size={14} /> Organization
                      </span>
                      <span>{contact.organization?.name || 'Independent Contact'}</span>
                    </div>
                    {contact.organization?.industry && (
                      <div className="ld-kv-row">
                        <span className="ld-kv-label">Industry</span>
                        <span>{contact.organization.industry}</span>
                      </div>
                    )}
                    <div className="ld-kv-row">
                      <span className="ld-kv-label">
                        <CalendarIcon size={14} /> Created At
                      </span>
                      <span>{formatDateTime(contact.createdAt)}</span>
                    </div>
                  </div>
                </SectionCard>

                {/* Right Column: Ownership, Organization Link & Linked Deals Preview */}
                <SectionCard
                  title="Ownership & Account Relationships"
                  subtitle="Manage owner assignment, company affiliation, and linked sales deals."
                >
                  <div className="ld-form-stack">
                    {permissions.canEdit && (
                      <>
                        <div className="ld-quick-assign-box">
                          <label htmlFor="quick-contact-owner" className="lg-label">
                            Assigned Contact Owner
                          </label>
                          <div className="ld-quick-assign-row">
                            <select
                              id="quick-contact-owner"
                              className="lg-select"
                              value={contact.ownerId || ''}
                              onChange={(e) => handleQuickOwnerChange(e.target.value)}
                            >
                              <option value="">Unassigned</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.email})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="ld-quick-assign-box">
                          <label htmlFor="quick-contact-org" className="lg-label">
                            Linked Organization
                          </label>
                          <div className="ld-quick-assign-row">
                            <select
                              id="quick-contact-org"
                              className="lg-select"
                              value={contact.organizationId || ''}
                              onChange={(e) => handleQuickOrganizationChange(e.target.value)}
                            >
                              <option value="">Independent Contact (No Organization)</option>
                              {organizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                  {org.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="ld-qual-notes-box">
                      <div className="ld-qual-notes-head">
                        <strong>Linked Sales Deals ({deals.length})</strong>
                        {permissions.canEdit && contact.stage !== 'CUSTOMER' && (
                          <button
                            type="button"
                            className="lg-link-btn"
                            onClick={() => setIsConvertOpen(true)}
                          >
                            Convert & Create Deal
                          </button>
                        )}
                      </div>
                      {deals.length === 0 ? (
                        <p className="lg-muted">
                          No sales deals are linked to this contact yet.
                        </p>
                      ) : (
                        <div className="ld-breakdown-list">
                          {deals.slice(0, 4).map((deal) => (
                            <div key={deal.id} className="ld-breakdown-item">
                              <div>
                                <strong>{deal.title}</strong>
                                <span className="lg-cell-sub">
                                  {deal.stage?.name || deal.status}
                                </span>
                              </div>
                              <Badge
                                tone={
                                  deal.status === 'WON'
                                    ? 'green'
                                    : deal.status === 'LOST'
                                      ? 'red'
                                      : 'blue'
                                }
                              >
                                {formatCurrency(deal.value)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* Chronological Activity Timeline */}
              <ContactTimelineSection contactId={contact.id} />
            </>
          )}

          {activeTab === 'activities' && (
            <ContactActivitiesSection
              contactId={contact.id}
              users={users}
              canEdit={permissions.canEdit}
              canDelete={permissions.canDelete}
              onChanged={(msg) => {
                if (msg) setSuccess(msg);
                loadContact();
              }}
            />
          )}

          {activeTab === 'notes' && (
            <ContactNotesSection
              contactId={contact.id}
              canEdit={permissions.canEdit}
              canDelete={permissions.canDelete}
              onChanged={(msg) => {
                if (msg) setSuccess(msg);
                loadContact();
              }}
            />
          )}

          {activeTab === 'documents' && (
            <ContactDocumentsSection
              contactId={contact.id}
              canEdit={permissions.canEdit}
              canDelete={permissions.canDelete}
              onChanged={(msg) => {
                if (msg) setSuccess(msg);
              }}
            />
          )}

          {activeTab === 'deals' && (
            <SectionCard
              title={`Linked Deals (${deals.length})`}
              subtitle="Opportunities and commercial agreements associated with this contact."
              actions={
                permissions.canEdit ? (
                  <button
                    type="button"
                    className="auth-btn btn-primary"
                    onClick={() => setIsConvertOpen(true)}
                  >
                    <CheckCircleIcon size={15} />
                    <span>Create Customer Deal</span>
                  </button>
                ) : undefined
              }
            >
              {deals.length === 0 ? (
                <EmptyState
                  title="No deals linked to this contact"
                  description="Convert this contact to a customer or create a linked deal to track revenue."
                />
              ) : (
                <div className="ld-items-stack">
                  {deals.map((deal) => (
                    <div key={deal.id} className="ld-subcard">
                      <div className="ld-subcard-top">
                        <div className="lg-badge-row">
                          <strong>{deal.title}</strong>
                          <Badge
                            tone={
                              deal.status === 'WON'
                                ? 'green'
                                : deal.status === 'LOST'
                                  ? 'red'
                                  : 'blue'
                            }
                          >
                            {deal.status}
                          </Badge>
                          {deal.stage?.name && (
                            <Badge tone="slate">Stage: {deal.stage.name}</Badge>
                          )}
                        </div>
                        <strong>{formatCurrency(deal.value)}</strong>
                      </div>
                      <div className="ld-subcard-meta">
                        {deal.pipeline?.name && <span>Pipeline: {deal.pipeline.name}</span>}
                        {typeof deal.probability === 'number' && (
                          <span>Probability: {deal.probability}%</span>
                        )}
                        <span>Created {formatDateTime(deal.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}
        </>
      )}

      {/* Convert Contact Modal */}
      <ConvertContactModal
        contact={contact}
        pipelines={pipelines}
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        onConvert={handleConvertSubmit}
      />

      {/* Delete Contact Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Delete Contact"
        message={`Are you sure you want to permanently delete "${contactFullName(contact)}"?`}
        confirmLabel="Delete Contact"
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteOpen(false)}
        isLoading={isDeleting}
      />
    </ContactsLayout>
  );
};
