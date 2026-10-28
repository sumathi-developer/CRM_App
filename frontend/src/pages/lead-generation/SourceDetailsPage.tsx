import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { RecentSourceLead } from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { Badge, ScorePill, SectionCard, StatCard } from './components/Cards';
import { DataTable, type Column } from './components/DataTable';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import {
  SOURCE_TYPE_OPTIONS,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  fullName,
  humanize,
  labelFor,
  toneForStatus,
} from './leadGenConstants';
import {
  GlobeIcon,
  EditIcon,
  TrashIcon,
  ArrowLeftIcon,
  TargetIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  DollarSignIcon,
  AwardIcon,
} from '../../components/common/Icons';

const LEAD_COLUMNS: Column<RecentSourceLead>[] = [
  {
    key: 'lead',
    header: 'Lead',
    render: (l) => (
      <div className="lg-cell-stack">
        <strong>{fullName(l.firstName, l.lastName, l.title || 'Unnamed lead')}</strong>
        <span className="lg-cell-sub">{l.email || '—'}</span>
      </div>
    ),
  },
  { key: 'status', header: 'Status', render: (l) => <Badge tone={toneForStatus(l.status)}>{humanize(l.status)}</Badge> },
  { key: 'score', header: 'Score', align: 'center', render: (l) => <ScorePill score={l.leadScore} /> },
  { key: 'value', header: 'Value', align: 'right', render: (l) => formatCurrency(l.estimatedValue) },
  { key: 'created', header: 'Created', render: (l) => formatDate(l.createdAt) },
];

export const SourceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManage } = useLeadGenAccess();

  const loader = useCallback(() => leadGenerationService.getSourceById(id as string), [id]);
  const { data: source, isLoading, error, clearError } = useAsyncData(loader);

  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!source) return;
    setIsDeleting(true);
    try {
      const res = await leadGenerationService.deleteSource(source.id);
      navigate('/lead-generation/sources', { state: { flash: res?.message || 'Lead source removed.' } });
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete lead source.');
      setShowDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const m = source?.metrics;

  return (
    <LeadGenLayout
      title={source?.name || 'Lead Source'}
      subtitle={source?.description || 'Source details and performance.'}
      icon={<GlobeIcon size={22} />}
      error={actionError || error}
      onDismissError={() => {
        setActionError(null);
        clearError();
      }}
      breadcrumbs={
        <>
          <Link to="/lead-generation/sources">Lead Sources</Link>
          <span>/</span>
          <span>{source?.name || 'Details'}</span>
        </>
      }
      actions={
        <>
          <Link to="/lead-generation/sources" className="auth-btn btn-ghost">
            <ArrowLeftIcon size={16} />
            <span>Back</span>
          </Link>
          {canManage && source && (
            <>
              <Link to={`/lead-generation/sources/${source.id}/edit`} className="auth-btn btn-secondary">
                <EditIcon size={16} />
                <span>Edit</span>
              </Link>
              <button type="button" className="auth-btn btn-danger" onClick={() => setShowDelete(true)}>
                <TrashIcon size={16} />
                <span>{source.isSystem ? 'Deactivate' : 'Delete'}</span>
              </button>
            </>
          )}
        </>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading lead source..." />
        </div>
      ) : !source ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Lead source not found"
            description="It may have been deleted or you may not have access."
            action={
              <Link to="/lead-generation/sources" className="auth-btn btn-primary">
                Back to sources
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="lg-stat-grid">
            <StatCard label="Total leads" value={formatNumber(m?.totalLeads)} icon={<TargetIcon size={20} />} tone="blue" />
            <StatCard label="Qualified" value={formatNumber(m?.qualifiedLeads)} hint={formatPercent(m?.qualificationRate)} icon={<CheckCircleIcon size={20} />} tone="green" />
            <StatCard label="Converted" value={formatNumber(m?.convertedLeads)} hint={formatPercent(m?.conversionRate)} icon={<TrendingUpIcon size={20} />} tone="purple" />
            <StatCard label="Pipeline value" value={formatCurrency(m?.totalPipelineValue)} icon={<DollarSignIcon size={20} />} tone="amber" />
            <StatCard label="Average score" value={formatNumber(m?.avgScore)} icon={<AwardIcon size={20} />} tone="cyan" />
          </div>

          <div className="lg-grid-2">
            <SectionCard title="Source details">
              <dl className="lg-detail-list">
                <div><dt>Type</dt><dd><Badge tone="blue">{labelFor(SOURCE_TYPE_OPTIONS, source.type)}</Badge></dd></div>
                <div><dt>Status</dt><dd><Badge tone={toneForStatus(source.status)}>{humanize(source.status)}</Badge>{source.isSystem && <> <Badge tone="purple">System</Badge></>}</dd></div>
                <div><dt>Code</dt><dd>{source.code || '—'}</dd></div>
                <div><dt>Created</dt><dd>{formatDate(source.createdAt)}</dd></div>
                <div><dt>Linked forms</dt><dd>{formatNumber(source._count?.webForms)}</dd></div>
                <div><dt>Submissions</dt><dd>{formatNumber(source._count?.submissions)}</dd></div>
              </dl>
            </SectionCard>

            <SectionCard title="Cost & attribution">
              <dl className="lg-detail-list">
                <div><dt>Total cost</dt><dd>{formatCurrency(source.cost)}</dd></div>
                <div><dt>Cost per lead</dt><dd>{m?.costPerLead ? `$${m.costPerLead.toFixed(2)}` : '—'}</dd></div>
                <div><dt>Cost per conversion</dt><dd>{m?.costPerConversion ? `$${m.costPerConversion.toFixed(2)}` : '—'}</dd></div>
                <div><dt>ROI</dt><dd>{m?.roiMultiplier ? `${m.roiMultiplier}x` : '—'}</dd></div>
                <div><dt>UTM source</dt><dd>{source.utmSource || '—'}</dd></div>
                <div><dt>UTM medium / campaign</dt><dd>{[source.utmMedium, source.utmCampaign].filter(Boolean).join(' / ') || '—'}</dd></div>
              </dl>
            </SectionCard>
          </div>

          <SectionCard title="Recent leads" subtitle="Latest five leads attributed to this source">
            <DataTable
              columns={LEAD_COLUMNS}
              rows={source.leads || []}
              rowKey={(l) => l.id}
              emptyTitle="No leads yet"
              emptyDescription="Leads attributed to this source will appear here."
            />
          </SectionCard>
        </>
      )}

      <ConfirmDeleteModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title={source?.isSystem ? 'Deactivate System Source' : 'Delete Lead Source'}
        message={
          source?.isSystem
            ? 'System sources cannot be deleted. This source will be marked inactive.'
            : 'This lead source will be permanently removed.'
        }
        itemName={source?.name}
        confirmLabel={source?.isSystem ? 'Deactivate' : 'Delete'}
        isLoading={isDeleting}
      />
    </LeadGenLayout>
  );
};
