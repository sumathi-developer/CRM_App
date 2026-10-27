import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customFieldService } from '../../services/custom-field.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { CustomFieldEntity } from '../../types/custom-field.types';
import { Navbar } from '../../components/common/Navbar';
import {
  CustomFieldEntityBadge,
  CustomFieldTypeBadge,
} from './CustomFieldBadges';
import { TypeMigrationModal } from './TypeMigrationModal';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  SlidersIcon,
  ArrowLeftIcon,
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  CopyIcon,
  ClockIcon,
} from './CustomFieldIcons';

export const CustomFieldDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [field, setField] = useState<CustomFieldEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canManage =
    currentUser?.role?.name === 'ADMIN' ||
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN';

  useEffect(() => {
    let ignore = false;

    const loadField = async () => {
      if (!id) return;
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await customFieldService.getCustomFieldById(id);
        if (!ignore) {
          setField(data);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load custom field details');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadField();
    return () => {
      ignore = true;
    };
  }, [id, refreshTrigger]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = async () => {
    if (!field) return;
    setIsDeleting(true);
    setApiError(null);
    try {
      await customFieldService.deleteCustomField(field.id);
      setApiSuccess('Custom field deleted.');
      setTimeout(() => {
        navigate('/custom-fields');
      }, 700);
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete field');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="crm-app-container">
        <Navbar />
        <main className="crm-main-content">
          <div
            style={{
              padding: '4rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LoadingIndicator size="large" />
            <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Loading field details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="crm-app-container">
        <Navbar />
        <main className="crm-main-content">
          <div style={{ marginBottom: '1.25rem' }}>
            <Link
              to="/custom-fields"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#94a3b8',
                textDecoration: 'none',
              }}
            >
              <ArrowLeftIcon size={16} />
              <span>Back to Custom Fields</span>
            </Link>
          </div>
          <ErrorMessage error={apiError || 'Custom field not found.'} />
        </main>
      </div>
    );
  }

  return (
    <div className="crm-app-container">
      <Navbar />

      <main className="crm-main-content">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            to="/custom-fields"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            <ArrowLeftIcon size={16} />
            <span>Back to Custom Fields</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="workspace-page-header" style={{ marginBottom: '1.5rem' }}>
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
              <div>
                <h1 className="workspace-page-title" style={{ margin: 0 }}>{field.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <CustomFieldEntityBadge entityType={field.entityType} />
                  <CustomFieldTypeBadge type={field.fieldType} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: field.isActive ? '#34d399' : '#f87171',
                      background: field.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                    }}
                  >
                    {field.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {canManage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Type Migration Button */}
              <button
                type="button"
                onClick={() => setIsMigrationOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <RefreshCwIcon size={16} />
                <span>Migrate Type</span>
              </button>

              {/* Edit Link */}
              <Link
                to={`/custom-fields/${field.id}/edit`}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                <EditIcon size={16} />
                <span>Edit Field</span>
              </Link>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
                title="Delete field"
              >
                <TrashIcon size={16} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
          {/* Main 8 cols: Config & Options */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Field Identity & Configuration */}
            <div
              style={{
                background: 'var(--bg-card, #0f172a)',
                border: '1px solid var(--border-color, #1e293b)',
                borderRadius: '12px',
                padding: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 1rem 0' }}>
                Schema & API Identity
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>API Identifier Key</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <code
                      style={{
                        fontSize: '0.875rem',
                        color: '#60a5fa',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {field.key}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(field.key)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedKey === field.key ? '#34d399' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                      title="Copy Key"
                    >
                      {copiedKey === field.key ? <CheckCircleIcon size={16} /> : <CopyIcon size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Target Entity</span>
                  <div style={{ marginTop: '0.25rem' }}>
                    <CustomFieldEntityBadge entityType={field.entityType} />
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Placeholder Text</span>
                  <div style={{ color: '#e2e8f0', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {field.placeholder || <span style={{ color: '#64748b' }}>None</span>}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Helper Text</span>
                  <div style={{ color: '#e2e8f0', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {field.helpText || <span style={{ color: '#64748b' }}>None</span>}
                  </div>
                </div>
              </div>

              {field.description && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color, #1e293b)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Admin Description</span>
                  <p style={{ color: '#cbd5e1', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                    {field.description}
                  </p>
                </div>
              )}
            </div>

            {/* Options List (If choice field) */}
            {field.options && field.options.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-card, #0f172a)',
                  border: '1px solid var(--border-color, #1e293b)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                }}
              >
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 1rem 0' }}>
                  Configured Choices ({field.options.length})
                </h2>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border-color, #1e293b)',
                          color: '#94a3b8',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        <th style={{ padding: '0.5rem' }}>Order</th>
                        <th style={{ padding: '0.5rem' }}>Color Badge</th>
                        <th style={{ padding: '0.5rem' }}>Label</th>
                        <th style={{ padding: '0.5rem' }}>Value Key</th>
                        <th style={{ padding: '0.5rem' }}>Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {field.options.map((opt, idx) => (
                        <tr key={opt.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.6rem 0.5rem', color: '#64748b' }}>#{opt.order || idx + 1}</td>
                          <td style={{ padding: '0.6rem 0.5rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  background: opt.color || '#3b82f6',
                                  display: 'inline-block',
                                }}
                              />
                              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                                {opt.color || '#3b82f6'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600, color: '#f8fafc' }}>
                            {opt.label}
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem' }}>
                            <code style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{opt.value}</code>
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem' }}>
                            {opt.isDefault ? (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  color: '#60a5fa',
                                }}
                              >
                                Default
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Type Migration History */}
            {field.typeHistories && field.typeHistories.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-card, #0f172a)',
                  border: '1px solid var(--border-color, #1e293b)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <ClockIcon size={18} />
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                    Type Migration Audit Trail
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {field.typeHistories.map((hist) => (
                    <div
                      key={hist.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid var(--border-color, #1e293b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CustomFieldTypeBadge type={hist.fromType} />
                          <span style={{ color: '#64748b' }}>→</span>
                          <CustomFieldTypeBadge type={hist.toType} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                          Strategy: {hist.strategy} • Converted: {hist.convertedCount}/{hist.totalRecords}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(hist.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side 4 cols: Layout & Rules */}
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Form Section Placement */}
            <div
              style={{
                background: 'var(--bg-card, #0f172a)',
                border: '1px solid var(--border-color, #1e293b)',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 1rem 0' }}>
                Form Layout Settings
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Section Name</span>
                  <div style={{ color: '#f8fafc', fontWeight: 500, marginTop: '0.15rem' }}>
                    {field.section || 'General Information'}
                  </div>
                </div>

                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Grid Layout Width</span>
                  <div style={{ color: '#f8fafc', fontWeight: 500, marginTop: '0.15rem' }}>
                    {field.gridWidth === 6 ? 'Half Width (6 of 12 columns)' : 'Full Width (12 of 12 columns)'}
                  </div>
                </div>

                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Order Priority</span>
                  <div style={{ color: '#f8fafc', fontWeight: 500, marginTop: '0.15rem' }}>
                    {field.order}
                  </div>
                </div>
              </div>
            </div>

            {/* Validation & Behavioral Flags */}
            <div
              style={{
                background: 'var(--bg-card, #0f172a)',
                border: '1px solid var(--border-color, #1e293b)',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 1rem 0' }}>
                Validation & Rules
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#cbd5e1' }}>Required Field</span>
                  <span style={{ color: field.isRequired ? '#34d399' : '#64748b', fontWeight: 600 }}>
                    {field.isRequired ? 'Yes' : 'No'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#cbd5e1' }}>Unique Value</span>
                  <span style={{ color: field.isUnique ? '#34d399' : '#64748b', fontWeight: 600 }}>
                    {field.isUnique ? 'Yes' : 'No'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#cbd5e1' }}>Visible in Forms</span>
                  <span style={{ color: field.isVisible ? '#34d399' : '#64748b', fontWeight: 600 }}>
                    {field.isVisible ? 'Yes' : 'No'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#cbd5e1' }}>Searchable Index</span>
                  <span style={{ color: field.isSearchable ? '#34d399' : '#64748b', fontWeight: 600 }}>
                    {field.isSearchable ? 'Yes' : 'No'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#cbd5e1' }}>Filterable in Tables</span>
                  <span style={{ color: field.isFilterable ? '#34d399' : '#64748b', fontWeight: 600 }}>
                    {field.isFilterable ? 'Yes' : 'No'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#cbd5e1' }}>Editable</span>
                  <span style={{ color: field.isEditable ? '#34d399' : '#64748b', fontWeight: 600 }}>
                    {field.isEditable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Type Migration Modal */}
        <TypeMigrationModal
          isOpen={isMigrationOpen}
          field={field}
          onClose={() => setIsMigrationOpen(false)}
          onSuccess={() => {
            setApiSuccess('Field type migrated successfully.');
            setRefreshTrigger((prev) => prev + 1);
          }}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={isDeleteOpen}
          title={`Delete Custom Field "${field.name}"?`}
          message="Deleting this field may hide or remove stored attribute values associated with CRM records. Are you sure you want to proceed?"
          isLoading={isDeleting}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      </main>
    </div>
  );
};
