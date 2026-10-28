import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { SourceAnalyticsRow } from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { Badge, SectionCard, StatCard } from './components/Cards';
import { BarList } from './components/Charts';
import { DataTable, type Column } from './components/DataTable';
import { FilterBar, FilterSelect, SearchInput } from './components/FilterBar';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import {
  SOURCE_TYPE_OPTIONS,
  formatCurrency,
  formatNumber,
  formatPercent,
  humanize,
  labelFor,
  toneForStatus,
} from './leadGenConstants';
import {
  BarChart2Icon,
  DollarSignIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
  RefreshCwIcon,
} from '../../components/common/Icons';

const COLUMNS: Column<SourceAnalyticsRow>[] = [
  {
    key: 'name',
    header: 'Source',
    render: (s) => (
      <div className="lg-cell-stack">
        <Link to={`/lead-generation/sources/${s.id}`} className="lg-row-link">
          {s.name}
        </Link>
        <span className="lg-cell-sub">{labelFor(SOURCE_TYPE_OPTIONS, s.type)}</span>
      </div>
    ),
  },
  { key: 'status', header: 'Status', render: (s) => <Badge tone={toneForStatus(s.status)}>{humanize(s.status)}</Badge> },
  { key: 'leads', header: 'Leads', align: 'right', render: (s) => formatNumber(s.leadsCount) },
  { key: 'qual', header: 'Qualified', align: 'right', render: (s) => `${formatNumber(s.qualifiedCount)} (${formatPercent(s.qualificationRate)})` },
  { key: 'conv', header: 'Converted', align: 'right', render: (s) => `${formatNumber(s.convertedCount)} (${formatPercent(s.conversionRate)})` },
  { key: 'score', header: 'Avg score', align: 'right', render: (s) => formatNumber(s.averageScore) },
  { key: 'value', header: 'Pipeline', align: 'right', render: (s) => formatCurrency(s.pipelineValue) },
  { key: 'cost', header: 'Cost', align: 'right', render: (s) => formatCurrency(s.cost) },
  { key: 'cpl', header: 'CPL', align: 'right', render: (s) => (s.costPerLead ? `$${s.costPerLead.toFixed(2)}` : '—') },
  { key: 'cac', header: 'CAC', align: 'right', render: (s) => (s.cac ? `$${s.cac.toFixed(2)}` : '—') },
  { key: 'roi', header: 'ROI', align: 'right', render: (s) => (s.roiMultiplier ? `${s.roiMultiplier}x` : '—') },
];

export const SourceAnalyticsPage: React.FC = () => {
  const { workspaceId } = useLeadGenAccess();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const loader = useCallback(() => leadGenerationService.getSourceAnalytics(workspaceId), [workspaceId]);
  const { data, isLoading, error, reload, clearError } = useAsyncData(loader);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.sources || []).filter(
      (s) =>
        (!type || s.type === type) &&
        (!term || s.name.toLowerCase().includes(term) || (s.code || '').toLowerCase().includes(term)),
    );
  }, [data, search, type]);

  const summary = data?.summary;
  const hasFilters = Boolean(search || type);

  return (
    <LeadGenLayout
      title="Lead Source Analytics"
      subtitle="Compare volume, cost per lead, acquisition cost and ROI by source."
      icon={<BarChart2Icon size={22} />}
      error={error}
      onDismissError={clearError}
      actions={
        <button type="button" className="auth-btn btn-ghost" onClick={reload} disabled={isLoading}>
          <RefreshCwIcon size={16} />
          <span>Refresh</span>
        </button>
      }
    >
      {isLoading && !data ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading source analytics..." />
        </div>
      ) : (
        <>
          <div className="lg-stat-grid">
            <StatCard label="Total leads" value={formatNumber(summary?.totalLeads)} icon={<UsersIcon size={20} />} tone="blue" />
            <StatCard label="Converted" value={formatNumber(summary?.totalConverted)} icon={<TrendingUpIcon size={20} />} tone="green" />
            <StatCard label="Pipeline value" value={formatCurrency(summary?.totalValue)} icon={<DollarSignIcon size={20} />} tone="purple" />
            <StatCard label="Total cost" value={formatCurrency(summary?.totalCost)} icon={<DollarSignIcon size={20} />} tone="amber" />
            <StatCard label="Cost per lead" value={summary?.overallCPL ? `$${summary.overallCPL.toFixed(2)}` : '—'} icon={<TargetIcon size={20} />} tone="cyan" />
            <StatCard label="Acquisition cost" value={summary?.overallCAC ? `$${summary.overallCAC.toFixed(2)}` : '—'} hint="Cost per conversion" icon={<TargetIcon size={20} />} tone="red" />
          </div>

          <div className="lg-grid-2">
            <SectionCard title="Leads by source" subtitle="Top sources by volume">
              <BarList
                data={[...(data?.sources || [])]
                  .sort((a, b) => b.leadsCount - a.leadsCount)
                  .slice(0, 8)
                  .map((s) => ({ label: s.name, value: s.leadsCount }))}
                emptyText="No lead sources yet."
              />
            </SectionCard>
            <SectionCard title="Conversion rate by source" subtitle="Share of leads converted">
              <BarList
                data={[...(data?.sources || [])]
                  .filter((s) => s.leadsCount > 0)
                  .sort((a, b) => b.conversionRate - a.conversionRate)
                  .slice(0, 8)
                  .map((s) => ({ label: s.name, value: s.conversionRate }))}
                formatValue={(n) => formatPercent(n)}
                emptyText="No conversions recorded yet."
              />
            </SectionCard>
          </div>

          <FilterBar
            onRefresh={reload}
            hasActiveFilters={hasFilters}
            onReset={() => {
              setSearch('');
              setType('');
            }}
          >
            <SearchInput value={search} onChange={setSearch} placeholder="Search sources..." id="lg-source-analytics-search" />
            <FilterSelect id="lg-source-analytics-type" label="Type" value={type} options={SOURCE_TYPE_OPTIONS} onChange={setType} allLabel="All types" />
          </FilterBar>

          <DataTable
            columns={COLUMNS}
            rows={rows}
            rowKey={(s) => s.id}
            isLoading={isLoading}
            emptyTitle={hasFilters ? 'No matching sources' : 'No lead sources yet'}
            emptyDescription={
              hasFilters ? 'Try different filters.' : 'Create a lead source to start tracking source performance.'
            }
            emptyAction={
              !hasFilters && (
                <Link to="/lead-generation/sources" className="auth-btn btn-primary">
                  Go to lead sources
                </Link>
              )
            }
          />
        </>
      )}
    </LeadGenLayout>
  );
};
