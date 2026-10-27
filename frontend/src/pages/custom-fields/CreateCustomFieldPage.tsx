import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customFieldService } from '../../services/custom-field.service';
import { useWorkspace } from '../../context/useWorkspace';
import type {
  CustomFieldEntityType,
  CustomFieldType,
  CreateOptionItemPayload,
} from '../../types/custom-field.types';
import { Navbar } from '../../components/common/Navbar';
import { CustomFieldEntityBadge, CustomFieldTypeBadge } from './CustomFieldBadges';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  SlidersIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
} from './CustomFieldIcons';

const ENTITY_OPTIONS: Array<{ value: CustomFieldEntityType; label: string; description: string }> = [
  { value: 'LEAD', label: 'Lead', description: 'Prospective buyers and qualification pipelines' },
  { value: 'CONTACT', label: 'Contact', description: 'Individual customer profiles and stakeholders' },
  { value: 'COMPANY', label: 'Company', description: 'Organizations, accounts, and client firms' },
  { value: 'DEAL', label: 'Deal / Opportunity', description: 'Sales opportunities and revenue stages' },
  { value: 'ACTIVITY', label: 'Activity / Task', description: 'Logged calls, meetings, tasks, and notes' },
];

const FIELD_TYPES: Array<{
  value: CustomFieldType;
  label: string;
  category: string;
  description: string;
}> = [
  { value: 'TEXT', label: 'Single Line Text', category: 'Text', description: 'Short alphanumeric inputs' },
  { value: 'LONG_TEXT', label: 'Long Text / Textarea', category: 'Text', description: 'Multi-line notes and descriptions' },
  { value: 'NUMBER', label: 'Number', category: 'Numeric', description: 'Integers or decimal values' },
  { value: 'CURRENCY', label: 'Currency', category: 'Numeric', description: 'Monetary balances with symbol' },
  { value: 'PERCENTAGE', label: 'Percentage', category: 'Numeric', description: 'Rate or commission percentage' },
  { value: 'DATE', label: 'Date', category: 'Date & Time', description: 'Calendar date picker' },
  { value: 'DATETIME', label: 'Date & Time', category: 'Date & Time', description: 'Timestamp with time' },
  { value: 'CHECKBOX', label: 'Checkbox', category: 'Boolean', description: 'Yes / No binary toggle' },
  { value: 'DROPDOWN', label: 'Dropdown (Single)', category: 'Choice', description: 'Select one from defined options' },
  { value: 'MULTI_SELECT', label: 'Multi Select', category: 'Choice', description: 'Select multiple choices' },
  { value: 'RADIO', label: 'Radio Group', category: 'Choice', description: 'Mutually exclusive radio list' },
  { value: 'URL', label: 'Website / URL', category: 'Special', description: 'Valid web address links' },
  { value: 'EMAIL', label: 'Email Address', category: 'Special', description: 'Valid formatted email address' },
  { value: 'PHONE', label: 'Phone Number', category: 'Special', description: 'Telephone or mobile contact' },
  { value: 'USER_SELECTOR', label: 'Workspace User', category: 'Reference', description: 'Assign to a team member' },
];

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const CreateCustomFieldPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();

  // Core Schema attributes
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
  const [entityType, setEntityType] = useState<CustomFieldEntityType>('LEAD');
  const [fieldType, setFieldType] = useState<CustomFieldType>('TEXT');

  // Descriptive text
  const [description, setDescription] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [defaultValue, setDefaultValue] = useState('');

  // Layout & Form placement
  const [section, setSection] = useState('Additional Information');
  const [gridWidth, setGridWidth] = useState<number>(6);
  const [order, setOrder] = useState<number>(10);

  // Behavioral flags
  const [isRequired, setIsRequired] = useState(false);
  const [isUnique, setIsUnique] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isSearchable, setIsSearchable] = useState(true);
  const [isFilterable, setIsFilterable] = useState(true);
  const [isEditable, setIsEditable] = useState(true);

  // Options for choice fields
  const [options, setOptions] = useState<CreateOptionItemPayload[]>([
    { label: 'Option 1', value: 'option_1', color: '#3b82f6', isDefault: false },
    { label: 'Option 2', value: 'option_2', color: '#10b981', isDefault: false },
  ]);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const isChoiceField = ['DROPDOWN', 'MULTI_SELECT', 'RADIO'].includes(fieldType);

  // Auto-slugify name into key if not manually edited
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isKeyManuallyEdited) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      setKey(slug ? `cf_${slug}` : '');
    }
  };

  const handleAddOption = () => {
    const nextIdx = options.length + 1;
    const color = PRESET_COLORS[options.length % PRESET_COLORS.length];
    setOptions([
      ...options,
      {
        label: `Option ${nextIdx}`,
        value: `option_${nextIdx}`,
        color,
        isDefault: false,
      },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, field: keyof CreateOptionItemPayload, value: any) => {
    const next = [...options];
    next[index] = { ...next[index], [field]: value };

    // If changing label and value was default-ish, sync value
    if (field === 'label' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      next[index].value = slug;
    }

    // If setting default for single choice, uncheck other defaults
    if (field === 'isDefault' && value === true && fieldType !== 'MULTI_SELECT') {
      next.forEach((opt, idx) => {
        if (idx !== index) opt.isDefault = false;
      });
    }

    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    if (!name.trim()) {
      setApiError('Field label is required.');
      return;
    }

    if (isChoiceField) {
      if (options.length === 0) {
        setApiError('At least one option must be defined for choice fields.');
        return;
      }
      for (const opt of options) {
        if (!opt.label.trim() || !opt.value.trim()) {
          setApiError('All options must have both a label and a value.');
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        key: key.trim() || undefined,
        entityType,
        fieldType,
        description: description.trim() || undefined,
        placeholder: placeholder.trim() || undefined,
        helpText: helpText.trim() || undefined,
        defaultValue: defaultValue.trim() || undefined,
        section: section.trim() || 'General Information',
        gridWidth: Number(gridWidth),
        order: Number(order),
        isRequired,
        isUnique,
        isVisible,
        isSearchable,
        isFilterable,
        isEditable,
        workspaceId: currentWorkspace?.id,
        options: isChoiceField
          ? options.map((opt, idx) => ({
              label: opt.label.trim(),
              value: opt.value.trim(),
              color: opt.color || undefined,
              order: idx + 1,
              isDefault: Boolean(opt.isDefault),
            }))
          : undefined,
      };

      const created = await customFieldService.createCustomField(payload);
      setApiSuccess(`Custom field "${created.name}" created successfully!`);

      setTimeout(() => {
        navigate('/custom-fields');
      }, 1000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to create custom field');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Page Title */}
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
              <h1 className="workspace-page-title" style={{ margin: 0 }}>Create Custom Field</h1>
            </div>
            <p className="workspace-page-subtitle" style={{ margin: 0 }}>
              Define a new schema attribute, specify layout positioning, and setup validation rules.
            </p>
          </div>
        </div>

        {/* Notifications */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
            {/* Left 8 Columns: Main Configuration */}
            <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Step 1: Target Entity */}
              <div
                style={{
                  background: 'var(--bg-card, #0f172a)',
                  border: '1px solid var(--border-color, #1e293b)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                }}
              >
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 1rem 0' }}>
                  1. Target CRM Entity
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {ENTITY_OPTIONS.map((opt) => {
                    const isSelected = entityType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEntityType(opt.value)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '0.875rem',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color, #1e293b)',
                          background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(30, 41, 59, 0.3)',
                          color: '#f8fafc',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <CustomFieldEntityBadge entityType={opt.value} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}>{opt.label}</span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Field Details */}
              <div
                style={{
                  background: 'var(--bg-card, #0f172a)',
                  border: '1px solid var(--border-color, #1e293b)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                }}
              >
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 1rem 0' }}>
                  2. Field Definition & Attributes
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label
                      htmlFor="fieldNameInput"
                      style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Field Label <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="fieldNameInput"
                      type="text"
                      placeholder="e.g. Target Budget"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        background: 'var(--bg-main, #0b1120)',
                        border: '1px solid var(--border-color, #334155)',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="fieldKeyInput"
                      style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      API Key / Identifier
                    </label>
                    <input
                      id="fieldKeyInput"
                      type="text"
                      placeholder="cf_target_budget"
                      value={key}
                      onChange={(e) => {
                        setIsKeyManuallyEdited(true);
                        setKey(e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        background: 'var(--bg-main, #0b1120)',
                        border: '1px solid var(--border-color, #334155)',
                        color: '#94a3b8',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                {/* Field Type Selector */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    htmlFor="fieldTypeSelect"
                    style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                  >
                    Data Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="fieldTypeSelect"
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      background: 'var(--bg-main, #0b1120)',
                      border: '1px solid var(--border-color, #334155)',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                    }}
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft.value} value={ft.value}>
                        {ft.label} — ({ft.description})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description, Placeholder & Default Value */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label
                      htmlFor="placeholderInput"
                      style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Placeholder Text
                    </label>
                    <input
                      id="placeholderInput"
                      type="text"
                      placeholder="e.g. Enter budgeted amount..."
                      value={placeholder}
                      onChange={(e) => setPlaceholder(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        background: 'var(--bg-main, #0b1120)',
                        border: '1px solid var(--border-color, #334155)',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="helpTextInput"
                      style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Helper / Hint Text
                    </label>
                    <input
                      id="helpTextInput"
                      type="text"
                      placeholder="e.g. Stated annual budget in USD"
                      value={helpText}
                      onChange={(e) => setHelpText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        background: 'var(--bg-main, #0b1120)',
                        border: '1px solid var(--border-color, #334155)',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="defaultValueInput"
                      style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Default Value
                    </label>
                    <input
                      id="defaultValueInput"
                      type="text"
                      placeholder="e.g. Standard"
                      value={defaultValue}
                      onChange={(e) => setDefaultValue(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        background: 'var(--bg-main, #0b1120)',
                        border: '1px solid var(--border-color, #334155)',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="descriptionInput"
                    style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                  >
                    Internal Description / Documentation
                  </label>
                  <textarea
                    id="descriptionInput"
                    rows={2}
                    placeholder="Brief explanation for administrators on how this field should be utilized..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      background: 'var(--bg-main, #0b1120)',
                      border: '1px solid var(--border-color, #334155)',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              {/* Step 3: Options Builder (only for choice fields) */}
              {isChoiceField && (
                <div
                  style={{
                    background: 'var(--bg-card, #0f172a)',
                    border: '1px solid var(--border-color, #1e293b)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                        3. Choice Options List
                      </h2>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                        Define selectable values, color badges, and default selections
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddOption}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <PlusIcon size={14} />
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div className="options-builder-container">
                    {options.map((opt, idx) => (
                      <div key={idx} className="option-builder-row">
                        <span style={{ fontSize: '0.75rem', color: '#64748b', width: '20px' }}>
                          #{idx + 1}
                        </span>

                        {/* Color swatch picker */}
                        <input
                          type="color"
                          value={opt.color || '#3b82f6'}
                          onChange={(e) => handleOptionChange(idx, 'color', e.target.value)}
                          className="option-color-swatch-input"
                          title="Choose option color badge"
                        />

                        {/* Option Label */}
                        <input
                          type="text"
                          placeholder="Option Label"
                          value={opt.label}
                          onChange={(e) => handleOptionChange(idx, 'label', e.target.value)}
                          style={{
                            flex: 1,
                            minWidth: '130px',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            background: 'var(--bg-main, #0b1120)',
                            border: '1px solid var(--border-color, #334155)',
                            color: '#f8fafc',
                            fontSize: '0.85rem',
                          }}
                        />

                        {/* Option Value */}
                        <input
                          type="text"
                          placeholder="value_key"
                          value={opt.value}
                          onChange={(e) => handleOptionChange(idx, 'value', e.target.value)}
                          style={{
                            width: '130px',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            background: 'var(--bg-main, #0b1120)',
                            border: '1px solid var(--border-color, #334155)',
                            color: '#94a3b8',
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                          }}
                        />

                        {/* Default check */}
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.775rem',
                            color: '#cbd5e1',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(opt.isDefault)}
                            onChange={(e) => handleOptionChange(idx, 'isDefault', e.target.checked)}
                            style={{ accentColor: '#3b82f6' }}
                          />
                          <span>Default</span>
                        </label>

                        {/* Delete option */}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          disabled={options.length <= 1}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: options.length <= 1 ? '#475569' : '#f87171',
                            cursor: options.length <= 1 ? 'not-allowed' : 'pointer',
                            padding: '0.35rem',
                          }}
                          title="Remove option"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Columns: Layout, Section, and Behavioral Flags */}
            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Form Layout Card */}
              <div
                style={{
                  background: 'var(--bg-card, #0f172a)',
                  border: '1px solid var(--border-color, #1e293b)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 1rem 0' }}>
                  Form Layout & Section
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="sectionNameInput"
                    style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1', marginBottom: '0.35rem' }}
                  >
                    Form Section Name
                  </label>
                  <input
                    id="sectionNameInput"
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="General Information"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: 'var(--bg-main, #0b1120)',
                      border: '1px solid var(--border-color, #334155)',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="gridWidthSelect"
                    style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1', marginBottom: '0.35rem' }}
                  >
                    Field Grid Column Width
                  </label>
                  <select
                    id="gridWidthSelect"
                    value={gridWidth}
                    onChange={(e) => setGridWidth(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: 'var(--bg-main, #0b1120)',
                      border: '1px solid var(--border-color, #334155)',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value={6}>Half Width (6 of 12 cols)</option>
                    <option value={12}>Full Width (12 of 12 cols)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="orderInput"
                    style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1', marginBottom: '0.35rem' }}
                  >
                    Sort Order Priority
                  </label>
                  <input
                    id="orderInput"
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: 'var(--bg-main, #0b1120)',
                      border: '1px solid var(--border-color, #334155)',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* Behavior Flags Card */}
              <div
                style={{
                  background: 'var(--bg-card, #0f172a)',
                  border: '1px solid var(--border-color, #1e293b)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 1rem 0' }}>
                  Behavior & Rules
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                      style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#f8fafc' }}>Required Field</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Must have a value when saving record</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isUnique}
                      onChange={(e) => setIsUnique(e.target.checked)}
                      style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#f8fafc' }}>Unique Value</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Enforce uniqueness across entity entries</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => setIsVisible(e.target.checked)}
                      style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#f8fafc' }}>Visible in UI</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Show in form views and tables</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isSearchable}
                      onChange={(e) => setIsSearchable(e.target.checked)}
                      style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#f8fafc' }}>Searchable</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Indexed for full-text search</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isFilterable}
                      onChange={(e) => setIsFilterable(e.target.checked)}
                      style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#f8fafc' }}>Filterable</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Available in filter dropdowns</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isEditable}
                      onChange={(e) => setIsEditable(e.target.checked)}
                      style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#f8fafc' }}>Editable</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Allow users to modify value</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Live Preview Card */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px dashed var(--border-color, #1e293b)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Live Field Preview
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <CustomFieldEntityBadge entityType={entityType} />
                  <CustomFieldTypeBadge type={fieldType} />
                </div>
                <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                  {name || 'Untitled Field'}
                  {isRequired && <span style={{ color: '#ef4444', marginLeft: '0.2rem' }}>*</span>}
                </div>
                {helpText && (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    {helpText}
                  </div>
                )}
                <div style={{ marginTop: '0.75rem' }}>
                  <input
                    type="text"
                    disabled
                    placeholder={placeholder || 'Sample input value...'}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '6px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-color, #334155)',
                      color: '#64748b',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link
                  to="/custom-fields"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #334155)',
                    background: 'transparent',
                    color: '#cbd5e1',
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    flex: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingIndicator size="small" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon size={16} />
                      <span>Create Field</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
