import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { FormAnalyticsRow } from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { Badge, SectionCard, StatCard } from './components/Cards';
import { BarList, LineChart } from './components/Charts';
import { DataTable, type Column } from './components/DataTable';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import {
  CHANNEL_LABELS,
  FORM_TYPE_OPTIONS,
  formatCurrency,
  formatNumber,
  formatPercent,
  humanize,
  labelFor,
  toneForStatus,
} from './leadGenConstants';
import {
  BarChart2Icon,
  TargetIcon,
  TrendingUpIcon,
  DollarSignIcon,
  AwardIcon,
  RefreshCwIcon,
} from '../../components/common/Icons';

interface AnalyticsBundle {
  overview: Awaited<ReturnType<typeof leadGenerationService.getGenerationAnalytics>>;
  forms: FormAnalyticsRow[];
}

const FORM_COLUMNS: Column<FormAnalyticsRow>[] = [
  {
    key: 'name',
    header: 'Form',
    render: (f) => (
      <div className="lg-cell-stack">
        <strong>{f.name}</strong>
        <span className="lg-cell-sub">/{f.slug}</span>
      </div>
    ),
  },
  { key: 'type', header: 'Type', render: (f) => labelFor(FORM_TYPE_OPTIONS, f.formType) },
  { key: 'status', header: 'Status', render: (f) => <Badge tone={toneForStatus(f.status)}>{humanize(f.status)}</Badge> },
  { key: 'views', header: 'Views', align: 'right', render: (f) => formatNumber(f.viewsCount) },
  { key: 'subs', header: 'Submissions', align: 'right', render: (f) => formatNumber(f.submissionsCount) },
  { key: 'conv', header: 'Conversion', align: 'right', render: (f) => formatPercent(f.conversionRate) },
  { key: 'drop', header: 'Drop-off', align: 'right', render: (f) => formatPercent(f.dropoffRate) },
  { key: 'source', header: 'Default source', render: (f) => f.defaultSource?.name || <span className="lg-muted">—</span> },
];

export const LeadGenAnalyticsPage: React.FC = () => {
  const { workspaceId } = useLeadGenAccess();

  const loader = useCallback(async (): Promise<AnalyticsBundle> => {
    const [overview, forms] = await Promise.all([
      leadGenerationService.getGenerationAnalytics(workspaceId),
      leadGenerationService.getFormAnalytics(workspaceId).catch(() => [] as FormAnalyticsRow[]),
    ]);
    return { overview, forms };
  }, [workspaceId]);

  const { data, isLoading, error, reload, clearError } = useAsyncData(loader);
  const kpis = data?.overview.kpis;
  const forms = data?.overview.forms;

  return (
    <LeadGenLayout
      title="Lead Generation Analytics"
      subtitle="Volume trends, channel performance and form conversion."
      icon={<BarChart2Icon size={22} />}
      error={error}
      onDismissError={clearError}
      actions={
        <>
          <Link to="/lead-generation/analytics/sources" className="auth-btn btn-secondary">
            <span>Source analytics</span>
          </Link>
          <button type="button" className="auth-btn btn-ghost" onClick={reload} disabled={isLoading}>
            <RefreshCwIcon size={16} />
            <span>Refresh</span>
          </button>
        </>
      }
    >
      {isLoading && !data ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Crunching lead generation analytics..." />
        </div>
      ) : (
        <>
          <div className="lg-stat-grid">
            <StatCard label="Leads generated" value={formatNumber(kpis?.totalLeadsGenerated)} icon={<TargetIcon size={20} />} tone="blue" />
            <StatCard label="Pipeline value" value={formatCurrency(kpis?.totalPipelineValue)} icon={<DollarSignIcon size={20} />} tone="green" />
            <StatCard label="Average score" value={formatNumber(kpis?.averageLeadScore)} icon={<AwardIcon size={20} />} tone="amber" />
            <StatCard label="Qualification rate" value={formatPercent(kpis?.qualificationRate)} icon={<TrendingUpIcon size={20} />} tone="purple" />
            <StatCard label="Form conversion" value={formatPercent(forms?.overallConversionRate)} hint={`${formatNumber(forms?.totalSubmissions)} submissions`} icon={<BarChart2Icon size={20} />} tone="cyan" />
          </div>

          <SectionCard title="Lead volume — last 30 days" subtitle="Daily leads generated across all channels">
            <LineChart
              height={220}
              points={(data?.overview.timeSeries || []).map((p) => ({ label: p.date.slice(5), value: p.count }))}
              emptyText="No leads generated in the last 30 days."
            />
          </SectionCard>

          <div className="lg-grid-2">
            <SectionCard title="Leads by channel" subtitle="Volume per generation channel">
              <BarList
                data={Object.entries(data?.overview.channelDistribution || {})
                  .map(([k, v]) => ({ label: CHANNEL_LABELS[k] || humanize(k), value: v }))
                  .sort((a, b) => b.value - a.value)}
                emptyText="No channel data yet."
              />
            </SectionCard>

            <SectionCard title="Top sources" subtitle="Highest-volume lead sources">
              <BarList
                data={(data?.overview.topSources || []).map((s) => ({ label: s.name, value: s.leadsCount, hint: humanize(s.type) }))}
                emptyText="No lead sources yet."
              />
            </SectionCard>
          </div>

          <SectionCard title="Form & landing page performance" subtitle="Views, submissions and conversion per form">
            <DataTable
              columns={FORM_COLUMNS}
              rows={data?.forms || []}
              rowKey={(f) => f.id}
              emptyTitle="No forms yet"
              emptyDescription="Create a web form to start tracking views and conversions."
              emptyAction={
                <Link to="/lead-generation/forms/create" className="auth-btn btn-primary">
                  Create web form
                </Link>
              }
            />
          </SectionCard>
        </>
      )}
    </LeadGenLayout>
  );
};
