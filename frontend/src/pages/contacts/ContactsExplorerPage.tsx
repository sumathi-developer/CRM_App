import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contactService } from '../../services/contact.service';
import type {
  Contact,
  ContactOrganization,
  ContactScopeMode,
  ContactSortField,
  ContactStage,
  ContactViewMode,
  ConvertContactPayload,
  PaginationMeta,
  PipelineOption,
  SortDirection,
} from '../../types/contact.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { Badge, StatCard } from '../lead-generation/components/Cards';
import { FilterBar, FilterSelect, SearchInput } from '../lead-generation/components/FilterBar';
import { Pagination } from '../lead-generation/components/Pagination';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { formatNumber } from '../lead-generation/leadGenConstants';
import { triggerFileDownload } from '../leads/leadConstants';
import {
  CONTACT_SORT_OPTIONS,
  CONTACT_STAGE_OPTIONS,
  contactFullName,
  filterAndSortContacts,
  generateContactsCsv,
  getContactPermissions,
} from './contactConstants';
import { ContactsLayout } from './components/ContactsLayout';
import {
  ContactQuickDrawer,
  ContactsListView,
  ContactsTableView,
  ConvertContactModal,
} from './components/ContactViews';
import {
  BuildingIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  PlusIcon,
  ShieldIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
} from '../../components/common/Icons';

export const ContactsExplorerPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users } = useUserOptions();
  const location = useLocation();
  const permissions = useMemo(() => getContactPermissions(currentUser), [currentUser]);

  // Derive default view and scope from current route path so all 4 views
  // (/contacts, /contacts/my, /contacts/list, /contacts/table) share state seamlessly
  const routeMode = useMemo(() => {
    const p = location.pathname;
    if (p === '/contacts/my') return { scope: 'my' as ContactScopeMode, view: null };
    if (p === '/contacts/list') return { scope: 'all' as ContactScopeMode, view: 'list' as ContactViewMode };
    if (p === '/contacts/table') return { scope: 'all' as ContactScopeMode, view: 'table' as ContactViewMode };
    return { scope: 'all' as ContactScopeMode, view: null };
  }, [location.pathname]);

  const [manualViewMode, setManualViewMode] = useState<ContactViewMode>('table');
  const [manualScope, setManualScope] = useState<ContactScopeMode | null>(null);

  const viewMode: ContactViewMode = routeMode.view || manualViewMode;
  const scope: ContactScopeMode =
    location.pathname === '/contacts/my' ? 'my' : manualScope || routeMode.scope;

  // Query & Filter State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortField, setSortField] = useState<ContactSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Shared Contact Data State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organizations, setOrganizations] = useState<ContactOrganization[]>([]);
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selection & Interactive Modals / Drawer State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  const [contactToConvert, setContactToConvert] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkStageValue, setBulkStageValue] = useState('');

  const effectiveOwnerId = scope === 'my' ? currentUser?.id || '' : ownerFilter;

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contactService.getContacts({
        page,
        limit,
        search: search || undefined,
        stage: stageFilter || undefined,
        organizationId: organizationFilter || undefined,
        ownerId: effectiveOwnerId || undefined,
      });
      setContacts(response.data || []);
      setMeta(response.meta);
      setSelectedIds((prev) =>
        prev.filter((id) => (response.data || []).some((c) => c.id === id)),
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to load contacts.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, stageFilter, organizationFilter, effectiveOwnerId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    contactService.getOrganizations().then(setOrganizations).catch(() => setOrganizations([]));
    contactService.getPipelines().then(setPipelines).catch(() => setPipelines([]));
  }, []);

  // Client-side department filtering & sorting over fetched page
  const displayedContacts = useMemo(
    () =>
      filterAndSortContacts(contacts, {
        department: departmentFilter,
        sortField,
        sortDirection,
      }),
    [contacts, departmentFilter, sortField, sortDirection],
  );

  // KPI summary derived from current dataset
  const stats = useMemo(() => {
    const totalCount = meta?.total ?? displayedContacts.length;
    const customerCount = displayedContacts.filter((c) => c.stage === 'CUSTOMER').length;
    const opportunityCount = displayedContacts.filter((c) => c.stage === 'OPPORTUNITY').length;
    const orgLinkedCount = displayedContacts.filter((c) => Boolean(c.organizationId)).length;
    return { totalCount, customerCount, opportunityCount, orgLinkedCount };
  }, [displayedContacts, meta]);

  // Selection handlers
  const handleToggleSelect = (contactId: string) => {
    setSelectedIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  };

  const handleToggleSelectAll = () => {
    const pageIds = displayedContacts.map((c) => c.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Stage transition handler
  const handleStageChange = async (contact: Contact, nextStage: ContactStage) => {
    if (!permissions.canEdit) return;
    if ((contact.stage || '').toUpperCase() === nextStage) return;

    if (nextStage === 'CUSTOMER' && contact.stage !== 'CUSTOMER') {
      setContactToConvert(contact);
      return;
    }

    setError(null);
    try {
      const updated = await contactService.updateContact(contact.id, { stage: nextStage });
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, ...updated } : c)));
      if (previewContact?.id === contact.id) {
        setPreviewContact((prev) => (prev ? { ...prev, ...updated } : null));
      }
      setSuccess(
        `Updated "${contactFullName(contact)}" lifecycle stage to ${nextStage}.`,
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to update contact stage.');
    }
  };

  // Convert Contact to Customer handler
  const handleConvertSubmit = async (contactId: string, payload: ConvertContactPayload) => {
    const res = await contactService.convertContact(contactId, payload);
    setSuccess(
      res.message ||
        `Converted contact to Customer${res.deal ? ` and created deal "${res.deal.title}"` : ''}.`,
    );
    await fetchContacts();
    return res;
  };

  // Single Delete handler
  const handleConfirmDelete = async () => {
    if (!contactToDelete || !permissions.canDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await contactService.deleteContact(contactToDelete.id);
      setSuccess(`Deleted contact "${contactFullName(contactToDelete)}".`);
      setContactToDelete(null);
      await fetchContacts();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete contact.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Stage Update handler
  const handleBulkStageApply = async () => {
    if (!bulkStageValue || selectedIds.length === 0 || !permissions.canEdit) return;
    setError(null);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          contactService.updateContact(id, { stage: bulkStageValue as ContactStage }),
        ),
      );
      setSuccess(
        `Updated lifecycle stage to ${bulkStageValue} for ${selectedIds.length} contact(s).`,
      );
      setBulkStageValue('');
      setSelectedIds([]);
      await fetchContacts();
    } catch (err: any) {
      setError(err?.message || 'Failed to update selected contacts.');
    }
  };

  // Quick CSV Export of current view
  const handleQuickExportCsv = () => {
    const source =
      selectedIds.length > 0
        ? displayedContacts.filter((c) => selectedIds.includes(c.id))
        : displayedContacts;
    const csv = generateContactsCsv(source);
    triggerFileDownload(
      csv,
      `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;',
    );
    setSuccess(`Exported ${source.length} contact(s) to CSV.`);
  };

  const resetFilters = () => {
    setSearch('');
    setStageFilter('');
    setOrganizationFilter('');
    setOwnerFilter('');
    setDepartmentFilter('');
    setSortField('createdAt');
    setSortDirection('desc');
    setPage(1);
  };

  const pageTitle = useMemo(() => {
    if (location.pathname === '/contacts/my' || scope === 'my') return 'My Contacts';
    if (location.pathname === '/contacts/list') return 'Contact List';
    if (location.pathname === '/contacts/table') return 'Contact Table';
    return 'All Contacts';
  }, [location.pathname, scope]);

  const pageSubtitle = useMemo(() => {
    if (scope === 'my') {
      return `Contacts assigned to ${currentUser?.name || currentUser?.email || 'you'} across all lifecycle stages.`;
    }
    if (viewMode === 'list') {
      return 'Card-based directory of contacts with organization relationships, stage badges, and quick actions.';
    }
    return 'Manage, search, filter, sort, and engage with contacts across your CRM workspace.';
  }, [scope, viewMode, currentUser]);

  const emptyCreateAction = permissions.canCreate ? (
    <Link to="/contacts/create" className="auth-btn btn-primary">
      <PlusIcon size={16} />
      <span>Create Contact</span>
    </Link>
  ) : undefined;

  const sharedViewProps = {
    contacts: displayedContacts,
    isLoading,
    selectedIds,
    onToggleSelect: handleToggleSelect,
    onToggleSelectAll: handleToggleSelectAll,
    emptyAction: emptyCreateAction,
    permissions,
    onPreview: (c: Contact) => setPreviewContact(c),
    onStageChange: handleStageChange,
    onConvert: (c: Contact) => setContactToConvert(c),
    onDelete: (c: Contact) => setContactToDelete(c),
  };

  return (
    <ContactsLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      icon={<UsersIcon size={22} />}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <>
          <Badge tone="slate">
            <ShieldIcon size={12} /> Role: {permissions.roleLabel}
          </Badge>
          <button
            type="button"
            className="auth-btn btn-secondary"
            onClick={handleQuickExportCsv}
            disabled={displayedContacts.length === 0}
          >
            <ExternalLinkIcon size={15} />
            <span>Quick Export CSV</span>
          </button>
          {permissions.canImport && (
            <Link to="/contacts/import" className="auth-btn btn-secondary">
              <span>Import</span>
            </Link>
          )}
          {permissions.canCreate && (
            <Link to="/contacts/create" className="auth-btn btn-primary" id="btn-create-contact">
              <PlusIcon size={16} />
              <span>Create Contact</span>
            </Link>
          )}
        </>
      }
    >
      {/* KPI Stat Cards */}
      <section className="lg-stats-grid" aria-label="Contacts summary metrics">
        <StatCard
          label="Total Contacts"
          value={formatNumber(stats.totalCount)}
          hint={scope === 'my' ? 'Assigned to you' : 'Matching current query'}
          tone="blue"
          icon={<UsersIcon size={18} />}
        />
        <StatCard
          label="Active Customers"
          value={formatNumber(stats.customerCount)}
          hint="Stage: CUSTOMER"
          tone="green"
          icon={<CheckCircleIcon size={18} />}
        />
        <StatCard
          label="Sales Opportunities"
          value={formatNumber(stats.opportunityCount)}
          hint="Stage: OPPORTUNITY"
          tone="amber"
          icon={<TrendingUpIcon size={18} />}
        />
        <StatCard
          label="Linked to Organization"
          value={formatNumber(stats.orgLinkedCount)}
          hint="Associated with a company"
          tone="purple"
          icon={<BuildingIcon size={18} />}
        />
      </section>

      {/* Scope Switcher (All Contacts vs My Contacts) & View Switcher (Table / List) */}
      <div className="lg-card ld-ControlDeck">
        <div className="ld-scope-tabs" role="tablist" aria-label="Contact ownership scope">
          <button
            type="button"
            role="tab"
            aria-selected={scope === 'all'}
            className={`ld-scope-tab ${scope === 'all' ? 'is-active' : ''}`}
            onClick={() => {
              setManualScope('all');
              setPage(1);
            }}
          >
            <UsersIcon size={15} />
            <span>All Contacts</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === 'my'}
            className={`ld-scope-tab ${scope === 'my' ? 'is-active' : ''}`}
            onClick={() => {
              setManualScope('my');
              setPage(1);
            }}
          >
            <UserIcon size={15} />
            <span>My Contacts</span>
          </button>
        </div>

        <div className="ld-view-switcher" role="group" aria-label="Switch contact view mode">
          <button
            type="button"
            className={`ld-view-btn ${viewMode === 'table' ? 'is-active' : ''}`}
            onClick={() => setManualViewMode('table')}
          >
            Table View
          </button>
          <button
            type="button"
            className={`ld-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
            onClick={() => setManualViewMode('list')}
          >
            List View
          </button>
        </div>
      </div>

      {/* Search, Filters & Sorting Bar */}
      <FilterBar
        onRefresh={fetchContacts}
        onReset={resetFilters}
        hasActiveFilters={Boolean(
          search ||
            stageFilter ||
            organizationFilter ||
            ownerFilter ||
            departmentFilter ||
            sortField !== 'createdAt' ||
            sortDirection !== 'desc',
        )}
      >
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search name, email, phone, job title, or company..."
        />

        <FilterSelect
          label="Stage"
          value={stageFilter}
          onChange={(val) => {
            setStageFilter(val);
            setPage(1);
          }}
          options={CONTACT_STAGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          allLabel="All Stages"
        />

        <FilterSelect
          label="Organization"
          value={organizationFilter}
          onChange={(val) => {
            setOrganizationFilter(val);
            setPage(1);
          }}
          options={organizations.map((org) => ({ value: org.id, label: org.name }))}
          allLabel="All Organizations"
        />

        {scope === 'all' && (
          <FilterSelect
            label="Owner"
            value={ownerFilter}
            onChange={(val) => {
              setOwnerFilter(val);
              setPage(1);
            }}
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            allLabel="All Owners"
          />
        )}

        <FilterSelect
          label="Sort By"
          value={sortField}
          onChange={(val) => setSortField((val || 'createdAt') as ContactSortField)}
          options={CONTACT_SORT_OPTIONS}
          allLabel="Created Date"
        />

        <FilterSelect
          label="Order"
          value={sortDirection}
          onChange={(val) => setSortDirection((val || 'desc') as SortDirection)}
          options={[
            { value: 'desc', label: 'Descending' },
            { value: 'asc', label: 'Ascending' },
          ]}
          allLabel="Descending"
        />
      </FilterBar>

      {/* Bulk Action Strip when 1+ Contacts are Selected */}
      {selectedIds.length > 0 && (
        <div className="lg-card ld-bulk-bar">
          <div className="ld-bulk-info">
            <strong>{selectedIds.length}</strong> contact{selectedIds.length === 1 ? '' : 's'}{' '}
            selected
          </div>
          <div className="ld-bulk-actions">
            {permissions.canEdit && (
              <div className="lg-badge-row">
                <select
                  className="lg-select ld-compact-select"
                  value={bulkStageValue}
                  onChange={(e) => setBulkStageValue(e.target.value)}
                  aria-label="Bulk stage selection"
                >
                  <option value="">Set Lifecycle Stage...</option>
                  {CONTACT_STAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="auth-btn btn-primary"
                  disabled={!bulkStageValue}
                  onClick={handleBulkStageApply}
                >
                  Apply Stage
                </button>
              </div>
            )}
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={handleQuickExportCsv}
            >
              Export Selected ({selectedIds.length})
            </button>
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Active View Render: Table or List */}
      {viewMode === 'table' && <ContactsTableView {...sharedViewProps} />}
      {viewMode === 'list' && <ContactsListView {...sharedViewProps} />}

      {/* Pagination */}
      <Pagination
        meta={meta}
        onPageChange={(nextPage) => setPage(nextPage)}
        disabled={isLoading}
        noun="contacts"
      />

      {/* Quick Contact Preview Drawer */}
      <ContactQuickDrawer
        contact={previewContact}
        isOpen={Boolean(previewContact)}
        permissions={permissions}
        onClose={() => setPreviewContact(null)}
        onStageChange={handleStageChange}
        onConvert={(c) => setContactToConvert(c)}
      />

      {/* Convert Contact to Customer Modal */}
      <ConvertContactModal
        contact={contactToConvert}
        pipelines={pipelines}
        isOpen={Boolean(contactToConvert)}
        onClose={() => setContactToConvert(null)}
        onConvert={handleConvertSubmit}
      />

      {/* Delete Contact Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(contactToDelete)}
        title="Delete Contact"
        message={`Are you sure you want to permanently delete "${contactFullName(
          contactToDelete,
        )}" (${contactToDelete?.email || ''})? Associated activities and notes will also be removed.`}
        confirmLabel="Delete Contact"
        onConfirm={handleConfirmDelete}
        onClose={() => setContactToDelete(null)}
        isLoading={isDeleting}
      />
    </ContactsLayout>
  );
};
