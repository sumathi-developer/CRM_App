import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreateTagPayload, TagStatus } from '../../types/tag.types';
import { TagBadge } from './TagBadge';
import {
  TagIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LockIcon,
  ShieldIcon,
} from '../../components/common/Icons';

const PRESET_TAG_COLORS = [
  { hex: '#3b82f6', label: 'Ocean Blue' },
  { hex: '#6366f1', label: 'Electric Indigo' },
  { hex: '#8b5cf6', label: 'Royal Violet' },
  { hex: '#ec4899', label: 'Fuchsia Pink' },
  { hex: '#ef4444', label: 'Crimson Red' },
  { hex: '#f59e0b', label: 'Amber Orange' },
  { hex: '#10b981', label: 'Emerald Green' },
  { hex: '#14b8a6', label: 'Teal' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#64748b', label: 'Slate Gray' },
];

interface TagFormProps {
  initialValues?: Partial<CreateTagPayload>;
  onSubmit: (payload: CreateTagPayload) => Promise<void>;
  isEdit?: boolean;
  isLoading?: boolean;
  error?: string | null;
  submitLabel?: string;
  cancelPath?: string;
}

export const TagForm: React.FC<TagFormProps> = ({
  initialValues,
  onSubmit,
  isEdit = false,
  isLoading = false,
  error = null,
  submitLabel = isEdit ? 'Save Changes' : 'Create Tag',
  cancelPath = '/tags',
}) => {
  const navigate = useNavigate();

  const [name, setName] = useState(initialValues?.name || '');
  const [color, setColor] = useState(initialValues?.color || '#3b82f6');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [status, setStatus] = useState<TagStatus>(initialValues?.status || 'ACTIVE');
  const [isProtected, setIsProtected] = useState<boolean>(initialValues?.isProtected || false);

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Tag name is required.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Tag name cannot exceed 100 characters.';
    }

    const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    if (color && !hexRegex.test(color.trim())) {
      errors.color = 'Color must be a valid hex code (e.g. #3b82f6 or #fff).';
    }

    if (description && description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: name.trim(),
      color: color.trim().toLowerCase(),
      description: description.trim() || undefined,
      status,
      isProtected,
    });
  };

  return (
    <form
      className="tag-form-card"
      onSubmit={handleSubmit}
      noValidate
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(16, 185, 129, 0.22)',
        borderRadius: '16px',
        padding: '28px 32px',
        boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
      }}
    >
      <style>{`
        .tag-form-card .tag-badge {
          color: ${color || '#3b82f6'} !important;
          font-weight: 600 !important;
        }
        .tag-form-card .tag-badge.is-archived {
          color: #64748b !important;
        }
      `}</style>

      {error && (
        <div
          className="tag-form-alert tag-form-alert-danger"
          role="alert"
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#B91C1C',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1.5rem',
          }}
        >
          <AlertCircleIcon size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Inputs on Left, Real-Time Preview on Right */}
      <div className="tag-form-grid">
        <div className="tag-form-fields-col">
          {/* Tag Name Field */}
          <div className="form-group-custom" style={{ marginBottom: '1.35rem' }}>
            <div className="form-label-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label htmlFor="tag-name-input" className="form-label-custom" style={{ color: '#062E03', fontSize: '13px', fontWeight: 600 }}>
                Tag Name <span className="req-star" style={{ color: '#EF4444' }}>*</span>
              </label>
              <span className={`char-counter ${name.length > 90 ? 'is-warning' : ''}`} style={{ color: name.length > 90 ? '#D97706' : '#64748B', fontSize: '12px' }}>
                {name.length} / 100
              </span>
            </div>
            <div className="input-with-icon-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="input-field-icon" style={{ position: 'absolute', left: '12px', color: '#10B981', pointerEvents: 'none', zIndex: 1 }}>
                <TagIcon size={16} />
              </span>
              <input
                id="tag-name-input"
                type="text"
                className={`form-input-custom has-icon ${validationErrors.name ? 'is-invalid' : ''}`}
                placeholder="e.g. Enterprise Prospect, High Priority, Q4 Deal"
                value={name}
                maxLength={100}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationErrors.name) {
                    setValidationErrors((prev) => ({ ...prev, name: '' }));
                  }
                }}
                disabled={isLoading}
                autoFocus={!isEdit}
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '12px',
                  height: '42px',
                  fontSize: '13.5px',
                  color: '#062E03',
                  backgroundColor: '#FFFFFF',
                  border: validationErrors.name ? '1px solid #EF4444' : '1px solid rgba(16, 185, 129, 0.28)',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => {
                  if (!validationErrors.name) {
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
                  }
                }}
                onBlur={(e) => {
                  if (!validationErrors.name) {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.28)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
            </div>
            {validationErrors.name && (
              <span className="field-error-msg" style={{ display: 'block', fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                {validationErrors.name}
              </span>
            )}
            <p className="field-hint-text" style={{ color: '#64748B', fontSize: '12px', marginTop: '6px', lineHeight: 1.4 }}>
              Names must be unique within your workspace. Use clear, standardized terms for your team.
            </p>
          </div>

          {/* Color Selector */}
          <div className="form-group-custom" style={{ marginBottom: '1.35rem' }}>
            <label className="form-label-custom" style={{ color: '#062E03', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Tag Color
            </label>
            <div className="tag-color-palette-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="tag-color-swatches" role="radiogroup" aria-label="Preset colors" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_TAG_COLORS.map((preset) => {
                  const isSelected = color.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      className={`tag-color-swatch-btn ${isSelected ? 'is-active' : ''}`}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: preset.hex,
                        border: isSelected ? '2px solid #FFFFFF' : '2px solid transparent',
                        boxShadow: isSelected ? '0 0 0 2.5px #10B981, 0 2px 6px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        transition: 'transform 0.15s ease',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      }}
                      onClick={() => {
                        setColor(preset.hex);
                        if (validationErrors.color) {
                          setValidationErrors((prev) => ({ ...prev, color: '' }));
                        }
                      }}
                      title={`${preset.label} (${preset.hex})`}
                      aria-label={preset.label}
                    >
                      {isSelected && <CheckCircleIcon size={14} className="swatch-check-icon" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Picker Input */}
              <div className="tag-custom-color-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="custom-color-picker-input" style={{ position: 'relative' }}>
                  <input
                    type="color"
                    id="tag-native-color-picker"
                    value={color.length === 7 ? color : '#3b82f6'}
                    onChange={(e) => {
                      setColor(e.target.value);
                      if (validationErrors.color) {
                        setValidationErrors((prev) => ({ ...prev, color: '' }));
                      }
                    }}
                    className="native-color-input"
                    title="Choose custom color"
                    style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
                  />
                  <label
                    htmlFor="tag-native-color-picker"
                    className="color-picker-label-trigger"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#062E03',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#EAF4ED';
                      e.currentTarget.style.borderColor = '#10B981';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    <span
                      className="color-swatch-pip"
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: '1px solid rgba(0, 0, 0, 0.15)',
                      }}
                    />
                    <span>Custom Picker</span>
                  </label>
                </div>

                <div
                  className="custom-hex-input-wrap"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    maxWidth: '150px',
                    height: '38px',
                  }}
                >
                  <span
                    className="hex-prefix"
                    style={{
                      padding: '0 10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#062E03',
                      backgroundColor: '#F8FCF9',
                      borderRight: '1px solid rgba(16, 185, 129, 0.2)',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    HEX
                  </span>
                  <input
                    type="text"
                    className={`form-input-custom hex-text-input ${
                      validationErrors.color ? 'is-invalid' : ''
                    }`}
                    value={color}
                    maxLength={7}
                    placeholder="#3b82f6"
                    onChange={(e) => {
                      setColor(e.target.value);
                      if (validationErrors.color) {
                        setValidationErrors((prev) => ({ ...prev, color: '' }));
                      }
                    }}
                    disabled={isLoading}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      color: '#062E03',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>
              </div>
            </div>
            {validationErrors.color && (
              <span className="field-error-msg" style={{ display: 'block', fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                {validationErrors.color}
              </span>
            )}
          </div>

          {/* Description Field */}
          <div className="form-group-custom" style={{ marginBottom: '1.35rem' }}>
            <div className="form-label-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label htmlFor="tag-desc-input" className="form-label-custom" style={{ color: '#062E03', fontSize: '13px', fontWeight: 600 }}>
                Description <span className="opt-label" style={{ color: '#64748B', fontWeight: 400, fontSize: '12px' }}>(Optional)</span>
              </label>
              <span className="char-counter" style={{ color: '#64748B', fontSize: '12px' }}>{description.length} / 500</span>
            </div>
            <textarea
              id="tag-desc-input"
              className={`form-textarea-custom ${validationErrors.description ? 'is-invalid' : ''}`}
              rows={3}
              placeholder="Explain how and when your sales/support reps should apply this tag..."
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#062E03',
                backgroundColor: '#FFFFFF',
                border: validationErrors.description ? '1px solid #EF4444' : '1px solid rgba(16, 185, 129, 0.28)',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => {
                if (!validationErrors.description) {
                  e.currentTarget.style.borderColor = '#10B981';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
                }
              }}
              onBlur={(e) => {
                if (!validationErrors.description) {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.28)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            />
            {validationErrors.description && (
              <span className="field-error-msg" style={{ display: 'block', fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                {validationErrors.description}
              </span>
            )}
          </div>

          {/* Status & Protection Grid */}
          <div className="tag-form-options-row" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Tag Status */}
            <div className="form-group-custom option-col" style={{ marginBottom: 0 }}>
              <label htmlFor="tag-status-select" className="form-label-custom" style={{ color: '#062E03', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Status
              </label>
              <select
                id="tag-status-select"
                className="form-select-custom"
                value={status}
                onChange={(e) => setStatus(e.target.value as TagStatus)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#062E03',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="ACTIVE">Active (Available for CRM entities)</option>
                <option value="INACTIVE">Inactive (Disabled from selection)</option>
                {isEdit && <option value="ARCHIVED">Archived (Read-only historical)</option>}
              </select>
            </div>

            {/* Protection Toggle */}
            <div className="form-group-custom option-col" style={{ marginBottom: 0 }}>
              <label className="form-label-custom" style={{ color: '#062E03', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Workflow Protection
              </label>
              <div
                className={`tag-protection-toggle-card ${isProtected ? 'is-protected' : ''}`}
                onClick={() => setIsProtected(!isProtected)}
                role="checkbox"
                aria-checked={isProtected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setIsProtected(!isProtected);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: isProtected ? '#FEF3C7' : '#F8FCF9',
                  border: isProtected ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.22)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div className="protection-icon-wrap" style={{ color: isProtected ? '#D97706' : '#10B981', marginTop: '2px' }}>
                  {isProtected ? <LockIcon size={18} /> : <ShieldIcon size={18} />}
                </div>
                <div className="protection-text-wrap" style={{ flex: 1 }}>
                  <span className="protection-title" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#062E03', marginBottom: '2px' }}>
                    {isProtected ? 'Protected Tag' : 'Standard Tag'}
                  </span>
                  <span className="protection-desc" style={{ display: 'block', fontSize: '12px', color: '#64748B', lineHeight: 1.35 }}>
                    {isProtected
                      ? 'Deletion is blocked to prevent breaking automated pipelines or filters.'
                      : 'Can be archived or removed by authorized workspace managers.'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isProtected}
                  onChange={(e) => setIsProtected(e.target.checked)}
                  className="protection-checkbox-hidden"
                  tabIndex={-1}
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="tag-form-preview-col">
          <div
            className="tag-preview-card"
            style={{
              backgroundColor: '#F8FCF9',
              border: '1px solid rgba(16, 185, 129, 0.22)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h4 className="preview-heading" style={{ fontSize: '15px', fontWeight: 700, color: '#062E03', marginBottom: '4px' }}>
              Live Tag Preview
            </h4>
            <p className="preview-subtitle" style={{ fontSize: '12px', color: '#64748B', marginBottom: '1.25rem' }}>
              This shows how your tag badge and details appear across the CRM portal.
            </p>

            <div className="preview-stage" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                className="preview-badge-display"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px dashed rgba(16, 185, 129, 0.35)',
                }}
              >
                <TagBadge
                  name={name.trim() || 'Sample Tag'}
                  color={color}
                  status={status}
                  isProtected={isProtected}
                  size="lg"
                  showDot={true}
                  showIcon={false}
                />
              </div>

              <div
                className="preview-variants-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  gap: '0.75rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                }}
              >
                <div className="preview-variant-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="variant-label" style={{ fontSize: '12px', color: '#64748B' }}>Small:</span>
                  <TagBadge
                    name={name.trim() || 'Sample Tag'}
                    color={color}
                    status={status}
                    isProtected={isProtected}
                    size="sm"
                  />
                </div>
                <div className="preview-variant-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="variant-label" style={{ fontSize: '12px', color: '#64748B' }}>With Icon:</span>
                  <TagBadge
                    name={name.trim() || 'Sample Tag'}
                    color={color}
                    status={status}
                    isProtected={isProtected}
                    size="md"
                    showIcon={true}
                  />
                </div>
              </div>

              {/* Sample CRM Entity Simulation */}
              <div
                className="preview-simulation-box"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(16, 185, 129, 0.18)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}
              >
                <div className="sim-entity-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="sim-entity-title" style={{ fontSize: '13px', fontWeight: 600, color: '#062E03' }}>
                    Acme Corp • Deal #4092
                  </span>
                  <span className="sim-entity-price" style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>
                    $75,000
                  </span>
                </div>
                <p className="sim-entity-desc" style={{ fontSize: '12px', color: '#64748B', marginBottom: '10px' }}>
                  Enterprise subscription renewed for FY2026. Stage: Contract Sent.
                </p>
                <div className="sim-entity-tags-list" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <TagBadge
                    name={name.trim() || 'Sample Tag'}
                    color={color}
                    status={status}
                    isProtected={isProtected}
                    size="sm"
                  />
                  <span
                    className="sim-tag-ghost"
                    style={{
                      fontSize: '11px',
                      color: '#10B981',
                      border: '1px dashed rgba(16, 185, 129, 0.4)',
                      backgroundColor: '#EAF4ED',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    + Add Tag
                  </span>
                </div>
              </div>
            </div>

            <div className="preview-footer-note" style={{ marginTop: '1.25rem', paddingTop: '10px', borderTop: '1px solid rgba(16, 185, 129, 0.15)', fontSize: '12px', color: '#64748B' }}>
              <span>Color Hex:</span> <code style={{ color: '#062E03', backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{color}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div
        className="tag-form-actions-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.15)',
        }}
      >
        <button
          type="button"
          className="auth-btn btn-ghost"
          onClick={() => navigate(cancelPath)}
          disabled={isLoading}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#062E03',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '8px',
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EAF4ED';
            e.currentTarget.style.borderColor = '#10B981';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="auth-btn btn-primary"
          disabled={isLoading}
          id="tag-form-submit-btn"
          style={{
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            border: '1px solid #10B981',
            borderRadius: '8px',
            padding: '8px 20px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.75 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#059669';
              e.currentTarget.style.borderColor = '#059669';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#10B981';
              e.currentTarget.style.borderColor = '#10B981';
            }
          }}
        >
          {isLoading ? (
            <span className="btn-loading-content">Saving tag...</span>
          ) : (
            <>
              <CheckCircleIcon size={16} />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
