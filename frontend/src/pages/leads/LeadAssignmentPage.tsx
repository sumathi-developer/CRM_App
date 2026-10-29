import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { Lead } from '../../types/lead.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { DataTable, type Column } from '../lead-generation/components/DataTable';
import { FilterBar, FilterSelect, SearchInput } from '../lead-generation/components/FilterBar';
import { Field, Toggle } from '../lead-generation/components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { formatCurrency, humanize } from '../lead-generation/leadGenConstants';
import { LEAD_STATUS_OPTIONS, leadFullName, statusTone } from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import { LeadScoreDisplay } from './components/LeadCard';
import {
  CheckCircleIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from '../../components/common/Icons';

export const LeadAssignmentPage: React.FC = () => {
  const { id: routeLeadId } = useParams<{ id?: string }>();
  const { users } = useUserOptions();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  // Bulk or single assignment controls
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetOwnerId, setTargetOwnerId] = useState('');
  const [useRuleRouting, setUseRuleRouting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, singleRes] = await Promise.all([
        leadService.getLeads({
          limit: 50,
          search: search || undefined,
          status: statusFilter || undefined,
          ownerId: ownerFilter === 'UNASSIGNED' ? undefined : ownerFilter || undefined,
        }),
        routeLeadId ? leadService.getLeadById(routeLeadId).catch(() => null) : Promise.resolve(null),
      ]);

      let rows = listRes.data || [];
      if (ownerFilter === 'UNASSIGNED') {
        rows = rows.filter((l) => !l.ownerId);
      }
      setLeads(rows);

      if (singleRes) {
        setActiveLead(singleRes);
        setSelectedIds([singleRes.id]);
        setTargetOwnerId(singleRes.ownerId || '');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads for assignment.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, ownerFilter, routeLeadId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInlineAssign = async (lead: Lead, newOwnerId: string) => {
    if (!newOwnerId) return;
    setError(null);
    try {
      await leadService.assignLead(lead.id, newOwnerId);
      const ownerName = users.find((u) => u.id === newOwnerId)?.name || 'selected owner';
      setSuccess(`Assigned "${lead.title}" to ${ownerName}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign lead.');
    }
  };

  const handleExecuteAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError('Select at least one lead to assign.');
      return;
    }
    if (!useRuleRouting && !targetOwnerId) {
      setError('Choose a sales owner or enable automated rule routing.');
      return;
    }

    setIsAssigning(true);
    setError(null);
    try {
      if (selectedIds.length === 1 && !useRuleRouting) {
        await leadService.assignLead(selectedIds[0], targetOwnerId);
      } else if (selectedIds.length === 1 && useRuleRouting) {
        await leadGenerationService.routeLead(selectedIds[0], {});
      } else {
        await leadGenerationService.bulkAssign({
          leadIds: selectedIds,
          ownerId: useRuleRouting ? undefined : targetOwnerId,
        });
      }
      setSuccess(
        useRuleRouting
          ? `Executed automated routing for ${selectedIds.length} lead(s).`
          : `Successfully assigned ${selectedIds.length} lead(s).`,
      );
      if (!routeLeadId) setSelectedIds([]);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign selected leads.');
    } finally {
      setIsAssigning(false);
    }
  };

  const unassignedCount = leads.filter((l) => !l.ownerId).length;
  const assignedCount = leads.length - unassignedCount;

  const columns: Column<Lead>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={leads.length > 0 && leads.every((l) => selectedIds.includes(l.id))}
          onChange={() => {
            if (leads.every((l) => selectedIds.includes(l.id))) {
              setSelectedIds([]);
            } else {
              setSelectedIds(leads.map((l) => l.id));
            }
          }}
          aria-label="Select all leads"
        />
      ),
      render: (l) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(l.id)}
          onChange={() =>
            setSelectedIds((prev) =>
              prev.includes(l.id) ? prev.filter((id) => id !== l.id) : [...prev, l.id],
            )
          }
          aria-label={`Select ${l.title}`}
        />
      ),
    },
    {
      key: 'lead',
      header: 'Lead',
      render: (l) => (
        <div className="lg-cell-stack">
          <Link to={`/leads/${l.id}`} className="lg-row-link">
            {l.title}
          </Link>
          <span className="lg-cell-sub">
            {leadFullName(l)} · {l.companyName || l.email}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => <Badge tone={statusTone(l.status)}>{humanize(l.status)}</Badge>,
    },
    {
      key: 'score',
      header: 'Score',
      align: 'center',
      render: (l) => <LeadScoreDisplay score={l.leadScore} compact />,
    },
    {
      key: 'value',
      header: 'Est. Value',
      align: 'right',
      render: (l) => formatCurrency(l.estimatedValue),
    },
    {
      key: 'owner',
      header: 'Assigned Sales Owner',
      render: (l) => (
        <select
          className="lg-select ld-compact-select"
          value={l.ownerId || ''}
          onChange={(e) => handleInlineAssign(l, e.target.value)}
          aria-label={`Assign owner for ${l.title}`}
        >
          <option value="">— Unassigned —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <LeadsLayout
      title={activeLead ? `Lead Assignment — ${activeLead.title}` : 'Lead Assignment'}
      subtitle="Assign individual or bulk leads to sales representatives or route automatically via rules."
      icon={<UsersIcon size={22} />}
      activeLead={activeLead}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <Link to="/lead-generation/assignment-rules" className="auth-btn btn-secondary">
          <SparklesIcon size={15} />
          <span>Configure Routing Rules</span>
        </Link>
      }
    >
      <div className="lg-stat-grid">
        <StatCard
          label="Visible Leads"
          value={leads.length}
          hint={`${selectedIds.length} currently selected`}
          icon={<UsersIcon size={20} />}
          tone="blue"
        />
        <StatCard
          label="Assigned Leads"
          value={assignedCount}
          hint="Has active sales owner"
          icon={<CheckCircleIcon size={20} />}
          tone="green"
        />
        <StatCard
          label="Unassigned Queue"
          value={unassignedCount}
          hint="Awaiting owner assignment"
          icon={<UserIcon size={20} />}
          tone="amber"
        />
        <StatCard
          label="Available Reps"
          value={users.length}
          hint="Active workspace members"
          icon={<UsersIcon size={20} />}
          tone="purple"
        />
      </div>

      {/* Assignment Control Panel */}
      <SectionCard
        title="Assignment & Routing Action Bar"
        subtitle={`Assign ${selectedIds.length} selected lead(s) to a sales representative or trigger automated routing.`}
      >
        <form className="ld-assignment-bar" onSubmit={handleExecuteAssignment}>
          <Field label="Target Sales Representative" htmlFor="bulk-owner-select" className="ld-flex-1">
            <select
              id="bulk-owner-select"
              className="lg-select"
              value={targetOwnerId}
              disabled={useRuleRouting || isAssigning}
              onChange={(e) => setTargetOwnerId(e.target.value)}
            >
              <option value="">— Select sales owner —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </Field>

          <Toggle
            id="bulk-auto-route-toggle"
            checked={useRuleRouting}
            onChange={setUseRuleRouting}
            label="Use automated routing rules"
            description="Round-robin / load-balanced"
          />

          <PrimaryButton
            type="submit"
            fullWidth={false}
            isLoading={isAssigning}
            loadingText="Assigning..."
            disabled={selectedIds.length === 0}
          >
            {useRuleRouting
              ? `Auto-Route (${selectedIds.length})`
              : `Assign Selected (${selectedIds.length})`}
          </PrimaryButton>
        </form>
      </SectionCard>

      <FilterBar
        onRefresh={loadData}
        onReset={() => {
          setSearch('');
          setStatusFilter('');
          setOwnerFilter('');
        }}
        hasActiveFilters={Boolean(search || statusFilter || ownerFilter)}
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search leads to assign..."
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={LEAD_STATUS_OPTIONS}
          allLabel="All Statuses"
          onChange={setStatusFilter}
        />
        <FilterSelect
          label="Ownership"
          value={ownerFilter}
          options={[
            { value: 'UNASSIGNED', label: 'Unassigned Only' },
            ...users.map((u) => ({ value: u.id, label: u.name })),
          ]}
          allLabel="All Leads"
          onChange={setOwnerFilter}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={leads}
        rowKey={(l) => l.id}
        isLoading={isLoading}
        loadingMessage="Loading leads..."
        emptyTitle="No leads match your filters"
        emptyDescription="Try clearing the search or ownership filter."
      />
    </LeadsLayout>
  );
};

