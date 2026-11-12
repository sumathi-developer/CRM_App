import React, { useState, useEffect, useMemo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { customFieldService } from '../../services/custom-field.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type {
  CustomFieldEntity,
  CustomFieldEntityType,
  CustomFieldType,
} from '../../types/custom-field.types';
import { Navbar } from '../../components/common/Navbar';
import {
  CustomFieldEntityBadge,
  CustomFieldTypeBadge,
} from './CustomFieldBadges';
import { LayoutPreviewModal } from './LayoutPreviewModal';
import { TypeMigrationModal } from './TypeMigrationModal';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { StatCard } from '../lead-generation/components/Cards';
import { FilterBar, SearchInput } from '../lead-generation/components/FilterBar';
import {
  SlidersIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  EyeIcon,
  CopyIcon,
  LayersIcon,
  BuildingIcon,
  UserIcon,
  TrophyIcon,
  CalendarIcon,
} from './CustomFieldIcons';

const ENTITY_TABS: Array<{
  label: string;
  value: CustomFieldEntityType | 'ALL';
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { label: 'All Entities', value: 'ALL', icon: LayersIcon },
  { label: 'Leads', value: 'LEAD', icon: BuildingIcon },
  { label: 'Contacts', value: 'CONTACT', icon: UserIcon },
  { label: 'Companies', value: 'COMPANY', icon: BuildingIcon },
  { label: 'Deals', value: 'DEAL', icon: TrophyIcon },
  { label: 'Activities', value: 'ACTIVITY', icon: CalendarIcon },
];

const ALL_FIELD_TYPES: Array<{ label: string; value: CustomFieldType | '' }> = [
  { label: 'All Data Types', value: '' },
  { label: 'Single Line Text', value: 'TEXT' },
  { label: 'Long Text / Textarea', value: 'LONG_TEXT' },
  { label: 'Number', value: 'NUMBER' },
  { label: 'Currency', value: 'CURRENCY' },
  { label: 'Percentage', value: 'PERCENTAGE' },
  { label: 'Date', value: 'DATE' },
  { label: 'Date & Time', value: 'DATETIME' },
  { label: 'Checkbox (Boolean)', value: 'CHECKBOX' },
  { label: 'Dropdown (Single)', value: 'DROPDOWN' },
  { label: 'Multi Select', value: 'MULTI_SELECT' },
  { label: 'Radio Group', value: 'RADIO' },
  { label: 'URL / Website', value: 'URL' },
  { label: 'Email Address', value: 'EMAIL' },
  { label: 'Phone Number', value: 'PHONE' },
  { label: 'User Selector', value: 'USER_SELECTOR' },
];

export const CustomFieldsListPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { currentWorkspace, userRoleInWorkspace } = useWorkspace();

  const [allFields, setAllFields] = useState<CustomFieldEntity[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Filters
  const [selectedEntityTab, setSelectedEntityTab] = useState<CustomFieldEntityType | 'ALL'>('ALL');
  const [selectedFieldType, setSelectedFieldType] = useState<CustomFieldType | ''>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Modals
  const [isPreviewLayoutOpen, setIsPreviewLayoutOpen] = useState<boolean>(false);
  const [previewEntityType, setPreviewEntityType] = useState<CustomFieldEntityType>('LEAD');

  const [migrationField, setMigrationField] = useState<CustomFieldEntity | null>(null);

  const [fieldToDelete, setFieldToDelete] = useState<CustomFieldEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canManageFields =
    currentUser?.role?.name === 'ADMIN' ||
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN';

  // Load custom fields with warm cache & SWR (stale-while-revalidate)
  useEffect(() => {
    let ignore = false;

    const loadData = async (forceRefresh = false) => {
      // Only show full loader on initial cold start when no fields are in state
      if (allFields.length === 0) {
        setIsLoading(true);
      }
      setApiError(null);
      try {
        const res = await customFieldService.getCustomFields(
          {
            workspaceId: currentWorkspace?.id,
            limit: 250,
          },
          forceRefresh,
        );

        if (!ignore) {
          const list = res.data || [];
          setAllFields(list);
          setTotalCount(res.meta?.total ?? list.length);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load custom fields');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadData(refreshTrigger > 0);

    // Warm-up layout cache in the background so opening preview modal is 0ms
    customFieldService.preloadAllLayouts(currentWorkspace?.id);

    return () => {
      ignore = true;
    };
  }, [currentWorkspace?.id, refreshTrigger]);

  // Instant client-side filtering across tabs, types, and search (0ms latency)
  const fields = useMemo(() => {
    let result = allFields;
    if (selectedEntityTab !== 'ALL') {
      result = result.filter((f) => f.entityType === selectedEntityTab);
    }
    if (selectedFieldType) {
      result = result.filter((f) => f.fieldType === selectedFieldType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.key.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q)) ||
          (f.section && f.section.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [allFields, selectedEntityTab, selectedFieldType, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!fieldToDelete) return;
    setIsDeleting(true);
    setApiError(null);
    try {
      await customFieldService.deleteCustomField(fieldToDelete.id);
      setApiSuccess(`Custom field "${fieldToDelete.name}" deleted successfully.`);
      setFieldToDelete(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete custom field');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Metrics computation from allFields
  const activeFieldsCount = allFields.filter((f) => f.isActive && !f.isArchived).length;
  const filterableCount = allFields.filter((f) => f.isFilterable || f.isSearchable).length;

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedFieldType || selectedEntityTab !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedFieldType('');
    setSelectedEntityTab('ALL');
  };

  return (
    <div className="crm-app-container">
      <Navbar />

      <main className="crm-main-content">
        {/* Top Custom Fields Sub-Navigation */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="Custom Fields navigation"
          style={{ marginBottom: '1.5rem' }}
        >
          <div className="lg-subnav-group">
            <span className="lg-subnav-label">Custom Fields</span>
            <div className="lg-subnav-links">
              <NavLink to="/custom-fields" end className={({ isActive }) => `lg-subnav-link ${isActive ? 'is-active' : ''}`}>
                All Custom Fields
              </NavLink>
              <NavLink to="/custom-fields/create" className={({ isActive }) => `lg-subnav-link ${isActive ? 'is-active' : ''}`}>
                Create Custom Field
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Page Header */}
        <div className="workspace-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SlidersIcon size={20} />
              </div>
              <h1 className="workspace-page-title" style={{ margin: 0 }}>Custom Fields Studio</h1>
            </div>
            <p className="workspace-page-subtitle" style={{ margin: 0 }}>
              Extend CRM schemas with custom typed attributes, responsive form layouts, and safe value migrations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Form Layout Preview Trigger */}
            <button
              type="button"
              className="auth-btn btn-secondary btn-size-small"
              onClick={() => {
                const targetEntity = selectedEntityTab === 'ALL' ? 'LEAD' : selectedEntityTab;
                setPreviewEntityType(targetEntity);
                setIsPreviewLayoutOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <EyeIcon size={16} />
              <span>Layout Preview</span>
            </button>

            {/* Create Field Link */}
            {canManageFields && (
              <Link
                to="/custom-fields/create"
                className="auth-btn btn-primary btn-size-small"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                <PlusIcon size={16} />
                <span>Create Custom Field</span>
              </Link>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        {/* KPI Metrics Grid */}
        <div className="lg-stat-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard
            label="Total Schema Fields"
            value={totalCount}
            hint="Across all CRM modules"
            tone="blue"
            icon={<SlidersIcon size={18} />}
          />
          <StatCard
            label="Active In Layouts"
            value={activeFieldsCount}
            hint="Rendered in forms & views"
            tone="green"
            icon={<EyeIcon size={18} />}
          />
          <StatCard
            label="Entities Covered"
            value={5}
            hint="Lead, Contact, Company, Deal, Activity"
            tone="cyan"
            icon={<LayersIcon size={18} />}
          />
          <StatCard
            label="Filterable / Searchable"
            value={filterableCount}
            hint="Indexed for fast querying"
            tone="purple"
            icon={<SearchIcon size={18} />}
          />
        </div>

        {/* Entity Navigation Tabs */}
        <div className="entity-tabs-bar" role="tablist" aria-label="Filter by CRM entity">
          {ENTITY_TABS.map((tab) => {
            const countForTab =
              tab.value === 'ALL'
                ? allFields.length
                : allFields.filter((f) => f.entityType === tab.value).length;
            const isActive = selectedEntityTab === tab.value;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`entity-tab-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setSelectedEntityTab(tab.value)}
              >
                <TabIcon size={14} />
                <span>{tab.label}</span>
                <span className="entity-tab-count">{countForTab}</span>
              </button>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <FilterBar
          onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
          onReset={hasActiveFilters ? handleResetFilters : undefined}
          hasActiveFilters={hasActiveFilters}
          title="Filter Schema Fields"
          className="mb-6"
        >
          <SearchInput
            value={searchQuery}
            onChange={(val: string) => setSearchQuery(val)}
            placeholder="Search by field name, key, or section..."
            label="Search Fields"
            id="custom-field-search"
          />

          <div className="crm-filter-control lg-filter-control lg-filter-select-wrap">
            <label className="crm-filter-label lg-filter-label" htmlFor="custom-field-type-select">
              Data Type
            </label>
            <div className="crm-filter-select-wrap">
              <select
                id="custom-field-type-select"
                className="crm-filter-select lg-select"
                value={selectedFieldType}
                onChange={(e) => setSelectedFieldType(e.target.value as CustomFieldType | '')}
              >
                {ALL_FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FilterBar>

        {/* Content Table or Loading */}
        {isLoading ? (
          <div
            className="lg-card"
            style={{
              padding: '3.5rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
            }}
          >
            <LoadingIndicator size="large" />
            <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
              Loading custom fields definitions...
            </p>
          </div>
        ) : fields.length === 0 ? (
          <div className="lg-card" style={{ padding: '3.5rem 1.5rem', borderRadius: '16px' }}>
            <EmptyState
              icon={
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.5rem',
                  }}
                >
                  <SlidersIcon size={28} />
                </div>
              }
              title="No custom fields found"
              description={
                searchQuery || selectedFieldType
                  ? 'Try adjusting your filters or search keyword.'
                  : 'Get started by creating your first custom schema attribute for this workspace.'
              }
              action={
                canManageFields ? (
                  <Link
                    to="/custom-fields/create"
                    className="auth-btn btn-primary btn-size-small"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <PlusIcon size={16} />
                    <span>Create Custom Field</span>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="lg-card lg-table-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="lg-table-scroll">
              <table className="lg-table ld-table">
                <thead>
                  <tr>
                    <th>Field Name & Key</th>
                    <th>Entity</th>
                    <th>Data Type</th>
                    <th>Section & Width</th>
                    <th>Flags</th>
                    <th>Options</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.id}>
                      {/* Name & Key */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                          <Link
                            to={`/custom-fields/${field.id}`}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {field.name}
                          </Link>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                          <code
                            style={{
                              fontSize: '0.75rem',
                              color: '#065f46',
                              background: 'rgba(16, 185, 129, 0.08)',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                            }}
                          >
                            {field.key}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(field.key)}
                            title="Copy key"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedKey === field.key ? '#10b981' : '#64748b',
                              cursor: 'pointer',
                              padding: '0.1rem',
                            }}
                          >
                            {copiedKey === field.key ? <CheckCircleIcon size={12} /> : <CopyIcon size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Entity Badge */}
                      <td>
                        <CustomFieldEntityBadge entityType={field.entityType} />
                      </td>

                      {/* Data Type Badge */}
                      <td>
                        <CustomFieldTypeBadge type={field.fieldType} />
                      </td>

                      {/* Section & Width */}
                      <td>
                        <div style={{ color: 'var(--text-primary, #0f172a)', fontSize: '0.85rem', fontWeight: 600 }}>
                          {field.section || 'General'}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                          {field.gridWidth === 6 ? 'Half Width (6/12)' : 'Full Width (12/12)'}
                        </span>
                      </td>

                      {/* Behavior Flags */}
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {field.isRequired && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#dc2626',
                                fontWeight: 600,
                              }}
                            >
                              Required
                            </span>
                          )}
                          {field.isUnique && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: 'rgba(245, 158, 11, 0.12)',
                                color: '#d97706',
                                fontWeight: 600,
                              }}
                            >
                              Unique
                            </span>
                          )}
                          {field.isFilterable && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: 'rgba(59, 130, 246, 0.12)',
                                color: '#2563eb',
                                fontWeight: 600,
                              }}
                            >
                              Filterable
                            </span>
                          )}
                          {field.isSearchable && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: 'rgba(168, 85, 247, 0.12)',
                                color: '#7c3aed',
                                fontWeight: 600,
                              }}
                            >
                              Searchable
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Options Count */}
                      <td>
                        {['DROPDOWN', 'MULTI_SELECT', 'RADIO'].includes(field.fieldType) ? (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-primary, #1e293b)',
                              background: 'rgba(16, 185, 129, 0.12)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              fontWeight: 600,
                            }}
                          >
                            {field.options ? field.options.length : 0} options
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="align-right">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Details View */}
                          <Link
                            to={`/custom-fields/${field.id}`}
                            className="auth-btn btn-secondary btn-size-small"
                            style={{
                              padding: '0.35rem 0.5rem',
                              display: 'inline-flex',
                            }}
                            title="View field details"
                          >
                            <EyeIcon size={14} />
                          </Link>

                          {/* Safe Type Migration Modal Trigger */}
                          {canManageFields && (
                            <button
                              type="button"
                              onClick={() => setMigrationField(field)}
                              className="auth-btn btn-secondary btn-size-small"
                              style={{
                                padding: '0.35rem 0.5rem',
                                color: '#2563eb',
                                display: 'inline-flex',
                              }}
                              title="Migrate field data type"
                            >
                              <RefreshCwIcon size={14} />
                            </button>
                          )}

                          {/* Edit Link */}
                          {canManageFields && (
                            <Link
                              to={`/custom-fields/${field.id}/edit`}
                              className="auth-btn btn-secondary btn-size-small"
                              style={{
                                padding: '0.35rem 0.5rem',
                                display: 'inline-flex',
                              }}
                              title="Edit field settings"
                            >
                              <EditIcon size={14} />
                            </Link>
                          )}

                          {/* Delete Trigger */}
                          {canManageFields && (
                            <button
                              type="button"
                              onClick={() => setFieldToDelete(field)}
                              className="auth-btn btn-secondary btn-size-small"
                              style={{
                                padding: '0.35rem 0.5rem',
                                color: '#dc2626',
                                display: 'inline-flex',
                              }}
                              title="Delete or archive field"
                            >
                              <TrashIcon size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dynamic Layout Preview Modal */}
        <LayoutPreviewModal
          isOpen={isPreviewLayoutOpen}
          initialEntityType={previewEntityType}
          onClose={() => setIsPreviewLayoutOpen(false)}
        />

        {/* Safe Type Migration Modal */}
        <TypeMigrationModal
          isOpen={Boolean(migrationField)}
          field={migrationField}
          onClose={() => setMigrationField(null)}
          onSuccess={() => {
            setApiSuccess('Field type migrated successfully.');
            setRefreshTrigger((prev) => prev + 1);
          }}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={Boolean(fieldToDelete)}
          title={`Delete Custom Field "${fieldToDelete?.name}"?`}
          message="Deleting this field may hide or remove stored attribute values associated with CRM records. Are you sure you want to proceed?"
          isLoading={isDeleting}
          onClose={() => setFieldToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      </main>
    </div>
  );
};
