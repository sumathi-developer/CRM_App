import React, { useState } from 'react';
import { customFieldService } from '../../services/custom-field.service';
import type {
  CustomFieldEntity,
  CustomFieldType,
  TypeMigrationPreviewResponse,
} from '../../types/custom-field.types';
import { CustomFieldTypeBadge } from './CustomFieldBadges';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  XIcon,
  ArrowRightIcon,
} from '../../components/common/Icons';

interface TypeMigrationModalProps {
  isOpen: boolean;
  field: CustomFieldEntity | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ALL_FIELD_TYPES: CustomFieldType[] = [
  'TEXT',
  'LONG_TEXT',
  'NUMBER',
  'CURRENCY',
  'PERCENTAGE',
  'DATE',
  'DATETIME',
  'CHECKBOX',
  'DROPDOWN',
  'MULTI_SELECT',
  'RADIO',
  'URL',
  'EMAIL',
  'PHONE',
  'USER_SELECTOR',
];

export const TypeMigrationModal: React.FC<TypeMigrationModalProps> = ({
  isOpen,
  field,
  onClose,
  onSuccess,
}) => {
  const [targetType, setTargetType] = useState<CustomFieldType>('TEXT');
  const [strategy, setStrategy] = useState<string>('PRESERVE');
  const [force, setForce] = useState<boolean>(false);

  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [preview, setPreview] = useState<TypeMigrationPreviewResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const [prevFieldId, setPrevFieldId] = useState<string | null>(null);

  if (field && field.id !== prevFieldId) {
    setPrevFieldId(field.id);
    const candidate = ALL_FIELD_TYPES.find((t) => t !== field.fieldType) || 'TEXT';
    setTargetType(candidate);
    setStrategy('PRESERVE');
    setForce(false);
    setPreview(null);
    setApiError(null);
    setApiSuccess(null);
  }

  if (!isOpen || !field) return null;

  const handlePreview = async () => {
    if (!field) return;
    setIsPreviewing(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const res = await customFieldService.previewTypeChange(field.id, targetType, strategy);
      setPreview(res);
    } catch (err: any) {
      setApiError(err.message || 'Failed to preview type migration');
      setPreview(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecuteMigration = async () => {
    if (!field) return;
    setIsMigrating(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      await customFieldService.executeTypeChange(field.id, {
        targetType,
        strategy,
        force,
      });
      setApiSuccess(`Field type converted successfully to ${targetType}!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      setApiError(err.message || 'Failed to execute type migration');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card, #0f172a)',
          border: '1px solid var(--border-color, #1e293b)',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #1e293b)',
            background: 'rgba(30, 41, 59, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              <RefreshCwIcon size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc' }}>
                Safe Field Type Migration
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Convert stored values of <strong>{field.name}</strong> to another compatible type
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isMigrating}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {apiError && <ErrorMessage error={apiError} />}
          {apiSuccess && <SuccessMessage message={apiSuccess} />}

          {/* Current vs Target Selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #1e293b)',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Type
              </span>
              <CustomFieldTypeBadge type={field.fieldType} />
            </div>

            <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRightIcon size={22} />
            </div>

            <div>
              <label
                htmlFor="targetTypeSelect"
                style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Target Type
              </label>
              <select
                id="targetTypeSelect"
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value as CustomFieldType);
                  setPreview(null);
                }}
                disabled={isPreviewing || isMigrating}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-main, #0b1120)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                }}
              >
                {ALL_FIELD_TYPES.filter((t) => t !== field.fieldType).map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Migration Strategy Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label
                htmlFor="migrationStrategy"
                style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
              >
                Conversion Strategy
              </label>
              <select
                id="migrationStrategy"
                value={strategy}
                onChange={(e) => {
                  setStrategy(e.target.value);
                  setPreview(null);
                }}
                disabled={isPreviewing || isMigrating}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-main, #0b1120)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                }}
              >
                <option value="PRESERVE">Preserve Valid Values</option>
                <option value="CAST_OR_NULL">Coerce or Nullify Incompatibles</option>
                <option value="FORMAT">Format / Stringify</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  padding: '0.5rem 0.25rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  disabled={isPreviewing || isMigrating}
                  style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                />
                <span>Force migration even if lossy</span>
              </label>
            </div>
          </div>

          {/* Action to Analyze */}
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing || isMigrating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isPreviewing ? (
                <>
                  <LoadingIndicator size="small" />
                  <span>Analyzing Data Records...</span>
                </>
              ) : (
                <>
                  <RefreshCwIcon size={16} />
                  <span>Analyze Compatibility Preview</span>
                </>
              )}
            </button>
          </div>

          {/* Preview Results Display */}
          {preview && (
            <div className="migration-preview-card">
              <div
                className={`migration-compatibility-banner ${
                  preview.isCompatible ? 'compatible' : 'warning'
                }`}
              >
                {preview.isCompatible ? (
                  <CheckCircleIcon size={20} />
                ) : (
                  <AlertCircleIcon size={20} />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {preview.isCompatible
                      ? 'Type Migration is 100% Compatible'
                      : 'Potential Value Loss Detected'}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    {preview.isCompatible
                      ? 'All existing data can be seamlessly transformed without value truncation.'
                      : 'Some records may have incompatible formatting and will require force approval.'}
                  </div>
                </div>
              </div>

              {/* Counts Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  marginTop: '0.75rem',
                }}
              >
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Records</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    {preview.totalRecords ?? 0}
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Convertible</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>
                    {preview.convertibleCount ?? 0}
                  </div>
                </div>
                <div
                  style={{
                    background: preview.lossyCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: preview.lossyCount > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: preview.lossyCount > 0 ? '#f87171' : '#94a3b8' }}>
                    Lossy / Incompatible
                  </span>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: preview.lossyCount > 0 ? '#f87171' : '#f8fafc',
                    }}
                  >
                    {preview.lossyCount ?? 0}
                  </div>
                </div>
              </div>

              {/* Sample conversions list if available */}
              {preview.sampleConversions && preview.sampleConversions.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
                    Sample Data Conversions
                  </span>
                  <div
                    style={{
                      maxHeight: '120px',
                      overflowY: 'auto',
                      marginTop: '0.35rem',
                      border: '1px solid var(--border-color, #1e293b)',
                      borderRadius: '6px',
                    }}
                  >
                    <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(30, 41, 59, 0.7)', textAlign: 'left', color: '#94a3b8' }}>
                          <th style={{ padding: '0.35rem 0.5rem' }}>Original</th>
                          <th style={{ padding: '0.35rem 0.5rem' }}>Converted</th>
                          <th style={{ padding: '0.35rem 0.5rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sampleConversions.map((sample, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: '0.35rem 0.5rem', color: '#e2e8f0' }}>
                              {String(sample.original ?? 'null')}
                            </td>
                            <td style={{ padding: '0.35rem 0.5rem', color: '#60a5fa' }}>
                              {String(sample.converted ?? 'null')}
                            </td>
                            <td style={{ padding: '0.35rem 0.5rem' }}>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '4px',
                                  background:
                                    sample.status === 'SUCCESS'
                                      ? 'rgba(16, 185, 129, 0.2)'
                                      : 'rgba(239, 68, 68, 0.2)',
                                  color: sample.status === 'SUCCESS' ? '#34d399' : '#f87171',
                                }}
                              >
                                {sample.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color, #1e293b)',
            background: 'rgba(30, 41, 59, 0.3)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isMigrating}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #334155)',
              background: 'transparent',
              color: '#cbd5e1',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteMigration}
            disabled={isMigrating || !preview || (!preview.isCompatible && !force)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              background: !preview || (!preview.isCompatible && !force) ? '#334155' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: !preview || (!preview.isCompatible && !force) ? 'not-allowed' : 'pointer',
              opacity: !preview || (!preview.isCompatible && !force) ? 0.6 : 1,
            }}
          >
            {isMigrating ? (
              <>
                <LoadingIndicator size="small" />
                <span>Migrating Values...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon size={16} />
                <span>Execute Migration</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
