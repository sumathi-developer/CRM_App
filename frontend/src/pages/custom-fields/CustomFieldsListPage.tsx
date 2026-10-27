import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from './CustomFieldIcons';

const ENTITY_TABS: Array<{ label: string; value: CustomFieldEntityType | 'ALL' }> = [
  { label: 'All Entities', value: 'ALL' },
  { label: 'Leads', value: 'LEAD' },
  { label: 'Contacts', value: 'CONTACT' },
  { label: 'Companies', value: 'COMPANY' },
  { label: 'Deals', value: 'DEAL' },
  { label: 'Activities', value: 'ACTIVITY' },
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

  const [fields, setFields] = useState<CustomFieldEntity[]>([]);
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

  // Load custom fields
  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const res = await customFieldService.getCustomFields({
          entityType: selectedEntityTab === 'ALL' ? undefined : selectedEntityTab,
          fieldType: selectedFieldType || undefined,
          search: searchQuery.trim() || undefined,
          workspaceId: currentWorkspace?.id,
          limit: 100,
        });

        if (!ignore) {
          setFields(res.data || []);
          setTotalCount(res.meta?.total ?? (res.data ? res.data.length : 0));
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

    loadData();
    return () => {
      ignore = true;
    };
  }, [selectedEntityTab, selectedFieldType, searchQuery, currentWorkspace?.id, refreshTrigger]);

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

  // Metrics computation
  const activeFieldsCount = fields.filter((f) => f.isActive && !f.isArchived).length;
  const filterableCount = fields.filter((f) => f.isFilterable || f.isSearchable).length;

  return (
    <div className="crm-app-container">
      <Navbar />

      <main className="crm-main-content">
        {/* Page Header */}
        <div className="workspace-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
              onClick={() => {
                const targetEntity = selectedEntityTab === 'ALL' ? 'LEAD' : selectedEntityTab;
                setPreviewEntityType(targetEntity);
                setIsPreviewLayoutOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #334155)',
                background: 'var(--bg-card, #0f172a)',
                color: '#cbd5e1',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <EyeIcon size={16} />
              <span>Layout Preview</span>
            </button>

            {/* Create Field Link */}
            {canManageFields && (
              <Link
                to="/custom-fields/create"
                className="btn-primary"
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

        {/* KPI Metrics Strip */}
        <div className="custom-fields-metrics-strip">
          <div className="workspace-info-card">
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Schema Fields
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.25rem' }}>
              {totalCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Across all CRM modules</span>
          </div>

          <div className="workspace-info-card">
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active In Layouts
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#34d399', marginTop: '0.25rem' }}>
              {activeFieldsCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Rendered in forms & views</span>
          </div>

          <div className="workspace-info-card">
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Entities Covered
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#60a5fa', marginTop: '0.25rem' }}>
              5
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Lead, Contact, Company, Deal, Activity</span>
          </div>

          <div className="workspace-info-card">
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filterable / Searchable
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#c084fc', marginTop: '0.25rem' }}>
              {filterableCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Indexed for fast querying</span>
          </div>
        </div>

        {/* Entity Navigation Tabs */}
        <div className="entity-tabs-bar" role="tablist">
          {ENTITY_TABS.map((tab) => {
            const countForTab =
              tab.value === 'ALL'
                ? fields.length
                : fields.filter((f) => f.entityType === tab.value).length;
            const isActive = selectedEntityTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`entity-tab-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setSelectedEntityTab(tab.value)}
              >
                <span>{tab.label}</span>
                <span className="entity-tab-count">{countForTab}</span>
              </button>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none',
                }}
              >
                <SearchIcon size={16} />
              </div>
              <input
                type="text"
                placeholder="Search by field name, key, or section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  borderRadius: '8px',
                  background: 'var(--bg-card, #0f172a)',
                  border: '1px solid var(--border-color, #1e293b)',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Field Type Filter */}
            <select
              value={selectedFieldType}
              onChange={(e) => setSelectedFieldType(e.target.value as CustomFieldType | '')}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: 'var(--bg-card, #0f172a)',
                border: '1px solid var(--border-color, #1e293b)',
                color: '#cbd5e1',
                fontSize: '0.875rem',
              }}
            >
              {ALL_FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--border-color, #1e293b)',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.825rem',
              }}
              title="Refresh list"
            >
              <RefreshCwIcon size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Content Table or Loading */}
        {isLoading ? (
          <div
            style={{
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card, #0f172a)',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #1e293b)',
            }}
          >
            <LoadingIndicator size="large" />
            <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              Loading custom fields definitions...
            </p>
          </div>
        ) : fields.length === 0 ? (
          <EmptyState
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
                  className="btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <PlusIcon size={16} />
                  <span>Create Custom Field</span>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div
            style={{
              background: 'var(--bg-card, #0f172a)',
              border: '1px solid var(--border-color, #1e293b)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-color, #1e293b)',
                      background: 'rgba(30, 41, 59, 0.4)',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ padding: '0.875rem 1rem' }}>Field Name & Key</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Entity</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Data Type</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Section & Width</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Flags</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Options</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr
                      key={field.id}
                      style={{
                        borderBottom: '1px solid rgba(30, 41, 59, 0.6)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Name & Key */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>
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
                              color: '#94a3b8',
                              background: 'rgba(255, 255, 255, 0.05)',
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
                              color: copiedKey === field.key ? '#34d399' : '#64748b',
                              cursor: 'pointer',
                              padding: '0.1rem',
                            }}
                          >
                            {copiedKey === field.key ? <CheckCircleIcon size={12} /> : <CopyIcon size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Entity Badge */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <CustomFieldEntityBadge entityType={field.entityType} />
                      </td>

                      {/* Data Type Badge */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <CustomFieldTypeBadge type={field.fieldType} />
                      </td>

                      {/* Section & Width */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 500 }}>
                          {field.section || 'General'}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {field.gridWidth === 6 ? 'Half Width (6/12)' : 'Full Width (12/12)'}
                        </span>
                      </td>

                      {/* Behavior Flags */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {field.isRequired && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                              }}
                            >
                              Req
                            </span>
                          )}
                          {field.isUnique && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#fbbf24',
                              }}
                            >
                              Uniq
                            </span>
                          )}
                          {field.isFilterable && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#60a5fa',
                              }}
                            >
                              Filt
                            </span>
                          )}
                          {field.isSearchable && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                background: 'rgba(168, 85, 247, 0.15)',
                                color: '#c084fc',
                              }}
                            >
                              Srch
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Options Count */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {['DROPDOWN', 'MULTI_SELECT', 'RADIO'].includes(field.fieldType) ? (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#cbd5e1',
                              background: 'rgba(255, 255, 255, 0.06)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                            }}
                          >
                            {field.options ? field.options.length : 0} options
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Details View */}
                          <Link
                            to={`/custom-fields/${field.id}`}
                            style={{
                              color: '#94a3b8',
                              padding: '0.3rem',
                              borderRadius: '6px',
                              display: 'inline-flex',
                            }}
                            title="View field details"
                          >
                            <EyeIcon size={16} />
                          </Link>

                          {/* Safe Type Migration Modal Trigger */}
                          {canManageFields && (
                            <button
                              type="button"
                              onClick={() => setMigrationField(field)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#60a5fa',
                                padding: '0.3rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                              }}
                              title="Migrate field data type"
                            >
                              <RefreshCwIcon size={16} />
                            </button>
                          )}

                          {/* Edit Link */}
                          {canManageFields && (
                            <Link
                              to={`/custom-fields/${field.id}/edit`}
                              style={{
                                color: '#cbd5e1',
                                padding: '0.3rem',
                                borderRadius: '6px',
                                display: 'inline-flex',
                              }}
                              title="Edit field settings"
                            >
                              <EditIcon size={16} />
                            </Link>
                          )}

                          {/* Delete Trigger */}
                          {canManageFields && (
                            <button
                              type="button"
                              onClick={() => setFieldToDelete(field)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                padding: '0.3rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                              }}
                              title="Delete or archive field"
                            >
                              <TrashIcon size={16} />
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
