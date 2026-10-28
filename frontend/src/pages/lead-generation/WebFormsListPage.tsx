import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { FormStatus, FormType, WebForm, WebFormQuery } from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { DataTable, type Column } from './components/DataTable';
import { Pagination } from './components/Pagination';
import { FilterBar, FilterSelect, SearchInput } from './components/FilterBar';
import { Badge } from './components/Cards';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import {
  FORM_STATUS_OPTIONS,
  FORM_TYPE_OPTIONS,
  formatNumber,
  formatPercent,
  humanize,
  labelFor,
  toneForStatus,
} from './leadGenConstants';
import { SlidersIcon as FileTextIcon, PlusIcon, EditIcon, TrashIcon } from '../../components/common/Icons';

const PAGE_SIZE = 10;

export const WebFormsListPage: React.FC = () => {
  const { workspaceId, canManage } = useLeadGenAccess();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formType, setFormType] = useState('');
  const [page, setPage] = useState(1);

  const [toDelete, setToDelete] = useState<WebForm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loader = useCallback(() => {
    const query: WebFormQuery = {
      page,
      limit: PAGE_SIZE,
      search,
      status: status as FormStatus | '',
      formType: formType as FormType | '',
      workspaceId,
    };
    return leadGenerationService.getForms(query);
  }, [page, search, status, formType, workspaceId]);

  const { data, isLoading, error, reload, clearError } = useAsyncData(loader);
  const hasFilters = Boolean(search || status || formType);

  const togglePublish = async (form: WebForm) => {
    setBusyId(form.id);
    setActionError(null);
    try {
      const res =
        form.status === 'PUBLISHED'
          ? await leadGenerationService.unpublishForm(form.id)
          : await leadGenerationService.publishForm(form.id);
      setActionSuccess(res?.message || 'Form status updated.');
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update form status.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const res = await leadGenerationService.deleteForm(toDelete.id);
      setActionSuccess(res?.message || 'Web form deleted.');
      setToDelete(null);
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete web form.');
      setToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<WebForm>[] = [
    {
      key: 'name',
      header: 'Form',
      render: (f) => (
        <div className="lg-cell-stack">
          {canManage ? (
            <Link to={`/lead-generation/forms/${f.id}/edit`} className="lg-row-link">
              {f.name}
            </Link>
          ) : (
            <span className="lg-row-link">{f.name}</span>
          )}
          <span className="lg-cell-sub">/{f.slug}</span>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (f) => <Badge tone="blue">{labelFor(FORM_TYPE_OPTIONS, f.formType)}</Badge> },
    { key: 'status', header: 'Status', render: (f) => <Badge tone={toneForStatus(f.status)}>{humanize(f.status)}</Badge> },
    { key: 'views', header: 'Views', align: 'right', render: (f) => formatNumber(f.viewsCount) },
    { key: 'subs', header: 'Submissions', align: 'right', render: (f) => formatNumber(f.submissionsCount) },
    { key: 'conv', header: 'Conversion', align: 'right', render: (f) => formatPercent(f.conversionRate) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (f) =>
        canManage ? (
          <div className="lg-row-actions">
            <button
              type="button"
              className="lg-link-btn"
              onClick={() => togglePublish(f)}
              disabled={busyId === f.id}
              id={`lg-form-publish-${f.id}`}
            >
              {f.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
            </button>
            <Link to={`/lead-generation/forms/${f.id}/edit`} className="lg-icon-btn" title="Edit" aria-label={`Edit ${f.name}`}>
              <EditIcon size={15} />
            </Link>
            <button
              type="button"
              className="lg-icon-btn danger"
              title="Delete"
              aria-label={`Delete ${f.name}`}
              onClick={() => setToDelete(f)}
            >
              <TrashIcon size={15} />
            </button>
          </div>
        ) : (
          <span className="lg-muted">View only</span>
        ),
    },
  ];

  return (
    <LeadGenLayout
      title="Web Forms"
      subtitle="Build and publish lead capture forms, and track how well they convert."
      icon={<FileTextIcon size={22} />}
      error={actionError || error}
      onDismissError={() => {
        setActionError(null);
        clearError();
      }}
      success={actionSuccess}
      onDismissSuccess={() => setActionSuccess(null)}
      actions={
        canManage && (
          <Link to="/lead-generation/forms/create" className="auth-btn btn-primary" id="lg-create-form-btn">
            <PlusIcon size={16} />
            <span>New Form</span>
          </Link>
        )
      }
    >
      <FilterBar
        onRefresh={reload}
        hasActiveFilters={hasFilters}
        onReset={() => {
          setSearch('');
          setStatus('');
          setFormType('');
          setPage(1);
        }}
      >
        <SearchInput
          id="lg-form-search"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search forms by name or slug..."
        />
        <FilterSelect
          id="lg-form-status"
          label="Status"
          value={status}
          options={FORM_STATUS_OPTIONS}
          allLabel="All statuses"
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <FilterSelect
          id="lg-form-type"
          label="Type"
          value={formType}
          options={FORM_TYPE_OPTIONS}
          allLabel="All types"
          onChange={(v) => {
            setFormType(v);
            setPage(1);
          }}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        rowKey={(f) => f.id}
        isLoading={isLoading}
        loadingMessage="Loading web forms..."
        emptyIcon={<FileTextIcon size={28} />}
        emptyTitle={hasFilters ? 'No matching forms' : 'No web forms yet'}
        emptyDescription={
          hasFilters ? 'Try different filters or reset them.' : 'Create a form to start capturing leads from your website.'
        }
        emptyAction={
          !hasFilters && canManage ? (
            <Link to="/lead-generation/forms/create" className="auth-btn btn-primary">
              <PlusIcon size={16} />
              <span>Create web form</span>
            </Link>
          ) : undefined
        }
        footer={<Pagination meta={data?.meta} onPageChange={setPage} disabled={isLoading} noun="forms" />}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Web Form"
        message="The form will stop accepting submissions. Existing leads are kept."
        itemName={toDelete?.name}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </LeadGenLayout>
  );
};
