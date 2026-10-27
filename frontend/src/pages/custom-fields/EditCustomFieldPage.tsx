import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customFieldService } from '../../services/custom-field.service';
import type {
  CustomFieldEntity,
  CreateOptionItemPayload,
} from '../../types/custom-field.types';
import { Navbar } from '../../components/common/Navbar';
import {
  CustomFieldEntityBadge,
  CustomFieldTypeBadge,
} from './CustomFieldBadges';
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

const PRESET_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#64748b',
];

export const EditCustomFieldPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [field, setField] = useState<CustomFieldEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [defaultValue, setDefaultValue] = useState('');

  // Layout & section
  const [section, setSection] = useState('General Information');
  const [gridWidth, setGridWidth] = useState<number>(6);
  const [order, setOrder] = useState<number>(10);

  // Behavioral flags
  const [isRequired, setIsRequired] = useState(false);
  const [isUnique, setIsUnique] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isSearchable, setIsSearchable] = useState(true);
  const [isFilterable, setIsFilterable] = useState(true);
  const [isEditable, setIsEditable] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Options
  const [options, setOptions] = useState<CreateOptionItemPayload[]>([]);

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const isChoiceField =
    field && ['DROPDOWN', 'MULTI_SELECT', 'RADIO'].includes(field.fieldType);

  useEffect(() => {
    let ignore = false;

    const loadField = async () => {
      if (!id) return;
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await customFieldService.getCustomFieldById(id);
        if (!ignore && data) {
          setField(data);
          setName(data.name || '');
          setDescription(data.description || '');
          setPlaceholder(data.placeholder || '');
          setHelpText(data.helpText || '');
          setDefaultValue(data.defaultValue ? String(data.defaultValue) : '');
          setSection(data.section || 'General Information');
          setGridWidth(data.gridWidth || 6);
          setOrder(data.order || 10);
          setIsRequired(Boolean(data.isRequired));
          setIsUnique(Boolean(data.isUnique));
          setIsVisible(data.isVisible !== false);
          setIsSearchable(data.isSearchable !== false);
          setIsFilterable(data.isFilterable !== false);
          setIsEditable(data.isEditable !== false);
          setIsActive(data.isActive !== false);

          if (data.options && data.options.length > 0) {
            setOptions(
              data.options.map((opt) => ({
                label: opt.label,
                value: opt.value,
                color: opt.color || '#3b82f6',
                order: opt.order,
                isDefault: opt.isDefault,
              })),
            );
          }
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load custom field');
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
  }, [id]);

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

  const handleOptionChange = (index: number, optField: keyof CreateOptionItemPayload, value: any) => {
    const next = [...options];
    next[index] = { ...next[index], [optField]: value };

    if (optField === 'label' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      next[index].value = slug;
    }

    if (optField === 'isDefault' && value === true && field?.fieldType !== 'MULTI_SELECT') {
      next.forEach((opt, idx) => {
        if (idx !== index) opt.isDefault = false;
      });
    }

    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !field) return;

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
        isActive,
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

      await customFieldService.updateCustomField(id, payload);
      setApiSuccess('Custom field updated successfully!');

      setTimeout(() => {
        navigate(`/custom-fields/${id}`);
      }, 900);
    } catch (err: any) {
      setApiError(err.message || 'Failed to update custom field');
    } finally {
      setIsSubmitting(false);
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
            <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Loading field settings...</p>
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
            to={`/custom-fields/${field.id}`}
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
            <span>Back to Field Details</span>
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
              <h1 className="workspace-page-title" style={{ margin: 0 }}>Edit Custom Field: {field.name}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <CustomFieldEntityBadge entityType={field.entityType} />
              <CustomFieldTypeBadge type={field.fieldType} />
              <code style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{field.key}</code>
            </div>
          </div>
        </div>

        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
            {/* Left 8 Cols: Edit attributes */}
            <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Field Attributes */}
              <div
                style={{
                  background: 'var(--bg-card, #0f172a)',
                  border: '1px solid var(--border-color, #1e293b)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                }}
              >
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 1rem 0' }}>
                  Field Definition
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label
                      htmlFor="editFieldName"
                      style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Field Label <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="editFieldName"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      htmlFor="readOnlyKey"
                      style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#94a3b8', marginBottom: '0.35rem' }}
                    >
                      API Key (Immutable)
                    </label>
                    <input
                      id="readOnlyKey"
                      type="text"
                      disabled
                      value={field.key}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid var(--border-color, #1e293b)',
                        color: '#64748b',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                {/* Field Type Notice */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid var(--border-color, #1e293b)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.825rem', color: '#94a3b8' }}>Field Type:</span>
                    <CustomFieldTypeBadge type={field.fieldType} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Use "Migrate Type" to safely change data types
                  </span>
                </div>

                {/* Placeholder & Helper Text */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label
                      htmlFor="editPlaceholder"
                      style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Placeholder Text
                    </label>
                    <input
                      id="editPlaceholder"
                      type="text"
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
                      htmlFor="editHelpText"
                      style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                    >
                      Helper / Hint Text
                    </label>
                    <input
                      id="editHelpText"
                      type="text"
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
                </div>

                <div>
                  <label
                    htmlFor="editDescription"
                    style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}
                  >
                    Internal Description / Documentation
                  </label>
                  <textarea
                    id="editDescription"
                    rows={2}
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

              {/* Options Editor (if choice field) */}
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
                        Choice Options
                      </h2>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                        Modify labels, color tags, and default state
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

                        <input
                          type="color"
                          value={opt.color || '#3b82f6'}
                          onChange={(e) => handleOptionChange(idx, 'color', e.target.value)}
                          className="option-color-swatch-input"
                          title="Choose option color badge"
                        />

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

            {/* Right 4 Cols: Layout & Rules */}
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
                  Form Layout Settings
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="editSectionName"
                    style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1', marginBottom: '0.35rem' }}
                  >
                    Form Section Name
                  </label>
                  <input
                    id="editSectionName"
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
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
                    htmlFor="editGridWidth"
                    style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1', marginBottom: '0.35rem' }}
                  >
                    Field Grid Column Width
                  </label>
                  <select
                    id="editGridWidth"
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
                    htmlFor="editOrder"
                    style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1', marginBottom: '0.35rem' }}
                  >
                    Sort Order Priority
                  </label>
                  <input
                    id="editOrder"
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

              {/* Behavior & Rules Card */}
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
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Enforce uniqueness across entity records</div>
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

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#f8fafc' }}>Active Field Status</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Enabled in forms & layouts</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link
                  to={`/custom-fields/${field.id}`}
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
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon size={16} />
                      <span>Save Changes</span>
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
