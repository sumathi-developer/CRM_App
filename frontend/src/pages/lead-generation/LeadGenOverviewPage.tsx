import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import { LeadGenLayout } from './components/LeadGenLayout';
import { SectionCard, StatCard } from './components/Cards';
import { BarList, DonutChart, Funnel, LineChart } from './components/Charts';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import {
  CHANNEL_LABELS,
  CHANNELS,
  formatCurrency,
  formatNumber,
  formatPercent,
  humanize,
} from './leadGenConstants';
import {
  TargetIcon,
  TrendingUpIcon,
  DollarSignIcon,
  AwardIcon,
  CheckCircleIcon,
  UsersIcon,
  PlusIcon,
  SlidersIcon,
  SendIcon,
  GlobeIcon,
  BarChart2Icon,
  RefreshCwIcon,
} from '../../components/common/Icons';

const QUICK_LINKS = [
  { to: '/lead-generation/sources', title: 'Lead Sources', desc: 'Manage where leads come from', icon: <GlobeIcon size={18} /> },
  { to: '/lead-generation/forms', title: 'Web Forms', desc: 'Build and publish capture forms', icon: <SendIcon size={18} /> },
  { to: '/lead-generation/scoring', title: 'Lead Scoring', desc: 'Configure scoring rules', icon: <AwardIcon size={18} /> },
  { to: '/lead-generation/qualification', title: 'Qualification', desc: 'Define qualification criteria', icon: <CheckCircleIcon size={18} /> },
  { to: '/lead-generation/assignment-rules', title: 'Assignment Rules', desc: 'Route leads to the right owner', icon: <UsersIcon size={18} /> },
  { to: '/lead-generation/analytics/sources', title: 'Source Analytics', desc: 'CPL, CAC and ROI by source', icon: <BarChart2Icon size={18} /> },
];

export const LeadGenOverviewPage: React.FC = () => {
  const { workspaceId } = useLeadGenAccess();

  const loader = useCallback(() => leadGenerationService.getOverview(workspaceId), [workspaceId]);
  const { data, isLoading, error, reload, clearError } = useAsyncData(loader);

  const kpis = data?.kpis;
  const forms = data?.forms;

  return (
    <LeadGenLayout
      title="Lead Generation"
      subtitle="Capture, score, qualify and route inbound leads from every channel."
      icon={<TargetIcon size={22} />}
      error={error}
      onDismissError={clearError}
      actions={
        <>
          <button type="button" className="auth-btn btn-ghost" onClick={reload} disabled={isLoading}>
            <RefreshCwIcon size={16} />
            <span>Refresh</span>
          </button>
          <Link to="/lead-generation/manual-capture" className="auth-btn btn-primary">
            <PlusIcon size={16} />
            <span>Capture Lead</span>
          </Link>
        </>
      }
    >
      {isLoading && !data ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading lead generation overview..." />
        </div>
      ) : !data ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Overview unavailable"
            description="We couldn't load lead generation metrics. Try refreshing the page."
            action={
              <button type="button" className="auth-btn btn-primary" onClick={reload}>
                Try again
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="lg-stat-grid">
            <StatCard label="Leads generated" value={formatNumber(kpis?.totalLeadsGenerated)} hint={`${formatNumber(kpis?.newLeads)} new`} icon={<TargetIcon size={20} />} tone="blue" />
            <StatCard label="Pipeline value" value={formatCurrency(kpis?.totalPipelineValue)} hint="Estimated total" icon={<DollarSignIcon size={20} />} tone="green" />
            <StatCard label="Average score" value={formatNumber(kpis?.averageLeadScore)} hint="Across all leads" icon={<AwardIcon size={20} />} tone="amber" />
            <StatCard label="Qualification rate" value={formatPercent(kpis?.qualificationRate)} hint={`${formatNumber(kpis?.qualifiedLeads)} qualified`} icon={<CheckCircleIcon size={20} />} tone="purple" />
            <StatCard label="Conversion rate" value={formatPercent(kpis?.conversionRate)} hint={`${formatNumber(kpis?.convertedLeads)} converted`} icon={<TrendingUpIcon size={20} />} tone="cyan" />
          </div>

          <div className="lg-grid-2">
            <SectionCard title="Lead funnel" subtitle="Progress of leads through qualification">
              <Funnel
                steps={[
                  { label: 'Total leads', value: kpis?.totalLeadsGenerated || 0 },
                  { label: 'New', value: kpis?.newLeads || 0 },
                  { label: 'Qualified', value: kpis?.qualifiedLeads || 0 },
                  { label: 'Converted', value: kpis?.convertedLeads || 0 },
                  { label: 'Unqualified', value: kpis?.unqualifiedLeads || 0 },
                ]}
              />
            </SectionCard>

            <SectionCard title="Channel distribution" subtitle="Where your leads are coming from">
              <DonutChart
                centerLabel="Leads"
                data={Object.entries(data.channelDistribution || {}).map(([k, v]) => ({
                  label: CHANNEL_LABELS[k] || humanize(k),
                  value: v,
                }))}
                emptyText="No channel data yet."
              />
            </SectionCard>
          </div>

          <div className="lg-grid-2">
            <SectionCard
              title="Lead volume — last 30 days"
              subtitle="Daily leads generated"
              actions={
                <Link to="/lead-generation/analytics" className="lg-link-btn">
                  Full analytics →
                </Link>
              }
            >
              <LineChart points={(data.timeSeries || []).map((p) => ({ label: p.date.slice(5), value: p.count }))} emptyText="No leads generated in the last 30 days." />
            </SectionCard>

            <SectionCard
              title="Top lead sources"
              subtitle="Ranked by number of leads"
              actions={
                <Link to="/lead-generation/sources" className="lg-link-btn">
                  All sources →
                </Link>
              }
            >
              <BarList
                data={(data.topSources || []).map((s) => ({ label: s.name, value: s.leadsCount, hint: humanize(s.type) }))}
                emptyText="No lead sources yet."
              />
            </SectionCard>
          </div>

          <div className="lg-stat-grid lg-stat-grid-compact">
            <StatCard label="Web forms" value={formatNumber(forms?.totalForms)} hint={`${formatNumber(forms?.activeForms)} published`} icon={<SendIcon size={18} />} tone="blue" />
            <StatCard label="Form views" value={formatNumber(forms?.totalViews)} icon={<GlobeIcon size={18} />} tone="slate" />
            <StatCard label="Submissions" value={formatNumber(forms?.totalSubmissions)} hint={`${formatNumber(forms?.rawSubmissions)} raw`} icon={<UsersIcon size={18} />} tone="green" />
            <StatCard label="Form conversion" value={formatPercent(forms?.overallConversionRate)} icon={<SlidersIcon size={18} />} tone="purple" />
            <StatCard label="Spam blocked" value={formatNumber(forms?.spamBlocked)} icon={<CheckCircleIcon size={18} />} tone="red" />
          </div>
        </>
      )}

      <SectionCard title="Quick access" subtitle="Jump to a lead generation workspace">
        <div className="lg-quick-grid">
          {QUICK_LINKS.map((q) => (
            <Link key={q.to} to={q.to} className="lg-quick-link">
              <span className="lg-quick-icon">{q.icon}</span>
              <span className="lg-quick-text">
                <strong>{q.title}</strong>
                <span>{q.desc}</span>
              </span>
            </Link>
          ))}
          {CHANNELS.slice(0, 2).map((c) => (
            <Link key={c.key} to={`/lead-generation/leads/${c.path}`} className="lg-quick-link">
              <span className="lg-quick-icon">
                <TargetIcon size={18} />
              </span>
              <span className="lg-quick-text">
                <strong>{c.title}</strong>
                <span>{c.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </SectionCard>
    </LeadGenLayout>
  );
};
