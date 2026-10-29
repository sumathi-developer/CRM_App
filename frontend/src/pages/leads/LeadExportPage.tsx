import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import type { Lead, ScoreTier } from '../../types/lead.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { DataTable, type Column } from '../lead-generation/components/DataTable';
import { FilterBar, FilterSelect, SearchInput } from '../lead-generation/components/FilterBar';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { formatCurrency, humanize } from '../lead-generation/leadGenConstants';
import {
  EXPORT_COLUMNS,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  SCORE_TIER_OPTIONS,
  filterAndSortLeads,
  generateLeadsCsv,
  leadFullName,
  statusTone,
  triggerFileDownload,
} from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  TargetIcon,
} from '../../components/common/Icons';

export const LeadExportPage: React.FC = () => {
  const { users } = useUserOptions();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [scoreTier, setScoreTier] = useState<ScoreTier>('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXPORT_COLUMNS.map((c) => c.key),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadLeadsForExport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await leadService.getLeads({
        limit: 100,
        search: search || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        ownerId: ownerFilter || undefined,
      });
      setLeads(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads for export.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sourceFilter, ownerFilter]);

  useEffect(() => {
    loadLeadsForExport();
  }, [loadLeadsForExport]);

  const exportableLeads = useMemo(
    () => filterAndSortLeads(leads, { scoreTier }),
    [leads, scoreTier],
  );

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key)
        ? prev.length > 1
          ? prev.filter((k) => k !== key)
          : prev
        : [...prev, key],
    );
  };

  const handleDownloadExport = () => {
    if (exportableLeads.length === 0) {
      setError('No leads match your current filter selection to export.');
      return;
    }

    const stamp = new Date().toISOString().slice(0, 10);
    if (exportFormat === 'json') {
      const jsonRows = exportableLeads.map((lead) => {
        const obj: Record<string, any> = {};
        EXPORT_COLUMNS.filter((c) => selectedColumns.includes(c.key)).forEach((c) => {
          obj[c.key] = c.getValue(lead);
        });
        return obj;
      });
      triggerFileDownload(
        `crm-leads-export-${stamp}.json`,
        JSON.stringify(jsonRows, null, 2),
        'application/json;charset=utf-8;',
      );
    } else {
      const csv = generateLeadsCsv(exportableLeads, selectedColumns);
      triggerFileDownload(`crm-leads-export-${stamp}.csv`, csv);
    }

    setSuccess(
      `Exported ${exportableLeads.length} lead(s) (${selectedColumns.length} columns) as ${exportFormat.toUpperCase()}.`,
    );
  };

  const previewColumns: Column<Lead>[] = [
    {
      key: 'title',
      header: 'Lead Title',
      render: (l) => (
        <div className="lg-cell-stack">
          <Link to={`/leads/${l.id}`} className="lg-row-link">
            {l.title}
          </Link>
          <span className="lg-cell-sub">{leadFullName(l)}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email & Company',
      render: (l) => (
        <div className="lg-cell-stack">
          <span>{l.email}</span>
          <span className="lg-cell-sub">{l.companyName || '—'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => <Badge tone={statusTone(l.status)}>{humanize(l.status)}</Badge>,
    },
    {
      key: 'source',
      header: 'Source',
      render: (l) => humanize(l.source),
    },
    {
      key: 'score',
      header: 'Score',
      align: 'center',
      render: (l) => l.leadScore || 0,
    },
    {
      key: 'value',
      header: 'Est. Value',
      align: 'right',
      render: (l) => formatCurrency(l.estimatedValue),
    },
  ];

  return (
    <LeadsLayout
      title="Lead Export"
      subtitle="Filter leads, select fields, preview records, and export to CSV or JSON."
      icon={<ExternalLinkIcon size={22} />}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link to="/leads" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to All Leads
        </Link>
      }
      actions={
        <PrimaryButton
          type="button"
          fullWidth={false}
          disabled={exportableLeads.length === 0 || isLoading}
          onClick={handleDownloadExport}
          icon={<ExternalLinkIcon size={15} />}
        >
          Export {exportableLeads.length} Lead{exportableLeads.length === 1 ? '' : 's'} (
          {exportFormat.toUpperCase()})
        </PrimaryButton>
      }
    >
      <div className="lg-stat-grid">
        <StatCard
          label="Matching Leads"
          value={exportableLeads.length}
          hint="Included in export file"
          icon={<TargetIcon size={20} />}
          tone="blue"
        />
        <StatCard
          label="Selected Columns"
          value={`${selectedColumns.length} / ${EXPORT_COLUMNS.length}`}
          hint="Customizable below"
          icon={<CheckCircleIcon size={20} />}
          tone="green"
        />
        <StatCard
          label="Export Format"
          value={exportFormat.toUpperCase()}
          hint="Spreadsheet / API compatible"
          icon={<ExternalLinkIcon size={20} />}
          tone="purple"
        />
      </div>

      {/* Export Configuration Card */}
      <SectionCard
        title="1. Export Format & Column Selection"
        subtitle="Choose output file format and toggle which lead columns to include."
      >
        <div className="ld-export-format-row">
          <span className="lg-label">File Format:</span>
          <label className="ld-radio-pill">
            <input
              type="radio"
              checked={exportFormat === 'csv'}
              onChange={() => setExportFormat('csv')}
            />
            <span>CSV (Excel / Google Sheets)</span>
          </label>
          <label className="ld-radio-pill">
            <input
              type="radio"
              checked={exportFormat === 'json'}
              onChange={() => setExportFormat('json')}
            />
            <span>JSON (Structured Data)</span>
          </label>
        </div>

        <div className="ld-column-chips-grid">
          {EXPORT_COLUMNS.map((col) => {
            const active = selectedColumns.includes(col.key);
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => toggleColumn(col.key)}
                className={`ld-col-chip ${active ? 'is-active' : ''}`}
              >
                <CheckCircleIcon size={13} />
                <span>{col.label}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Filter Bar */}
      <FilterBar
        onRefresh={loadLeadsForExport}
        onReset={() => {
          setSearch('');
          setStatusFilter('');
          setSourceFilter('');
          setOwnerFilter('');
          setScoreTier('');
        }}
        hasActiveFilters={Boolean(
          search || statusFilter || sourceFilter || ownerFilter || scoreTier,
        )}
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter export by name, email, or company..."
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={LEAD_STATUS_OPTIONS}
          allLabel="All Statuses"
          onChange={setStatusFilter}
        />
        <FilterSelect
          label="Source"
          value={sourceFilter}
          options={LEAD_SOURCE_OPTIONS}
          allLabel="All Sources"
          onChange={setSourceFilter}
        />
        <FilterSelect
          label="Owner"
          value={ownerFilter}
          options={users.map((u) => ({ value: u.id, label: u.name }))}
          allLabel="All Owners"
          onChange={setOwnerFilter}
        />
        <FilterSelect
          label="Score"
          value={scoreTier}
          options={SCORE_TIER_OPTIONS}
          allLabel="All Tiers"
          onChange={(v) => setScoreTier(v as ScoreTier)}
        />
      </FilterBar>

      {/* Preview Table */}
      <DataTable
        columns={previewColumns}
        rows={exportableLeads}
        rowKey={(l) => l.id}
        isLoading={isLoading}
        loadingMessage="Loading export preview..."
        emptyTitle="No leads match your export filters"
        emptyDescription="Adjust or reset filters above to include leads in your export."
      />
    </LeadsLayout>
  );
};
