import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  Contact,
  ContactStage,
  ConvertContactPayload,
  ConvertContactResponse,
  PipelineOption,
} from '../../../types/contact.types';
import { DataTable, type ColumnDef } from '../../../components/common/DataTable';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingIndicator } from '../../../components/auth/LoadingIndicator';
import { Badge } from '../../lead-generation/components/Cards';
import { Field, FormModal } from '../../lead-generation/components/FormParts';
import { formatDate, formatDateTime, humanize } from '../../lead-generation/leadGenConstants';
import { getInitials } from '../../leads/leadConstants';
import {
  CONTACT_STAGE_OPTIONS,
  contactFullName,
  contactStageTone,
  type ContactPermissions,
} from '../contactConstants';
import {
  ActivityIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  CheckCircleIcon,
  EditIcon,
  EyeIcon,
  MailIcon,
  PhoneIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from '../../../components/common/Icons';

/* ============================================================================
   1. CONTACT LIFECYCLE STAGE PIPELINE STEPPER
   ============================================================================ */

interface ContactStagePipelineProps {
  currentStage: ContactStage | string;
  onSelectStage?: (stage: ContactStage) => void;
  disabled?: boolean;
}

export const ContactStagePipeline: React.FC<ContactStagePipelineProps> = ({
  currentStage,
  onSelectStage,
  disabled = false,
}) => {
  const normalized = (currentStage || 'LEAD').toUpperCase();
  const stageOrder = ['LEAD', 'OPPORTUNITY', 'CUSTOMER', 'CHURNED'];
  const currentIdx = stageOrder.indexOf(normalized);

  return (
    <div className="ld-qual-pipeline" role="group" aria-label="Contact lifecycle stage pipeline">
      {CONTACT_STAGE_OPTIONS.map((step, idx) => {
        const isCurrent = normalized === step.value;
        const isPassed =
          normalized !== 'CHURNED' &&
          step.value !== 'CHURNED' &&
          currentIdx > idx &&
          currentIdx !== -1;

        return (
          <button
            key={step.value}
            type="button"
            disabled={disabled || !onSelectStage}
            onClick={() => onSelectStage?.(step.value)}
            className={`ld-qual-step tone-${step.tone} ${isCurrent ? 'is-current' : ''} ${
              isPassed ? 'is-passed' : ''
            }`}
            title={step.description}
          >
            <span className="ld-qual-step-index">{idx + 1}</span>
            <div className="ld-qual-step-text">
              <strong>{step.label}</strong>
              <span>{step.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

/* ============================================================================
   2. CONTACT CARD (FOR LIST VIEW)
   ============================================================================ */

export interface ContactViewActions {
  permissions: ContactPermissions;
  onPreview?: (contact: Contact) => void;
  onStageChange?: (contact: Contact, stage: ContactStage) => void;
  onConvert?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
}

interface ContactCardProps extends ContactViewActions {
  contact: Contact;
  selected?: boolean;
  onSelectToggle?: (contactId: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  selected = false,
  onSelectToggle,
  permissions,
  onPreview,
  onStageChange,
  onConvert,
  onDelete,
}) => {
  const fullName = contactFullName(contact);

  return (
    <article className={`ld-card ${selected ? 'is-selected' : ''}`}>
      <div className="ld-card-top">
        <div className="ld-card-identity">
          {onSelectToggle && (
            <input
              type="checkbox"
              className="ld-checkbox"
              checked={selected}
              onChange={() => onSelectToggle(contact.id)}
              aria-label={`Select ${fullName}`}
            />
          )}
          <div className="ld-avatar" aria-hidden="true">
            {getInitials(contact.firstName, contact.lastName, fullName)}
          </div>
          <div className="ld-card-titles">
            <Link to={`/contacts/${contact.id}`} className="ld-card-title-link">
              {fullName}
            </Link>
            <div className="ld-card-subtitle">
              <span>{contact.jobTitle || 'Contact'}</span>
              {contact.department && (
                <>
                  <span className="ld-dot">·</span>
                  <span>{contact.department}</span>
                </>
              )}
              {contact.organization?.name && (
                <>
                  <span className="ld-dot">·</span>
                  <span className="ld-company-inline">
                    <BuildingIcon size={12} />
                    {contact.organization.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="ld-card-badges">
          {permissions.canEdit && onStageChange ? (
            <select
              className={`ld-status-select tone-${contactStageTone(contact.stage)}`}
              value={contact.stage}
              onChange={(e) => onStageChange(contact, e.target.value as ContactStage)}
              aria-label={`Change stage for ${fullName}`}
            >
              {CONTACT_STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <Badge tone={contactStageTone(contact.stage)}>{humanize(contact.stage)}</Badge>
          )}
        </div>
      </div>

      <div className="ld-card-grid">
        <div className="ld-card-meta-item">
          <MailIcon size={13} />
          <a href={`mailto:${contact.email}`} className="ld-meta-link">
            {contact.email}
          </a>
        </div>
        {contact.phone && (
          <div className="ld-card-meta-item">
            <PhoneIcon size={13} />
            <a href={`tel:${contact.phone}`} className="ld-meta-link">
              {contact.phone}
            </a>
          </div>
        )}
        <div className="ld-card-meta-item">
          <BuildingIcon size={13} />
          <span>{contact.organization?.name || 'Independent Contact'}</span>
        </div>
        <div className="ld-card-meta-item">
          <UserIcon size={13} />
          <span>{contact.owner?.name || contact.owner?.email || 'Unassigned'}</span>
        </div>
      </div>

      <div className="ld-card-footer">
        <div className="ld-card-counts">
          <span title="Linked Deals">
            <BriefcaseIcon size={12} /> {contact._count?.deals ?? contact.deals?.length ?? 0}{' '}
            deals
          </span>
          <span className="ld-dot">·</span>
          <span title="Activities">
            <ActivityIcon size={12} /> {contact._count?.activities ?? 0} activities
          </span>
          <span className="ld-dot">·</span>
          <span>{contact._count?.notes ?? 0} notes</span>
          <span className="ld-dot">·</span>
          <span>Added {formatDate(contact.createdAt)}</span>
        </div>

        <div className="ld-card-actions">
          {onPreview && (
            <button
              type="button"
              className="lg-icon-btn"
              title="Quick View Drawer"
              onClick={() => onPreview(contact)}
            >
              <EyeIcon size={15} />
            </button>
          )}
          <Link
            to={`/contacts/${contact.id}`}
            className="lg-icon-btn"
            title="Open Contact Details"
          >
            <ArrowRightIcon size={15} />
          </Link>
          {permissions.canEdit && (
            <Link
              to={`/contacts/${contact.id}/edit`}
              className="lg-icon-btn"
              title="Edit Contact"
            >
              <EditIcon size={15} />
            </Link>
          )}
          {permissions.canEdit && onConvert && contact.stage !== 'CUSTOMER' && (
            <button
              type="button"
              className="lg-icon-btn ld-convert-icon-btn"
              title="Convert Contact to Customer"
              onClick={() => onConvert(contact)}
            >
              <CheckCircleIcon size={15} />
            </button>
          )}
          {permissions.canDelete && onDelete && (
            <button
              type="button"
              className="lg-icon-btn lg-icon-danger"
              title="Delete Contact"
              onClick={() => onDelete(contact)}
            >
              <TrashIcon size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

/* ============================================================================
   3. CONTACTS TABLE VIEW (REUSING DATATABLE)
   ============================================================================ */

interface ContactsSharedViewProps extends ContactViewActions {
  contacts: Contact[];
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelect: (contactId: string) => void;
  onToggleSelectAll: () => void;
  emptyAction?: React.ReactNode;
}

export const ContactsTableView: React.FC<ContactsSharedViewProps> = ({
  contacts,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  emptyAction,
  permissions,
  onPreview,
  onStageChange,
  onConvert,
  onDelete,
}) => {
  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.includes(c.id));

  const columns: ColumnDef<Contact>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          className="ld-checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          aria-label="Select all contacts on page"
        />
      ),
      width: '42px',
      render: (contact) => (
        <input
          type="checkbox"
          className="ld-checkbox"
          checked={selectedIds.includes(contact.id)}
          onChange={() => onToggleSelect(contact.id)}
          aria-label={`Select ${contactFullName(contact)}`}
        />
      ),
    },
    {
      key: 'contact',
      header: 'Contact & Email',
      render: (contact) => (
        <div className="ld-table-lead-cell">
          <div className="ld-avatar ld-avatar-sm" aria-hidden="true">
            {getInitials(contact.firstName, contact.lastName, contactFullName(contact))}
          </div>
          <div className="lg-cell-stack">
            <Link to={`/contacts/${contact.id}`} className="lg-table-link">
              {contactFullName(contact)}
            </Link>
            <span className="lg-cell-sub">
              {contact.email}
              {contact.phone ? ` · ${contact.phone}` : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Job Title & Dept',
      render: (contact) => (
        <div className="lg-cell-stack">
          <span>{contact.jobTitle || '—'}</span>
          <span className="lg-cell-sub">{contact.department || 'General'}</span>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (contact) => (
        <div className="lg-cell-stack">
          <span>{contact.organization?.name || '—'}</span>
          {contact.organization?.industry && (
            <span className="lg-cell-sub">{contact.organization.industry}</span>
          )}
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Lifecycle Stage',
      render: (contact) =>
        permissions.canEdit && onStageChange ? (
          <select
            className={`ld-status-select tone-${contactStageTone(contact.stage)}`}
            value={contact.stage}
            onChange={(e) => onStageChange(contact, e.target.value as ContactStage)}
            aria-label={`Lifecycle stage for ${contactFullName(contact)}`}
          >
            {CONTACT_STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <Badge tone={contactStageTone(contact.stage)}>{humanize(contact.stage)}</Badge>
        ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (contact) => (
        <span className="lg-muted">
          {contact.owner?.name || contact.owner?.email || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'engagement',
      header: 'Deals & Activity',
      render: (contact) => (
        <div className="lg-cell-stack">
          <span>{contact._count?.deals ?? contact.deals?.length ?? 0} deals</span>
          <span className="lg-cell-sub">
            {contact._count?.activities ?? 0} acts · {contact._count?.notes ?? 0} notes
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (contact) => <span className="lg-muted">{formatDate(contact.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (contact) => (
        <div className="lg-row-actions">
          {onPreview && (
            <button
              type="button"
              className="lg-icon-btn"
              title="Quick View Drawer"
              onClick={() => onPreview(contact)}
            >
              <EyeIcon size={15} />
            </button>
          )}
          <Link to={`/contacts/${contact.id}`} className="lg-icon-btn" title="View Details">
            <ArrowRightIcon size={15} />
          </Link>
          {permissions.canEdit && (
            <Link to={`/contacts/${contact.id}/edit`} className="lg-icon-btn" title="Edit Contact">
              <EditIcon size={15} />
            </Link>
          )}
          {permissions.canEdit && onConvert && contact.stage !== 'CUSTOMER' && (
            <button
              type="button"
              className="lg-icon-btn ld-convert-icon-btn"
              title="Convert to Customer"
              onClick={() => onConvert(contact)}
            >
              <CheckCircleIcon size={15} />
            </button>
          )}
          {permissions.canDelete && onDelete && (
            <button
              type="button"
              className="lg-icon-btn lg-icon-danger"
              title="Delete Contact"
              onClick={() => onDelete(contact)}
            >
              <TrashIcon size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="lg-card lg-table-card">
      <DataTable
        columns={columns}
        data={contacts}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        loadingMessage="Loading contacts..."
        emptyTitle="No contacts match the current filters"
        emptyDescription="Adjust your search, stage, or organization filters, or create a new contact."
        emptyAction={emptyAction}
      />
    </div>
  );
};

/* ============================================================================
   4. CONTACTS LIST VIEW (CARD LIST)
   ============================================================================ */

export const ContactsListView: React.FC<ContactsSharedViewProps> = ({
  contacts,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  emptyAction,
  permissions,
  onPreview,
  onStageChange,
  onConvert,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="large" message="Loading contact list..." />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="lg-card lg-state-box">
        <EmptyState
          title="No contacts found"
          description="Try clearing your search or filters, or add a new contact."
          action={emptyAction}
        />
      </div>
    );
  }

  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.includes(c.id));

  return (
    <div className="ld-list-view">
      <div className="ld-list-SelectBar">
        <label className="lg-CheckRow">
          <input
            type="checkbox"
            className="ld-checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
          />
          <span>Select all {contacts.length} contacts on this page</span>
        </label>
        <span className="lg-muted">
          Showing {contacts.length} contact{contacts.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="ld-cards-stack">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            selected={selectedIds.includes(contact.id)}
            onSelectToggle={onToggleSelect}
            permissions={permissions}
            onPreview={onPreview}
            onStageChange={onStageChange}
            onConvert={onConvert}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
   5. CONTACT QUICK PREVIEW DRAWER
   ============================================================================ */

interface ContactQuickDrawerProps {
  contact: Contact | null;
  isOpen: boolean;
  permissions: ContactPermissions;
  onClose: () => void;
  onStageChange?: (contact: Contact, stage: ContactStage) => void;
  onConvert?: (contact: Contact) => void;
}

export const ContactQuickDrawer: React.FC<ContactQuickDrawerProps> = ({
  contact,
  isOpen,
  permissions,
  onClose,
  onStageChange,
  onConvert,
}) => {
  if (!isOpen || !contact) return null;

  const fullName = contactFullName(contact);

  return (
    <div className="ld-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="ld-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Contact preview: ${fullName}`}
      >
        <header className="ld-drawer-header">
          <div className="ld-drawer-title-row">
            <div className="ld-avatar">
              {getInitials(contact.firstName, contact.lastName, fullName)}
            </div>
            <div>
              <h3 className="ld-drawer-title">{fullName}</h3>
              <p className="ld-drawer-subtitle">
                {contact.jobTitle || 'Contact'} ·{' '}
                {contact.organization?.name || 'Independent Contact'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="lg-icon-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <XIcon size={18} />
          </button>
        </header>

        <div className="ld-drawer-body">
          <div className="ld-drawer-badges">
            <Badge tone={contactStageTone(contact.stage)}>{humanize(contact.stage)}</Badge>
            {contact.department && <Badge tone="slate">{contact.department}</Badge>}
          </div>

          <div className="ld-drawer-section">
            <h4 className="ld-drawer-section-title">Lifecycle Stage</h4>
            <ContactStagePipeline
              currentStage={contact.stage}
              onSelectStage={
                permissions.canEdit && onStageChange
                  ? (st) => onStageChange(contact, st)
                  : undefined
              }
              disabled={!permissions.canEdit}
            />
          </div>

          <div className="ld-drawer-section">
            <h4 className="ld-drawer-section-title">Contact Details</h4>
            <div className="ld-kv-list">
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <MailIcon size={13} /> Email
                </span>
                <a href={`mailto:${contact.email}`} className="ld-meta-link">
                  {contact.email}
                </a>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <PhoneIcon size={13} /> Phone
                </span>
                <span>{contact.phone || '—'}</span>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <BriefcaseIcon size={13} /> Job Title
                </span>
                <span>{contact.jobTitle || '—'}</span>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <BuildingIcon size={13} /> Organization
                </span>
                <span>{contact.organization?.name || '—'}</span>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">
                  <UserIcon size={13} /> Owner
                </span>
                <span>{contact.owner?.name || contact.owner?.email || 'Unassigned'}</span>
              </div>
              <div className="ld-kv-row">
                <span className="ld-kv-label">Created</span>
                <span>{formatDateTime(contact.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="ld-drawer-section">
            <h4 className="ld-drawer-section-title">Quick Navigation</h4>
            <div className="ld-drawer-nav-grid">
              <Link
                to={`/contacts/${contact.id}`}
                className="ld-drawer-nav-btn"
                onClick={onClose}
              >
                <ArrowRightIcon size={14} /> Full Profile
              </Link>
              {permissions.canEdit && (
                <Link
                  to={`/contacts/${contact.id}/edit`}
                  className="ld-drawer-nav-btn"
                  onClick={onClose}
                >
                  <EditIcon size={14} /> Edit Contact
                </Link>
              )}
              <Link
                to={`/contacts/${contact.id}/activities`}
                className="ld-drawer-nav-btn"
                onClick={onClose}
              >
                <ActivityIcon size={14} /> Activities ({contact._count?.activities ?? 0})
              </Link>
              <Link
                to={`/contacts/${contact.id}/notes`}
                className="ld-drawer-nav-btn"
                onClick={onClose}
              >
                Notes ({contact._count?.notes ?? 0})
              </Link>
              <Link
                to={`/contacts/${contact.id}/documents`}
                className="ld-drawer-nav-btn"
                onClick={onClose}
              >
                Documents
              </Link>
            </div>
          </div>
        </div>

        <footer className="ld-drawer-footer">
          {permissions.canEdit && onConvert && contact.stage !== 'CUSTOMER' && (
            <button
              type="button"
              className="auth-btn btn-primary"
              onClick={() => {
                onClose();
                onConvert(contact);
              }}
            >
              Convert to Customer
            </button>
          )}
          <Link
            to={`/contacts/${contact.id}`}
            className="auth-btn btn-secondary"
            onClick={onClose}
          >
            Open Full Details
          </Link>
        </footer>
      </aside>
    </div>
  );
};

/* ============================================================================
   6. CONVERT CONTACT TO CUSTOMER MODAL
   ============================================================================ */

interface ConvertContactModalProps {
  contact: Contact | null;
  pipelines: PipelineOption[];
  isOpen: boolean;
  onClose: () => void;
  onConvert: (
    contactId: string,
    payload: ConvertContactPayload,
  ) => Promise<ConvertContactResponse>;
}

export const ConvertContactModal: React.FC<ConvertContactModalProps> = ({
  contact,
  pipelines,
  isOpen,
  onClose,
  onConvert,
}) => {
  const [createDeal, setCreateDeal] = useState(true);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState<string>('0');
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contact) {
      setCreateDeal(true);
      setDealTitle(
        `${contact.organization?.name || contactFullName(contact)} Expansion Deal`,
      );
      setDealValue('15000');
      const defaultPipe = pipelines.find((p) => p.isDefault) || pipelines[0];
      setPipelineId(defaultPipe?.id || '');
      setStageId(defaultPipe?.stages?.[0]?.id || '');
      setConfirmed(false);
      setError(null);
    }
  }, [isOpen, contact, pipelines]);

  const selectedPipeline = pipelines.find((p) => p.id === pipelineId);
  const stages = selectedPipeline?.stages || [];

  const handlePipelineChange = (newPipeId: string) => {
    setPipelineId(newPipeId);
    const pipe = pipelines.find((p) => p.id === newPipeId);
    setStageId(pipe?.stages?.[0]?.id || '');
  };

  if (!contact) return null;

  const handleSubmit = async () => {
    if (!confirmed) {
      setError('Please confirm that you want to convert this contact to a paying Customer.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConvert(contact.id, {
        dealTitle: createDeal && dealTitle.trim() ? dealTitle.trim() : undefined,
        dealValue: createDeal ? Number(dealValue) || 0 : undefined,
        pipelineId: createDeal && pipelineId ? pipelineId : undefined,
        stageId: createDeal && stageId ? stageId : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to convert contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      title={`Convert Contact to Customer — ${contactFullName(contact)}`}
      subtitle="Transition this contact's lifecycle stage to CUSTOMER and optionally create a new Deal."
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Confirm & Convert to Customer"
      isSubmitting={isSubmitting}
    >
      {error && <div className="lg-inline-alert">{error}</div>}

      <div className="ld-form-stack">
        <label className="lg-CheckRow">
          <input
            type="checkbox"
            checked={createDeal}
            onChange={(e) => setCreateDeal(e.target.checked)}
          />
          <span>Also create a linked Sales Deal for this customer</span>
        </label>

        {createDeal && (
          <div className="lg-form-grid">
            <Field label="Deal Title" htmlFor="conv-contact-deal-title" className="lg-span-2">
              <input
                id="conv-contact-deal-title"
                className="lg-input"
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                placeholder="e.g. Annual Enterprise Subscription"
              />
            </Field>

            <Field label="Deal Value (USD)" htmlFor="conv-contact-deal-value">
              <input
                id="conv-contact-deal-value"
                type="number"
                min={0}
                step="100"
                className="lg-input"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
              />
            </Field>

            {pipelines.length > 0 && (
              <>
                <Field label="Pipeline" htmlFor="conv-contact-pipeline">
                  <select
                    id="conv-contact-pipeline"
                    className="lg-select"
                    value={pipelineId}
                    onChange={(e) => handlePipelineChange(e.target.value)}
                  >
                    {pipelines.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Initial Stage"
                  htmlFor="conv-contact-stage"
                  className="lg-span-2"
                >
                  <select
                    id="conv-contact-stage"
                    className="lg-select"
                    value={stageId}
                    onChange={(e) => setStageId(e.target.value)}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </div>
        )}

        <div className="ld-confirm-callout">
          <label className="lg-CheckRow">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              I confirm converting <strong>{contactFullName(contact)}</strong> to{' '}
              <strong>CUSTOMER</strong>
              {createDeal ? ' and creating the associated deal.' : '.'}
            </span>
          </label>
        </div>
      </div>
    </FormModal>
  );
};
