import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { FormSubmission, SubmissionQuery, WebForm } from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { DataTable, type Column } from './components/DataTable';
import { Pagination } from './components/Pagination';
import { FilterBar, FilterSelect, SearchInput } from './components/FilterBar';
import { Badge } from './components/Cards';
import { FormModal } from './components/FormParts';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import {
  SUBMISSION_STATUS_OPTIONS,
  formatDateTime,
  humanize,
  toneForStatus,
} from './leadGenConstants';
import {
  SlidersIcon,
  ShieldIcon,
  EyeIcon,
  RefreshCwIcon,
} from '../../components/common/Icons';

const PAGE_SIZE = 10;

export const CaptureFormsPage: React.FC = () => {
  const { workspaceId, canManage } = useLeadGenAccess();

  const [search, setSearch] = useState('');
  const [formId, setFormId] = useState('');
  const [status, setStatus] = useState('');
  const [spamFilter, setSpamFilter] = useState('');
  const [page, setPage] = useState(1);

  // Forms list for filter
  const [forms, setForms] = useState<WebForm[]>([]);
  useEffect(() => {
    let ignore = false;
    leadGenerationService.getForms({ limit: 100, workspaceId }).then((res) => {
      if (!ignore) setForms(res.data);
    }).catch(() => {});
    return () => { ignore = true; };
  }, [workspaceId]);

  // Selected submission for payload viewer modal
  const [selectedSub, setSelectedSub] = useState<FormSubmission | null>(null);

  // Action states
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busySubId, setBusySubId] = useState<string | null>(null);

  const loader = useCallback(() => {
    const isSpam = spamFilter === 'true' ? true : spamFilter === 'false' ? false : undefined;
    const query: SubmissionQuery = {
      page,
      limit: PAGE_SIZE,
      search,
      formId: formId || undefined,
      status: status || undefined,
      isSpam,
      workspaceId,
    };
    return leadGenerationService.getSubmissions(query);
  }, [page, search, formId, status, spamFilter, workspaceId]);

  const { data, isLoading, error, reload, clearError } = useAsyncData(loader);
  const hasFilters = Boolean(search || formId || status || spamFilter);

  const handleToggleSpam = async (sub: FormSubmission) => {
    setBusySubId(sub.id);
    setActionError(null);
    try {
      await leadGenerationService.markSubmissionSpam(sub.id, !sub.isSpam);
      setActionSuccess(sub.isSpam ? 'Marked as legitimate submission.' : 'Submission marked as spam.');
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update spam status.');
    } finally {
      setBusySubId(null);
    }
  };

  const handleReprocess = async (sub: FormSubmission) => {
    setBusySubId(sub.id);
    setActionError(null);
    try {
      await leadGenerationService.reprocessSubmission(sub.id);
      setActionSuccess('Submission re-processed successfully.');
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to reprocess submission.');
    } finally {
      setBusySubId(null);
    }
  };

  const formFilterOptions = forms.map((f) => ({ value: f.id, label: f.name }));
  const spamOptions = [
    { value: 'false', label: 'Clean (Non-Spam)' },
    { value: 'true', label: 'Spam Only' },
  ];

  const columns: Column<FormSubmission>[] = [
    {
      key: 'form',
      header: 'Capture Form',
      render: (s) => (
        <div className="lg-cell-stack">
          <span className="lg-row-link">{s.form?.name || 'Unknown Form'}</span>
          <span className="lg-cell-sub">
            {s.leadSource?.name ? `Source: ${s.leadSource.name}` : s.form?.slug ? `/${s.form.slug}` : 'Web capture'}
          </span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Lead / Prospect',
      render: (s) => {
        const payloadData = s.payload || s.data || {};
        const email = s.lead?.email || payloadData.email || '—';
        const name = s.lead?.title || [payloadData.firstName, payloadData.lastName].filter(Boolean).join(' ') || 'Prospect';
        return (
          <div className="lg-cell-stack">
            <span style={{ fontWeight: 500 }}>{name}</span>
            <span className="lg-cell-sub">{email}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <div className="lg-badge-row">
          <Badge tone={toneForStatus(s.status)}>{humanize(s.status)}</Badge>
          {s.isSpam && <Badge tone="red">Spam</Badge>}
        </div>
      ),
    },
    {
      key: 'leadCreated',
      header: 'Generated Lead',
      render: (s) =>
        s.lead ? (
          <div className="lg-cell-stack">
            <span style={{ fontWeight: 500 }}>{s.lead.title || 'Lead created'}</span>
            <span className="lg-cell-sub">Status: {s.lead.status}</span>
          </div>
        ) : (
          <span className="lg-muted">None</span>
        ),
    },
    {
      key: 'submittedAt',
      header: 'Captured At',
      render: (s) => formatDateTime(s.submittedAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="lg-row-actions">
          <button
            type="button"
            className="lg-icon-btn"
            title="Inspect submission payload"
            aria-label="Inspect submission payload"
            onClick={() => setSelectedSub(s)}
          >
            <EyeIcon size={15} />
          </button>
          {canManage && (
            <>
              <button
                type="button"
                className={`lg-icon-btn ${s.isSpam ? '' : 'danger'}`}
                title={s.isSpam ? 'Mark not spam' : 'Mark as spam'}
                aria-label={s.isSpam ? 'Mark not spam' : 'Mark as spam'}
                onClick={() => handleToggleSpam(s)}
                disabled={busySubId === s.id}
              >
                <ShieldIcon size={15} />
              </button>
              <button
                type="button"
                className="lg-icon-btn"
                title="Reprocess submission"
                aria-label="Reprocess submission"
                onClick={() => handleReprocess(s)}
                disabled={busySubId === s.id}
              >
                <RefreshCwIcon size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const payloadObject = selectedSub ? (selectedSub.payload || selectedSub.data || {}) : {};

  return (
    <LeadGenLayout
      title="Lead Capture Forms"
      subtitle="Monitor incoming form submissions, inspect raw capture payloads, filter spam, and re-trigger pipeline ingestion."
      icon={<SlidersIcon size={22} />}
      error={actionError || error}
      onDismissError={() => {
        setActionError(null);
        clearError();
      }}
      success={actionSuccess}
      onDismissSuccess={() => setActionSuccess(null)}
      actions={
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/lead-generation/forms" className="auth-btn btn-ghost">
            <span>Manage Web Forms</span>
          </Link>
          {canManage && (
            <Link to="/lead-generation/forms/create" className="auth-btn btn-primary">
              <span>New Form</span>
            </Link>
          )}
        </div>
      }
    >
      <FilterBar
        onRefresh={reload}
        hasActiveFilters={hasFilters}
        onReset={() => {
          setSearch('');
          setFormId('');
          setStatus('');
          setSpamFilter('');
          setPage(1);
        }}
      >
        <SearchInput
          id="lg-sub-search"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by prospect name, email..."
        />
        <FilterSelect
          id="lg-sub-form"
          label="Capture Form"
          value={formId}
          options={formFilterOptions}
          allLabel="All forms"
          onChange={(v) => {
            setFormId(v);
            setPage(1);
          }}
        />
        <FilterSelect
          id="lg-sub-status"
          label="Status"
          value={status}
          options={SUBMISSION_STATUS_OPTIONS}
          allLabel="All statuses"
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <FilterSelect
          id="lg-sub-spam"
          label="Spam Filter"
          value={spamFilter}
          options={spamOptions}
          allLabel="All submissions"
          onChange={(v) => {
            setSpamFilter(v);
            setPage(1);
          }}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        loadingMessage="Loading capture submissions..."
        emptyIcon={<SlidersIcon size={28} />}
        emptyTitle={hasFilters ? 'No matching submissions' : 'No submissions captured yet'}
        emptyDescription={
          hasFilters
            ? 'Try broadening your filter criteria.'
            : 'Submissions captured via published web forms or landing pages will appear here.'
        }
        footer={<Pagination meta={data?.meta} onPageChange={setPage} disabled={isLoading} noun="submissions" />}
      />

      {/* Submission Inspector Modal */}
      <FormModal
        isOpen={Boolean(selectedSub)}
        title="Form Submission Details"
        subtitle={selectedSub ? `Captured on ${formatDateTime(selectedSub.submittedAt)}` : undefined}
        onClose={() => setSelectedSub(null)}
        onSubmit={() => setSelectedSub(null)}
        submitLabel="Done"
        wide
      >
        {selectedSub && (
          <div className="lg-cell-stack">
            <div className="lg-grid-2">
              <div className="lg-card" style={{ padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Form & Processing Info
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div>
                    <strong>Form: </strong> {selectedSub.form?.name || '—'}
                  </div>
                  <div>
                    <strong>Status: </strong>{' '}
                    <Badge tone={toneForStatus(selectedSub.status)}>{selectedSub.status}</Badge>
                  </div>
                  <div>
                    <strong>Spam Filter: </strong>{' '}
                    {selectedSub.isSpam ? (
                      <span style={{ color: '#ef4444' }}>Marked as Spam</span>
                    ) : (
                      <span style={{ color: '#22c55e' }}>Clean</span>
                    )}
                  </div>
                  <div>
                    <strong>Attributed Source: </strong>{' '}
                    {selectedSub.leadSource?.name || 'Organic / Direct'}
                  </div>
                </div>
              </div>

              <div className="lg-card" style={{ padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Associated Lead
                </h4>
                {selectedSub.lead ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div>
                      <strong>Lead Title: </strong> {selectedSub.lead.title}
                    </div>
                    <div>
                      <strong>Email: </strong> {selectedSub.lead.email || '—'}
                    </div>
                    <div>
                      <strong>Status: </strong> {selectedSub.lead.status}
                    </div>
                    <div>
                      <strong>Lead Score: </strong> {selectedSub.lead.leadScore ?? '—'}
                    </div>
                  </div>
                ) : (
                  <p className="lg-muted" style={{ margin: 0 }}>
                    No lead generated yet from this submission (it may have been blocked as spam or pending review).
                  </p>
                )}
              </div>
            </div>

            <div className="lg-card" style={{ padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Captured Form Fields (Payload)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {Object.entries(payloadObject).map(([key, val]) => (
                  <div key={key} style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {key}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, wordBreak: 'break-word', marginTop: '2px' }}>
                      {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </FormModal>
    </LeadGenLayout>
  );
};
