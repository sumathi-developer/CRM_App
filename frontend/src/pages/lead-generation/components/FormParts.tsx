import React from 'react';
import { XIcon, AlertCircleIcon } from '../../../components/common/Icons';
import { PrimaryButton } from '../../../components/auth/PrimaryButton';

/* ---------- Field wrappers ---------- */

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, htmlFor, required, error, hint, children, className = '' }) => (
  <div className={`lg-field ${error ? 'has-error' : ''} ${className}`}>
    <label className="lg-label" htmlFor={htmlFor}>
      {label}
      {required && <span className="lg-required">*</span>}
    </label>
    {children}
    {error ? (
      <span className="lg-field-error" role="alert">
        {error}
      </span>
    ) : (
      hint && <span className="lg-field-hint">{hint}</span>
    )}
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description, disabled, id }) => (
  <label className={`lg-toggle ${checked ? 'is-on' : ''} ${disabled ? 'is-disabled' : ''}`} htmlFor={id}>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="lg-toggle-switch" aria-hidden="true" />
    <span className="lg-toggle-text">
      <span className="lg-toggle-label">{label}</span>
      {description && <span className="lg-toggle-desc">{description}</span>}
    </span>
  </label>
);

/* ---------- Modal ---------- */

interface FormModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: () => void;
  isSaving?: boolean;
  submitLabel?: string;
  error?: string | null;
  wide?: boolean;
  children: React.ReactNode;
}

/** Modal wrapper for the rule / configuration forms. Reuses the app-wide modal styles. */
export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  title,
  subtitle,
  onClose,
  onSubmit,
  isSaving = false,
  submitLabel = 'Save',
  error,
  wide = false,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lg-modal-title">
      <div className={`modal-container ${wide ? 'modal-wide' : ''} lg-modal`}>
        <div className="modal-header">
          <div className="modal-header-text">
            <h3 id="lg-modal-title" className="modal-title">
              {title}
            </h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSaving} aria-label="Close">
            <XIcon size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          noValidate
        >
          <div className="modal-body lg-modal-body">
            {error && (
              <div className="lg-inline-alert" role="alert">
                <AlertCircleIcon size={16} />
                <span>{error}</span>
              </div>
            )}
            {children}
          </div>

          <div className="modal-footer">
            <button type="button" className="auth-btn btn-ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <PrimaryButton type="submit" fullWidth={false} isLoading={isSaving} loadingText="Saving...">
              {submitLabel}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- Condition builder (shared by Qualification & Assignment rules) ---------- */

export interface ConditionRow {
  field: string;
  operator: string;
  value: string;
}

interface ConditionBuilderProps {
  conditions: ConditionRow[];
  onChange: (rows: ConditionRow[]) => void;
  fieldOptions: Array<{ value: string; label: string }>;
  operatorOptions: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  onChange,
  fieldOptions,
  operatorOptions,
  disabled,
}) => {
  const update = (index: number, patch: Partial<ConditionRow>) =>
    onChange(conditions.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  return (
    <div className="lg-conditions">
      {conditions.length === 0 && <p className="lg-field-hint">No conditions — this rule applies to every lead.</p>}

      {conditions.map((row, index) => (
        <div key={index} className="lg-condition-row">
          <select
            className="lg-select"
            value={row.field}
            onChange={(e) => update(index, { field: e.target.value })}
            disabled={disabled}
            aria-label="Condition field"
          >
            {fieldOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            className="lg-select"
            value={row.operator}
            onChange={(e) => update(index, { operator: e.target.value })}
            disabled={disabled}
            aria-label="Condition operator"
          >
            {operatorOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            className="lg-input"
            value={row.operator === 'NOT_EMPTY' ? '' : row.value}
            onChange={(e) => update(index, { value: e.target.value })}
            placeholder={row.operator === 'NOT_EMPTY' ? 'No value needed' : 'Value'}
            disabled={disabled || row.operator === 'NOT_EMPTY'}
            aria-label="Condition value"
          />
          <button
            type="button"
            className="lg-icon-btn danger"
            onClick={() => onChange(conditions.filter((_, i) => i !== index))}
            disabled={disabled}
            aria-label="Remove condition"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        className="lg-link-btn"
        onClick={() =>
          onChange([
            ...conditions,
            { field: fieldOptions[0]?.value || '', operator: operatorOptions[0]?.value || 'EQUALS', value: '' },
          ])
        }
        disabled={disabled}
      >
        + Add condition
      </button>
    </div>
  );
};
