import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentService } from '../../services/document.service';
import type {
  DocumentContactRef,
  DocumentDealRef,
  DocumentEntityType,
  DocumentLeadRef,
  DocumentOrgRef,
  DocumentRecord,
} from '../../types/document.types';
import { DocumentsLayout } from './components/DocumentsLayout';
import { Badge, SectionCard } from '../lead-generation/components/Cards';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import {
  EditIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from '../../components/common/Icons';
import {
  DOCUMENT_ENTITY_TYPE_OPTIONS,
  formatFileSize,
  getDocumentRelatedLinks,
  getDocumentTypeBadgeInfo,
} from './documentConstants';

export const DocumentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Quick CRM attachment state
  const [entityType, setEntityType] = useState<DocumentEntityType>('DEAL');
  const [entityId, setEntityId] = useState('');
  const [attaching, setAttaching] = useState(false);

  const [contacts, setContacts] = useState<DocumentContactRef[]>([]);
  const [leads, setLeads] = useState<DocumentLeadRef[]>([]);
  const [deals, setDeals] = useState<DocumentDealRef[]>([]);
  const [organizations, setOrganizations] = useState<DocumentOrgRef[]>([]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDocument = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getDocumentById(id);
      setDoc(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load document details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  useEffect(() => {
    Promise.all([
      documentService.getContactsLookup(),
      documentService.getLeadsLookup(),
      documentService.getDealsLookup(),
      documentService.getOrganizationsLookup(),
    ])
      .then(([c, l, d, o]) => {
        setContacts(c);
        setLeads(l);
        setDeals(d);
        setOrganizations(o);
      })
      .catch(() => {});
  }, []);

  const handleAttachRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc || !entityId) return;
    setAttaching(true);
    setError(null);
    try {
      await documentService.attachDocument(doc.id, {
        entityType,
        entityId,
        contactId: entityType === 'CONTACT' ? entityId : undefined,
        leadId: entityType === 'LEAD' ? entityId : undefined,
        dealId: entityType === 'DEAL' ? entityId : undefined,
      });
      setEntityId('');
      setBannerMessage(`Attached document to ${entityType.toLowerCase()} record.`);
      await loadDocument();
    } catch (err: any) {
      setError(err?.message || 'Failed to attach document to record.');
    } finally {
      setAttaching(false);
    }
  };

  const handleDetachRecord = async (attachmentId: string) => {
    if (!doc) return;
    try {
      await documentService.detachDocument(doc.id, attachmentId);
      setBannerMessage('Detached document from CRM record.');
      await loadDocument();
    } catch (err: any) {
      setError(err?.message || 'Failed to detach document.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!doc) return;
    setIsDeleting(true);
    try {
      await documentService.deleteDocument(doc.id);
      navigate('/documents');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete document.');
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <DocumentsLayout
        title="Document Details"
        subtitle="Loading file metadata and linked CRM records..."
      >
        <div className="lg-card" style={{ padding: '2.5rem' }}>
          <LoadingIndicator message="Loading document details..." />
        </div>
      </DocumentsLayout>
    );
  }

  if (!doc) {
    return (
      <DocumentsLayout
        title="Document Not Found"
        subtitle="The requested document could not be loaded."
        error={error}
      >
        <EmptyState
          title="Document not found"
          description="It may have been deleted from the repository."
          action={
            <Link
              to="/documents"
              className="auth-btn btn-primary btn-size-small"
            >
              Back to All Documents
            </Link>
          }
        />
      </DocumentsLayout>
    );
  }

  const badge = getDocumentTypeBadgeInfo(doc);
  const relatedLinks = getDocumentRelatedLinks(doc);

  return (
    <DocumentsLayout
      title={doc.displayTitle || doc.originalName}
      subtitle={`${badge.category} · ${formatFileSize(doc.size)} · Uploaded ${formatDateTime(doc.createdAt)}`}
      activeDocument={doc}
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <Link
            to={`/documents/${doc.id}/preview`}
            className="auth-btn btn-primary btn-size-small"
          >
            <EyeIcon size={15} /> Preview Document
          </Link>
          <Link
            to={`/documents/${doc.id}/edit`}
            className="auth-btn btn-secondary btn-size-small"
          >
            <EditIcon size={15} /> Edit Document
          </Link>
          <Link
            to={`/documents/${doc.id}/sharing`}
            className="auth-btn btn-secondary btn-size-small"
          >
            <UsersIcon size={15} /> Share
          </Link>
          <button
            type="button"
            className="auth-btn btn-secondary btn-size-small"
            onClick={() => setDeleteOpen(true)}
          >
            <TrashIcon size={15} /> Delete
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Document Overview & Linked CRM Entities */}
        <div className="space-y-6 lg:col-span-8">
          <SectionCard
            title="Document Metadata & Overview"
            subtitle="Core file properties stored in the CRM Files service"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone={badge.tone}>{badge.shortLabel}</Badge>
              <Badge tone="slate">{doc.mimeType}</Badge>
              <Badge tone="blue">{formatFileSize(doc.size)}</Badge>
              {doc.isShared && <Badge tone="green">Shared</Badge>}
            </div>

            {doc.description && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs text-gray-800">
                <p className="font-semibold uppercase tracking-wider text-gray-500">
                  Description / Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap">{doc.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs">
                <span className="text-gray-500">Original Filename</span>
                <p className="mt-0.5 font-semibold text-gray-900">
                  {doc.originalName}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs">
                <span className="text-gray-500">Storage Path</span>
                <p className="mt-0.5 truncate font-mono text-gray-800">
                  {doc.path}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs">
                <span className="text-gray-500">Uploaded At</span>
                <p className="mt-0.5 font-semibold text-gray-900">
                  {formatDateTime(doc.createdAt)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs">
                <span className="text-gray-500">Last Updated</span>
                <p className="mt-0.5 font-semibold text-gray-900">
                  {formatDateTime(doc.updatedAt || doc.createdAt)}
                </p>
              </div>
            </div>

            {doc.tags && doc.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500">Tags:</span>
                {doc.tags.map((tag) => (
                  <Badge key={tag} tone="purple">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={`Linked CRM Records (${relatedLinks.length})`}
            subtitle="Contacts, Leads, Deals, and Organizations associated with this document"
          >
            {relatedLinks.length === 0 ? (
              <p className="text-xs text-gray-500">
                This document is not currently attached to any Contact, Lead, or
                Deal. Use the form below to link it.
              </p>
            ) : (
              <div className="space-y-2.5">
                {relatedLinks.map((rel) => (
                  <div
                    key={rel.attachmentId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge tone="blue">{rel.entityType}</Badge>
                      <Link
                        to={rel.path}
                        className="font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {rel.label}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={rel.path}
                        className="text-blue-600 hover:underline"
                      >
                        Open Record →
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDetachRecord(rel.attachmentId)}
                        className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100"
                      >
                        Detach
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Attach to another CRM record */}
            <form
              onSubmit={handleAttachRecord}
              className="mt-4 grid grid-cols-1 gap-2.5 border-t border-gray-100 pt-4 sm:grid-cols-3"
            >
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value as DocumentEntityType);
                  setEntityId('');
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800"
              >
                {DOCUMENT_ENTITY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Attach to {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800"
              >
                <option value="">— Select {entityType} —</option>
                {entityType === 'DEAL' &&
                  deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                {entityType === 'CONTACT' &&
                  contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                {entityType === 'LEAD' &&
                  leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                {entityType === 'ORGANIZATION' &&
                  organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
              </select>

              <button
                type="submit"
                disabled={attaching || !entityId}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <PlusIcon size={14} />
                {attaching ? 'Attaching...' : 'Attach Record'}
              </button>
            </form>
          </SectionCard>
        </div>

        {/* Right Column: Uploader & Sharing Summary */}
        <div className="space-y-6 lg:col-span-4">
          <SectionCard
            title="Uploaded By"
            subtitle="Document owner & uploader details"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <UserIcon size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {doc.uploadedBy?.name || 'CRM User'}
                </p>
                {doc.uploadedBy?.email && (
                  <p className="text-xs text-gray-500">{doc.uploadedBy.email}</p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Sharing & Permissions"
            subtitle="Teammates and workspace access"
          >
            <div className="space-y-3 text-xs">
              {doc.shares && doc.shares.length > 0 ? (
                <div className="space-y-2">
                  {doc.shares.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <span className="font-medium text-gray-800">
                        {s.userName || s.userEmail || s.targetType}
                      </span>
                      <Badge tone="green">{s.permission}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No direct user permission overrides configured yet.
                </p>
              )}

              <Link
                to={`/documents/${doc.id}/sharing`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                <UsersIcon size={14} /> Manage Sharing & Access →
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteOpen}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${doc.displayTitle || doc.originalName}"?`}
        confirmLabel="Delete Document"
        isLoading={isDeleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </DocumentsLayout>
  );
};

export default DocumentDetailsPage;

