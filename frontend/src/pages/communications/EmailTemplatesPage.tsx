import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { communicationService } from '../../services/communication.service';
import type {
  CommunicationContactRef,
  CommunicationDealRef,
  CommunicationLeadRef,
  EmailTemplateItem,
  RenderedTemplateResult,
} from '../../types/communication.types';
import { CommunicationsLayout } from './components/CommunicationsLayout';
import { Badge, SectionCard } from '../lead-generation/components/Cards';
import { FilterBar, SearchInput } from '../lead-generation/components/FilterBar';
import { FormModal } from '../lead-generation/components/FormParts';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import {
  EditIcon,
  EyeIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
} from '../../components/common/Icons';
import {
  DEFAULT_TEMPLATE_TOKENS,
  TEMPLATE_CATEGORY_OPTIONS,
  stripHtmlToText,
} from './communicationConstants';

export const EmailTemplatesPage: React.FC = () => {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Create / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<EmailTemplateItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SALES');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [isShared, setIsShared] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Live Render Preview Modal state
  const [previewTemplate, setPreviewTemplate] =
    useState<EmailTemplateItem | null>(null);
  const [previewContactId, setPreviewContactId] = useState('');
  const [previewLeadId, setPreviewLeadId] = useState('');
  const [previewDealId, setPreviewDealId] = useState('');
  const [renderedPreview, setRenderedPreview] =
    useState<RenderedTemplateResult | null>(null);
  const [rendering, setRendering] = useState(false);

  const [contacts, setContacts] = useState<CommunicationContactRef[]>([]);
  const [leads, setLeads] = useState<CommunicationLeadRef[]>([]);
  const [deals, setDeals] = useState<CommunicationDealRef[]>([]);

  // Delete Modal state
  const [deletingTemplate, setDeletingTemplate] =
    useState<EmailTemplateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      communicationService.getContactsLookup(),
      communicationService.getLeadsLookup(),
      communicationService.getDealsLookup(),
    ])
      .then(([c, l, d]) => {
        setContacts(c);
        setLeads(l);
        setDeals(d);
      })
      .catch(() => {});
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await communicationService.getTemplates({
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        limit: 50,
      });
      setTemplates(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.message || 'Failed to load email templates.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setName('');
    setDescription('');
    setCategory('SALES');
    setSubject('');
    setBodyHtml('');
    setIsShared(true);
    setModalOpen(true);
  };

  const openEditModal = (tpl: EmailTemplateItem) => {
    setEditingTemplate(tpl);
    setName(tpl.name);
    setDescription(tpl.description || '');
    setCategory(tpl.category || 'GENERAL');
    setSubject(tpl.subject);
    setBodyHtml(tpl.bodyHtml);
    setIsShared(tpl.isShared);
    setModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!name.trim() || !subject.trim() || !bodyHtml.trim()) {
      setError('Template name, subject, and body are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        subject: subject.trim(),
        bodyHtml: bodyHtml.trim(),
        bodyText: stripHtmlToText(bodyHtml),
        isShared,
      };

      if (editingTemplate) {
        await communicationService.updateTemplate(editingTemplate.id, payload);
        setBannerMessage(`Updated template "${name}".`);
      } else {
        await communicationService.createTemplate(payload);
        setBannerMessage(`Created template "${name}".`);
      }
      setModalOpen(false);
      await loadTemplates();
    } catch (err: any) {
      setError(err?.message || 'Failed to save email template.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClone = async (tpl: EmailTemplateItem) => {
    try {
      await communicationService.cloneTemplate(tpl.id);
      setBannerMessage(`Cloned "${tpl.name}".`);
      await loadTemplates();
    } catch (err: any) {
      setError(err?.message || 'Failed to clone template.');
    }
  };

  const handleOpenPreview = async (tpl: EmailTemplateItem) => {
    setPreviewTemplate(tpl);
    setRenderedPreview(null);
    setRendering(true);
    try {
      const res = await communicationService.renderTemplate(tpl.id, {
        contactId: previewContactId || undefined,
        leadId: previewLeadId || undefined,
        dealId: previewDealId || undefined,
      });
      setRenderedPreview(res);
    } catch {
      setRenderedPreview({
        templateId: tpl.id,
        templateName: tpl.name,
        subject: tpl.subject,
        bodyHtml: tpl.bodyHtml,
        resolvedVariables: {},
      });
    } finally {
      setRendering(false);
    }
  };

  const handleRefreshRender = async () => {
    if (!previewTemplate) return;
    setRendering(true);
    try {
      const res = await communicationService.renderTemplate(
        previewTemplate.id,
        {
          contactId: previewContactId || undefined,
          leadId: previewLeadId || undefined,
          dealId: previewDealId || undefined,
        },
      );
      setRenderedPreview(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to render template preview.');
    } finally {
      setRendering(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    setIsDeleting(true);
    try {
      await communicationService.deleteTemplate(deletingTemplate.id);
      setBannerMessage(`Deleted template "${deletingTemplate.name}".`);
      setDeletingTemplate(null);
      await loadTemplates();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete template.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <CommunicationsLayout
      title="Email Templates"
      subtitle="Create, manage, preview, and reuse dynamic email templates with CRM variable tokens."
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <button
            type="button"
            className="auth-btn btn-primary btn-size-small"
            onClick={openCreateModal}
          >
            <PlusIcon size={15} /> Create Template
          </button>
        </div>
      }
    >
      <FilterBar
        onRefresh={loadTemplates}
        onReset={() => {
          setSearch('');
          setCategoryFilter('');
        }}
        hasActiveFilters={Boolean(search || categoryFilter)}
      >
        <SearchInput
          value={search}
          onChange={(val: string) => setSearch(val)}
          placeholder="Search template name, subject, or body..."
        />

        <select
          className="lg-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by template category"
        >
          <option value="">All Categories</option>
          {TEMPLATE_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterBar>

      <SectionCard
        title={`Reusable Email Templates (${total})`}
        subtitle="Click 'Use in Compose' to populate an email immediately, or 'Preview' to test variable interpolation"
      >
        {loading ? (
          <div style={{ padding: '2.5rem' }}>
            <LoadingIndicator message="Loading templates..." />
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            title="No email templates found"
            description="Create your first reusable sales, follow-up, or onboarding template with dynamic {{variable}} tokens."
            action={
              <button
                type="button"
                className="auth-btn btn-primary btn-size-small"
                onClick={openCreateModal}
              >
                <PlusIcon size={14} /> Create Template
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition-all hover:border-blue-300"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone="blue">{tpl.category}</Badge>
                      {tpl.isShared && <Badge tone="green">Shared</Badge>}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      Updated {formatDateTime(tpl.updatedAt)}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-gray-900">
                    {tpl.name}
                  </h3>
                  {tpl.description && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {tpl.description}
                    </p>
                  )}

                  <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs">
                    <p className="font-semibold text-gray-800">
                      Subject: {tpl.subject}
                    </p>
                    <p className="mt-1 line-clamp-3 text-gray-600">
                      {stripHtmlToText(tpl.bodyHtml)}
                    </p>
                  </div>

                  {tpl.variables && tpl.variables.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {tpl.variables.map((v) => (
                        <span
                          key={v}
                          className="rounded bg-purple-50 px-1.5 py-0.5 font-mono text-[10px] text-purple-800"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/communications/compose?templateId=${tpl.id}`)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <SendIcon size={13} /> Use in Compose
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(tpl)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      title="Preview with CRM record"
                    >
                      <EyeIcon size={13} /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(tpl)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      title="Edit template"
                    >
                      <EditIcon size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClone(tpl)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      title="Clone template"
                    >
                      Clone
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTemplate(tpl)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      title="Delete template"
                    >
                      <TrashIcon size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Create / Edit Template Modal */}
      <FormModal
        isOpen={modalOpen}
        title={editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
        subtitle="Use {{contact.firstName}}, {{deal.title}}, or {{user.name}} tokens for automatic personalization"
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveTemplate}
        submitLabel={editingTemplate ? 'Save Changes' : 'Create Template'}
        isSaving={isSaving}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Enterprise Demo Follow-up"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                {TEMPLATE_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When should reps use this template?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Email Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Next steps for {{deal.title}} with {{contact.firstName}}"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
              <label className="text-xs font-semibold text-gray-700">
                Template Body <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1">
                {DEFAULT_TEMPLATE_TOKENS.slice(0, 5).map((item) => (
                  <button
                    key={item.token}
                    type="button"
                    onClick={() =>
                      setBodyHtml((prev) => `${prev}${prev ? ' ' : ''}${item.token}`)
                    }
                    className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-blue-50"
                  >
                    + {item.token}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={7}
              required
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="Hi {{contact.firstName}}, thank you for exploring {{deal.title}}..."
              className="w-full rounded-lg border border-gray-300 p-3 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              className="rounded border-gray-300 text-blue-600"
            />
            <span>Share template with all workspace team members</span>
          </label>
        </div>
      </FormModal>

      {/* Live Render Preview Modal */}
      {previewTemplate && (
        <FormModal
          isOpen={Boolean(previewTemplate)}
          title={`Preview Template: ${previewTemplate.name}`}
          subtitle="Select a Contact, Lead, or Deal to test live variable interpolation"
          onClose={() => setPreviewTemplate(null)}
          onSubmit={() => {
            navigate(
              `/communications/compose?templateId=${previewTemplate.id}&contactId=${previewContactId}&leadId=${previewLeadId}&dealId=${previewDealId}`,
            );
          }}
          submitLabel="Open in Compose Email"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <select
                value={previewContactId}
                onChange={(e) => setPreviewContactId(e.target.value)}
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs"
              >
                <option value="">Sample Contact</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>

              <select
                value={previewLeadId}
                onChange={(e) => setPreviewLeadId(e.target.value)}
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs"
              >
                <option value="">Sample Lead</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>

              <select
                value={previewDealId}
                onChange={(e) => setPreviewDealId(e.target.value)}
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs"
              >
                <option value="">Sample Deal</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleRefreshRender}
              disabled={rendering}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              {rendering
                ? 'Rendering Preview...'
                : 'Interpolate with Selected Records'}
            </button>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs">
              <p className="font-bold text-gray-900">
                Subject: {renderedPreview?.subject || previewTemplate.subject}
              </p>
              <div className="mt-2.5 whitespace-pre-wrap border-t border-gray-200 pt-2.5 text-gray-800">
                {stripHtmlToText(
                  renderedPreview?.bodyHtml || previewTemplate.bodyHtml,
                )}
              </div>
            </div>
          </div>
        </FormModal>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deletingTemplate)}
        title="Delete Email Template"
        message={`Are you sure you want to delete template "${deletingTemplate?.name || ''}"?`}
        confirmLabel="Delete Template"
        isLoading={isDeleting}
        onClose={() => setDeletingTemplate(null)}
        onConfirm={handleConfirmDelete}
      />
    </CommunicationsLayout>
  );
};

export default EmailTemplatesPage;
