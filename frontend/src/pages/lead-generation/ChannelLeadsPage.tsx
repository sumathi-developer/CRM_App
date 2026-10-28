import React, { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { ChannelKey, ChannelLeadQuery } from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { LeadsTable } from './components/LeadsTable';
import { Pagination } from './components/Pagination';
import { FilterBar, FilterSelect, SearchInput } from './components/FilterBar';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import { CHANNELS, LEAD_STATUS_OPTIONS, type ChannelConfig } from './leadGenConstants';
import { GlobeIcon, PlusIcon } from '../../components/common/Icons';
import { EmptyState } from '../../components/common/EmptyState';

const PAGE_SIZE = 10;

const ChannelLeadsView: React.FC<{ config: ChannelConfig }> = ({ config }) => {
  const { workspaceId } = useLeadGenAccess();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [campaign, setCampaign] = useState('');
  const [minScore, setMinScore] = useState('');
  const [page, setPage] = useState(1);

  const channelKey: ChannelKey = config.key;

  const loader = useCallback(() => {
    const query: ChannelLeadQuery = {
      page,
      limit: PAGE_SIZE,
      search,
      status,
      campaign,
      minScore: minScore !== '' && !Number.isNaN(Number(minScore)) ? Number(minScore) : undefined,
      workspaceId,
    };
    return leadGenerationService.getChannelLeads(channelKey, query);
  }, [channelKey, page, search, status, campaign, minScore, workspaceId]);

  const { data, isLoading, error, reload, clearError } = useAsyncData(loader);

  const hasFilters = Boolean(search || status || campaign || minScore);
  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setCampaign('');
    setMinScore('');
    setPage(1);
  };

  return (
    <LeadGenLayout
      title={config.title}
      subtitle={config.description}
      icon={<GlobeIcon size={22} />}
      error={error}
      onDismissError={clearError}
      actions={
        <Link to="/lead-generation/manual-capture" className="auth-btn btn-primary">
          <PlusIcon size={16} />
          <span>Capture Lead</span>
        </Link>
      }
    >
      <FilterBar onRefresh={reload} onReset={resetFilters} hasActiveFilters={hasFilters}>
        <SearchInput
          id={`lg-${config.key}-search`}
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, email, company..."
        />
        <FilterSelect
          id={`lg-${config.key}-status`}
          label="Status"
          value={status}
          options={LEAD_STATUS_OPTIONS}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <SearchInput
          value={campaign}
          onChange={(v) => {
            setCampaign(v);
            setPage(1);
          }}
          placeholder="Filter by campaign..."
        />
        <label className="lg-filter-select" htmlFor={`lg-${config.key}-minscore`}>
          <span className="lg-filter-label">Min score</span>
          <input
            id={`lg-${config.key}-minscore`}
            className="lg-input lg-input-narrow"
            type="number"
            min={0}
            value={minScore}
            onChange={(e) => {
              setMinScore(e.target.value);
              setPage(1);
            }}
            placeholder="0"
          />
        </label>
      </FilterBar>

      <LeadsTable
        leads={data?.data || []}
        isLoading={isLoading}
        emptyTitle={hasFilters ? 'No matching leads' : `No ${config.label.toLowerCase()} leads yet`}
        emptyDescription={
          hasFilters
            ? 'Try adjusting or resetting your filters.'
            : 'Leads from this channel will appear here as soon as they are captured.'
        }
        emptyAction={
          hasFilters ? (
            <button type="button" className="auth-btn btn-secondary" onClick={resetFilters}>
              Reset filters
            </button>
          ) : (
            <Link to="/lead-generation/manual-capture" className="auth-btn btn-primary">
              Capture a lead
            </Link>
          )
        }
        footer={<Pagination meta={data?.meta} onPageChange={setPage} disabled={isLoading} noun="leads" />}
      />
    </LeadGenLayout>
  );
};

/** One page component that serves all seven channel routes. */
export const ChannelLeadsPage: React.FC = () => {
  const { channel } = useParams<{ channel: string }>();
  const config = CHANNELS.find((c) => c.path === channel);

  if (!config) {
    return (
      <LeadGenLayout title="Channel not found" subtitle="The requested lead channel does not exist.">
        <EmptyState
          title="Unknown channel"
          description="Choose one of the available lead channels from the navigation above."
          action={
            <Link to="/lead-generation" className="auth-btn btn-primary">
              Back to overview
            </Link>
          }
        />
      </LeadGenLayout>
    );
  }

  return <ChannelLeadsView key={config.key} config={config} />;
};
