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
    <form className="tag-form-card" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="tag-form-alert tag-form-alert-danger" role="alert">
          <AlertCircleIcon size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Inputs on Left, Real-Time Preview on Right */}
      <div className="tag-form-grid">
        <div className="tag-form-fields-col">
          {/* Tag Name Field */}
          <div className="form-group-custom">
            <div className="form-label-row">
              <label htmlFor="tag-name-input" className="form-label-custom">
                Tag Name <span className="req-star">*</span>
              </label>
              <span className={`char-counter ${name.length > 90 ? 'is-warning' : ''}`}>
                {name.length} / 100
              </span>
            </div>
            <div className="input-with-icon-wrap">
              <span className="input-field-icon">
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
              />
            </div>
            {validationErrors.name && (
              <span className="field-error-msg">{validationErrors.name}</span>
            )}
            <p className="field-hint-text">
              Names must be unique within your workspace. Use clear, standardized terms for your team.
            </p>
          </div>

          {/* Color Selector */}
          <div className="form-group-custom">
            <label className="form-label-custom">Tag Color</label>
            <div className="tag-color-palette-wrap">
              <div className="tag-color-swatches" role="radiogroup" aria-label="Preset colors">
                {PRESET_TAG_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    className={`tag-color-swatch-btn ${
                      color.toLowerCase() === preset.hex.toLowerCase() ? 'is-active' : ''
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    onClick={() => {
                      setColor(preset.hex);
                      if (validationErrors.color) {
                        setValidationErrors((prev) => ({ ...prev, color: '' }));
                      }
                    }}
                    title={`${preset.label} (${preset.hex})`}
                    aria-label={preset.label}
                  >
                    {color.toLowerCase() === preset.hex.toLowerCase() && (
                      <CheckCircleIcon size={14} className="swatch-check-icon" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Hex Picker Input */}
              <div className="tag-custom-color-row">
                <div className="custom-color-picker-input">
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
                  />
                  <label htmlFor="tag-native-color-picker" className="color-picker-label-trigger">
                    <span className="color-swatch-pip" style={{ backgroundColor: color }} />
                    <span>Custom Picker</span>
                  </label>
                </div>

                <div className="custom-hex-input-wrap">
                  <span className="hex-prefix">HEX</span>
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
                  />
                </div>
              </div>
            </div>
            {validationErrors.color && (
              <span className="field-error-msg">{validationErrors.color}</span>
            )}
          </div>

          {/* Description Field */}
          <div className="form-group-custom">
            <div className="form-label-row">
              <label htmlFor="tag-desc-input" className="form-label-custom">
                Description <span className="opt-label">(Optional)</span>
              </label>
              <span className="char-counter">{description.length} / 500</span>
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
            />
            {validationErrors.description && (
              <span className="field-error-msg">{validationErrors.description}</span>
            )}
          </div>

          {/* Status & Protection Grid */}
          <div className="tag-form-options-row">
            {/* Tag Status */}
            <div className="form-group-custom option-col">
              <label htmlFor="tag-status-select" className="form-label-custom">
                Status
              </label>
              <select
                id="tag-status-select"
                className="form-select-custom"
                value={status}
                onChange={(e) => setStatus(e.target.value as TagStatus)}
                disabled={isLoading}
              >
                <option value="ACTIVE">Active (Available for CRM entities)</option>
                <option value="INACTIVE">Inactive (Disabled from selection)</option>
                {isEdit && <option value="ARCHIVED">Archived (Read-only historical)</option>}
              </select>
            </div>

            {/* Protection Toggle */}
            <div className="form-group-custom option-col">
              <label className="form-label-custom">Workflow Protection</label>
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
              >
                <div className="protection-icon-wrap">
                  {isProtected ? <LockIcon size={18} /> : <ShieldIcon size={18} />}
                </div>
                <div className="protection-text-wrap">
                  <span className="protection-title">
                    {isProtected ? 'Protected Tag' : 'Standard Tag'}
                  </span>
                  <span className="protection-desc">
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
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="tag-form-preview-col">
          <div className="tag-preview-card">
            <h4 className="preview-heading">Live Tag Preview</h4>
            <p className="preview-subtitle">
              This shows how your tag badge and details appear across the CRM portal.
            </p>

            <div className="preview-stage">
              <div className="preview-badge-display">
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

              <div className="preview-variants-row">
                <div className="preview-variant-item">
                  <span className="variant-label">Small:</span>
                  <TagBadge
                    name={name.trim() || 'Sample Tag'}
                    color={color}
                    status={status}
                    isProtected={isProtected}
                    size="sm"
                  />
                </div>
                <div className="preview-variant-item">
                  <span className="variant-label">With Icon:</span>
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
              <div className="preview-simulation-box">
                <div className="sim-entity-header">
                  <span className="sim-entity-title">Acme Corp • Deal #4092</span>
                  <span className="sim-entity-price">$75,000</span>
                </div>
                <p className="sim-entity-desc">
                  Enterprise subscription renewed for FY2026. Stage: Contract Sent.
                </p>
                <div className="sim-entity-tags-list">
                  <TagBadge
                    name={name.trim() || 'Sample Tag'}
                    color={color}
                    status={status}
                    isProtected={isProtected}
                    size="sm"
                  />
                  <span className="sim-tag-ghost">+ Add Tag</span>
                </div>
              </div>
            </div>

            <div className="preview-footer-note">
              <span>Color Hex:</span> <code>{color}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="tag-form-actions-bar">
        <button
          type="button"
          className="auth-btn btn-ghost"
          onClick={() => navigate(cancelPath)}
          disabled={isLoading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="auth-btn btn-primary"
          disabled={isLoading}
          id="tag-form-submit-btn"
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
