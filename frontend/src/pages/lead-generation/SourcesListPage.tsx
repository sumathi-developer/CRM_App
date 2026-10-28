import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { LeadSource, LeadSourceQuery, LeadSourceType } from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { DataTable, type Column } from './components/DataTable';
import { Pagination } from './components/Pagination';
import { FilterBar, FilterSelect, SearchInput } from './components/FilterBar';
import { Badge } from './components/Cards';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import {
  SOURCE_TYPE_OPTIONS,
  formatCurrency,
  formatDate,
  formatNumber,
  humanize,
  labelFor,
  toneForStatus,
} from './leadGenConstants';
import { GlobeIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon } from '../../components/common/Icons';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export const SourcesListPage: React.FC = () => {
  const { workspaceId, canManage } = useLeadGenAccess();

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [toDelete, setToDelete] = useState<LeadSource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loader = useCallback(() => {
    const query: LeadSourceQuery = {
      page,
      limit: PAGE_SIZE,
      search,
      type: type as LeadSourceType | '',
      status,
      workspaceId,
    };
    return leadGenerationService.getSources(query);
  }, [page, search, type, status, workspaceId]);

  const { data, isLoading, error, reload, clearError } = useAsyncData(loader);

  const hasFilters = Boolean(search || type || status);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const res = await leadGenerationService.deleteSource(toDelete.id);
      setActionSuccess(res?.message || 'Lead source removed.');
      setToDelete(null);
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete lead source.');
      setToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<LeadSource>[] = [
    {
      key: 'name',
      header: 'Source',
      render: (s) => (
        <div className="lg-cell-stack">
          <Link to={`/lead-generation/sources/${s.id}`} className="lg-row-link">
            {s.name}
          </Link>
          <span className="lg-cell-sub">{s.code || 'No code'}</span>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (s) => <Badge tone="blue">{labelFor(SOURCE_TYPE_OPTIONS, s.type)}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <div className="lg-badge-row">
          <Badge tone={toneForStatus(s.status)}>{humanize(s.status)}</Badge>
          {s.isSystem && <Badge tone="purple">System</Badge>}
        </div>
      ),
    },
    { key: 'leads', header: 'Leads', align: 'right', render: (s) => formatNumber(s._count?.leads) },
    { key: 'forms', header: 'Forms', align: 'right', render: (s) => formatNumber(s._count?.webForms) },
    { key: 'cost', header: 'Cost', align: 'right', render: (s) => formatCurrency(s.cost) },
    { key: 'created', header: 'Created', render: (s) => formatDate(s.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="lg-row-actions">
          <Link to={`/lead-generation/sources/${s.id}`} className="lg-icon-btn" title="View details" aria-label={`View ${s.name}`}>
            <EyeIcon size={15} />
          </Link>
          {canManage && (
            <>
              <Link to={`/lead-generation/sources/${s.id}/edit`} className="lg-icon-btn" title="Edit" aria-label={`Edit ${s.name}`}>
                <EditIcon size={15} />
              </Link>
              <button
                type="button"
                className="lg-icon-btn danger"
                title={s.isSystem ? 'Deactivate system source' : 'Delete'}
                aria-label={`Delete ${s.name}`}
                onClick={() => setToDelete(s)}
              >
                <TrashIcon size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <LeadGenLayout
      title="Lead Sources"
      subtitle="Channels and campaigns that generate leads, with cost tracking for ROI analytics."
      icon={<GlobeIcon size={22} />}
      error={actionError || error}
      onDismissError={() => {
        setActionError(null);
        clearError();
      }}
      success={actionSuccess}
      onDismissSuccess={() => setActionSuccess(null)}
      actions={
        canManage && (
          <Link to="/lead-generation/sources/create" className="auth-btn btn-primary" id="lg-create-source-btn">
            <PlusIcon size={16} />
            <span>New Source</span>
          </Link>
        )
      }
    >
      <FilterBar
        onRefresh={reload}
        hasActiveFilters={hasFilters}
        onReset={() => {
          setSearch('');
          setType('');
          setStatus('');
          setPage(1);
        }}
      >
        <SearchInput
          id="lg-source-search"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name, code or description..."
        />
        <FilterSelect
          id="lg-source-type"
          label="Type"
          value={type}
          options={SOURCE_TYPE_OPTIONS}
          allLabel="All types"
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
        />
        <FilterSelect
          id="lg-source-status"
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          allLabel="All statuses"
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        loadingMessage="Loading lead sources..."
        emptyIcon={<GlobeIcon size={28} />}
        emptyTitle={hasFilters ? 'No matching sources' : 'No lead sources yet'}
        emptyDescription={
          hasFilters
            ? 'Try different filters or reset them.'
            : 'Create your first lead source to attribute leads and track marketing ROI.'
        }
        emptyAction={
          !hasFilters && canManage ? (
            <Link to="/lead-generation/sources/create" className="auth-btn btn-primary">
              <PlusIcon size={16} />
              <span>Create lead source</span>
            </Link>
          ) : undefined
        }
        footer={<Pagination meta={data?.meta} onPageChange={setPage} disabled={isLoading} noun="sources" />}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title={toDelete?.isSystem ? 'Deactivate System Source' : 'Delete Lead Source'}
        message={
          toDelete?.isSystem
            ? 'System sources cannot be deleted. This source will be marked as inactive instead.'
            : 'Leads already attributed to this source keep their history. The source itself will be removed.'
        }
        itemName={toDelete?.name}
        confirmLabel={toDelete?.isSystem ? 'Deactivate' : 'Delete'}
        isLoading={isDeleting}
      />
    </LeadGenLayout>
  );
};
