import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentService } from '../../services/document.service';
import type {
  DocumentContactRef,
  DocumentDealRef,
  DocumentEntityType,
  DocumentLeadRef,
  DocumentOrgRef,
  DocumentPermissionLevel,
  DocumentRecord,
  DocumentUploaderRef,
} from '../../types/document.types';
import { DocumentsLayout } from './components/DocumentsLayout';
import { Badge, SectionCard } from '../lead-generation/components/Cards';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import {
  CheckIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from '../../components/common/Icons';
import {
  DOCUMENT_ENTITY_TYPE_OPTIONS,
  DOCUMENT_PERMISSION_OPTIONS,
  getDocumentRelatedLinks,
} from './documentConstants';

export const DocumentSharingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [allDocs, setAllDocs] = useState<DocumentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>(id || '');
  const [doc, setDoc] = useState<DocumentRecord | null>(null);

  const [users, setUsers] = useState<DocumentUploaderRef[]>([]);
  const [contacts, setContacts] = useState<DocumentContactRef[]>([]);
  const [leads, setLeads] = useState<DocumentLeadRef[]>([]);
  const [deals, setDeals] = useState<DocumentDealRef[]>([]);
  const [organizations, setOrganizations] = useState<DocumentOrgRef[]>([]);

  const [shareUserId, setShareUserId] = useState('');
  const [permission, setPermission] = useState<DocumentPermissionLevel>('VIEW');
  const [entityType, setEntityType] = useState<DocumentEntityType>('DEAL');
  const [entityId, setEntityId] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const loadSharingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await documentService.getAllDocuments();
      setAllDocs(list);

      const targetId = id || selectedId || list[0]?.id || '';
      if (targetId) {
        setSelectedId(targetId);
        const detail = await documentService.getDocumentById(targetId);
        setDoc(detail);
      } else {
        setDoc(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load document sharing settings.');
    } finally {
      setLoading(false);
    }
  }, [id, selectedId]);

  useEffect(() => {
    loadSharingData();
  }, [loadSharingData]);

  useEffect(() => {
    Promise.all([
      documentService.getUsersLookup(),
      documentService.getContactsLookup(),
      documentService.getLeadsLookup(),
      documentService.getDealsLookup(),
      documentService.getOrganizationsLookup(),
    ])
      .then(([u, c, l, d, o]) => {
        setUsers(u);
        setContacts(c);
        setLeads(l);
        setDeals(d);
        setOrganizations(o);
      })
      .catch(() => {});
  }, []);

  const handleSelectDocument = (nextId: string) => {
    setSelectedId(nextId);
    if (nextId) {
      navigate(`/documents/${nextId}/sharing`);
    }
  };

  const handleShareWithUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc || !shareUserId) return;
    const targetUser = users.find((u) => u.id === shareUserId);
    if (!targetUser) return;

    documentService.addDocumentShare(doc.id, {
      targetType: 'USER',
      userId: targetUser.id,
      userName: targetUser.name,
      userEmail: targetUser.email,
      permission,
    });
    setShareUserId('');
    setBannerMessage(
      `Shared document with ${targetUser.name} (${permission} access).`,
    );
    loadSharingData();
  };

  const handleRevokeShare = (shareId: string) => {
    if (!doc) return;
    documentService.removeDocumentShare(doc.id, shareId);
    setBannerMessage('Revoked user access.');
    loadSharingData();
  };

  const handleAttachEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc || !entityId) return;
    try {
      await documentService.attachDocument(doc.id, {
        entityType,
        entityId,
        contactId: entityType === 'CONTACT' ? entityId : undefined,
        leadId: entityType === 'LEAD' ? entityId : undefined,
        dealId: entityType === 'DEAL' ? entityId : undefined,
      });
      setEntityId('');
      setBannerMessage(`Shared document with ${entityType.toLowerCase()} record.`);
      await loadSharingData();
    } catch (err: any) {
      setError(err?.message || 'Failed to attach document to CRM record.');
    }
  };

  const handleDetachEntity = async (attachmentId: string) => {
    if (!doc) return;
    try {
      await documentService.detachDocument(doc.id, attachmentId);
      setBannerMessage('Removed CRM record attachment.');
      await loadSharingData();
    } catch (err: any) {
      setError(err?.message || 'Failed to detach record.');
    }
  };

  const handleCopyShareLink = () => {
    if (!doc) return;
    const shareUrl = `${window.location.origin}/documents/${doc.id}/preview`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <DocumentsLayout
        title="Document Sharing"
        subtitle="Loading document sharing and permissions..."
      >
        <div className="lg-card" style={{ padding: '2.5rem' }}>
          <LoadingIndicator message="Loading sharing configuration..." />
        </div>
      </DocumentsLayout>
    );
  }

  if (!doc) {
    return (
      <DocumentsLayout
        title="Document Sharing"
        subtitle="Select or upload a document to configure sharing"
        error={error}
      >
        <EmptyState
          title="No documents available to share"
          description="Upload a document first to share it with teammates or CRM records."
          action={
            <Link
              to="/documents/upload"
              className="auth-btn btn-primary btn-size-small"
            >
              <PlusIcon size={14} /> Upload Document
            </Link>
          }
        />
      </DocumentsLayout>
    );
  }

  const relatedLinks = getDocumentRelatedLinks(doc);
  const shareUrl = `${window.location.origin}/documents/${doc.id}/preview`;

  return (
    <DocumentsLayout
      title={`Share: ${doc.displayTitle || doc.originalName}`}
      subtitle="Manage team member permissions, shareable preview links, and linked CRM records."
      activeDocument={doc}
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <select
            className="lg-select"
            value={doc.id}
            onChange={(e) => handleSelectDocument(e.target.value)}
            aria-label="Switch document to share"
          >
            {allDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.displayTitle || d.originalName}
              </option>
            ))}
          </select>

          <Link
            to={`/documents/${doc.id}/preview`}
            className="auth-btn btn-secondary btn-size-small"
          >
            <EyeIcon size={14} /> Preview
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Team Member Access & Permissions */}
        <div className="space-y-6 lg:col-span-6">
          <SectionCard
            title="Share with Team Members"
            subtitle="Grant view, comment, or edit permissions according to role access"
          >
            <form onSubmit={handleShareWithUser} className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <select
                  value={shareUserId}
                  onChange={(e) => setShareUserId(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800"
                >
                  <option value="">— Select Team Member —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.email ? `(${u.email})` : ''}
                    </option>
                  ))}
                </select>

                <select
                  value={permission}
                  onChange={(e) =>
                    setPermission(e.target.value as DocumentPermissionLevel)
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800"
                >
                  {DOCUMENT_PERMISSION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!shareUserId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <UsersIcon size={14} /> Grant Access
              </button>
            </form>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="mb-2.5 text-xs font-semibold text-gray-700">
                Active User Permissions ({(doc.shares || []).length})
              </p>

              {!doc.shares || doc.shares.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Only the document owner and workspace admins currently have
                  explicit access.
                </p>
              ) : (
                <div className="space-y-2">
                  {doc.shares.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {s.userName || s.targetType}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {s.userEmail || 'Workspace Share'} · Shared{' '}
                          {formatDateTime(s.sharedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="green">{s.permission}</Badge>
                        <button
                          type="button"
                          onClick={() => handleRevokeShare(s.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Revoke access"
                        >
                          <TrashIcon size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Internal Workspace Preview Link"
            subtitle="Share direct preview link with authenticated workspace members"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700"
              />
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <CheckIcon size={13} />
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Right: Share / Attach to CRM Entities */}
        <div className="space-y-6 lg:col-span-6">
          <SectionCard
            title="Share with CRM Records (Deals, Contacts, Leads)"
            subtitle="Link this document to CRM records via the Files Attachment API"
          >
            <form onSubmit={handleAttachEntity} className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
                      {opt.label}
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
              </div>

              <button
                type="submit"
                disabled={!entityId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <PlusIcon size={14} /> Link to {entityType}
              </button>
            </form>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="mb-2.5 text-xs font-semibold text-gray-700">
                Attached CRM Records ({relatedLinks.length})
              </p>

              {relatedLinks.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Not attached to any CRM record yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {relatedLinks.map((rel) => (
                    <div
                      key={rel.attachmentId}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs"
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
                      <button
                        type="button"
                        onClick={() => handleDetachEntity(rel.attachmentId)}
                        className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100"
                      >
                        Detach
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </DocumentsLayout>
  );
};

export default DocumentSharingPage;

