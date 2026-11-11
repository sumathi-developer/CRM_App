import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import type {
  FormField,
  FormSettings,
  FormStyling,
  FormType,
  FormStatus,
  WebFormPayload,
  LeadSource,
} from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { Field, Toggle } from './components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { useAsyncData, useLeadGenAccess, useUserOptions } from './leadGenHooks';
import {
  FORM_TYPE_OPTIONS,
  FORM_STATUS_OPTIONS,
  FIELD_TYPE_OPTIONS,
  DUPLICATE_HANDLING_OPTIONS,
  HEX_REGEX,
  EMAIL_REGEX,
} from './leadGenConstants';
import {
  SlidersIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  SparklesIcon,
} from '../../components/common/Icons';

const DEFAULT_FIELDS: FormField[] = [
  { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Jane' },
  { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Doe' },
  { name: 'email', label: 'Work Email', type: 'email', required: true, placeholder: 'jane@company.com' },
  { name: 'companyName', label: 'Company', type: 'text', required: false, placeholder: 'Acme Corp' },
  { name: 'phone', label: 'Phone Number', type: 'phone', required: false, placeholder: '+1 555-0100' },
];

export const FormBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workspaceId, canManage } = useLeadGenAccess();
  const { users } = useUserOptions();
  const isEdit = Boolean(id);

  // Form base state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formType, setFormType] = useState<FormType>('WEB_FORM');
  const [status, setStatus] = useState<FormStatus>('DRAFT');
  const [defaultSourceId, setDefaultSourceId] = useState('');
  const [defaultOwnerId, setDefaultOwnerId] = useState('');
  const [campaignName, setCampaignName] = useState('');

  // Fields state
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);

  // Styling state - using brand-matching tones (#10B981 Emerald & #062E03 Forest)
  const [primaryColor, setPrimaryColor] = useState('#10B981');
  const [backgroundColor, setBackgroundColor] = useState('#062E03');
  const [borderRadius, setBorderRadius] = useState('8px');
  const [buttonText, setButtonText] = useState('Submit');
  const [darkMode, setDarkMode] = useState(false);

  // Settings state
  const [successMessage, setSuccessMessage] = useState('Thank you! Your information has been received.');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [notifyEmails, setNotifyEmails] = useState('');
  const [emailNotification, setEmailNotification] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState<'UPDATE' | 'MERGE' | 'ALLOW' | 'REJECT'>('UPDATE');
  const [autoScore, setAutoScore] = useState(true);
  const [autoQualify, setAutoQualify] = useState(true);
  const [autoRoute, setAutoRoute] = useState(true);

  // Sources list for default source picker
  const [sources, setSources] = useState<LeadSource[]>([]);
  useEffect(() => {
    let ignore = false;
    leadGenerationService.getSources({ limit: 100, workspaceId }).then((res) => {
      if (!ignore) setSources(res.data);
    }).catch(() => {});
    return () => { ignore = true; };
  }, [workspaceId]);

  // Loader for edit mode
  const loader = useCallback(async () => {
    if (!id) return null;
    return leadGenerationService.getFormById(id);
  }, [id]);

  const { data: existingForm, isLoading, error: loadError, clearError } = useAsyncData(loader);

  // Sync loaded form
  useEffect(() => {
    if (existingForm) {
      setName(existingForm.name);
      setSlug(existingForm.slug || '');
      setTitle(existingForm.title);
      setDescription(existingForm.description || '');
      setFormType(existingForm.formType);
      setStatus(existingForm.status);
      setDefaultSourceId(existingForm.defaultSourceId || '');
      setDefaultOwnerId(existingForm.defaultOwnerId || '');
      setCampaignName(existingForm.campaignName || '');

      if (existingForm.fields && existingForm.fields.length > 0) {
        setFields(existingForm.fields);
      }
      if (existingForm.styling) {
        if (existingForm.styling.primaryColor) {
          setPrimaryColor(
            existingForm.styling.primaryColor === '#2563eb'
              ? '#10B981'
              : existingForm.styling.primaryColor,
          );
        }
        if (existingForm.styling.backgroundColor) {
          setBackgroundColor(
            existingForm.styling.backgroundColor === '#0f172a'
              ? '#062E03'
              : existingForm.styling.backgroundColor,
          );
        }
        if (existingForm.styling.borderRadius) setBorderRadius(existingForm.styling.borderRadius);
        if (existingForm.styling.buttonText) setButtonText(existingForm.styling.buttonText);
        setDarkMode(existingForm.styling.darkMode ?? false);
      }
      if (existingForm.settings) {
        if (existingForm.settings.successMessage) setSuccessMessage(existingForm.settings.successMessage);
        if (existingForm.settings.redirectUrl) setRedirectUrl(existingForm.settings.redirectUrl);
        if (existingForm.settings.notifyEmails) setNotifyEmails(existingForm.settings.notifyEmails.join(', '));
        setEmailNotification(Boolean(existingForm.settings.emailNotification));
        if (existingForm.settings.duplicateHandling) setDuplicateHandling(existingForm.settings.duplicateHandling);
        setAutoScore(existingForm.settings.autoScore ?? true);
        setAutoQualify(existingForm.settings.autoQualify ?? true);
        setAutoRoute(existingForm.settings.autoRoute ?? true);
      }
    }
  }, [existingForm]);

  // Validation & Saving
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const addField = () => {
    const nextIdx = fields.length + 1;
    setFields([
      ...fields,
      {
        name: `custom_field_${nextIdx}`,
        label: `Custom Field ${nextIdx}`,
        type: 'text',
        required: false,
        placeholder: '',
      },
    ]);
  };

  const updateField = (index: number, patch: Partial<FormField>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Form name is required.';
    if (!title.trim()) errs.title = 'Form title is required.';
    if (fields.length === 0) errs.fields = 'At least one field is required.';
    
    // Check for email field
    const hasEmail = fields.some((f) => f.type === 'email');
    if (!hasEmail) errs.fields = 'A field with type "email" is required for lead creation.';

    // Check duplicate field names
    const names = new Set<string>();
    for (const f of fields) {
      if (!f.name.trim()) {
        errs.fields = 'All fields must have an identifier name.';
        break;
      }
      if (names.has(f.name.trim().toLowerCase())) {
        errs.fields = `Duplicate field identifier: "${f.name}". Field identifiers must be unique.`;
        break;
      }
      names.add(f.name.trim().toLowerCase());
    }

    if (primaryColor && !HEX_REGEX.test(primaryColor)) {
      errs.primaryColor = 'Invalid hex color (e.g. #10B981).';
    }

    if (notifyEmails.trim()) {
      const emailList = notifyEmails.split(',').map((e) => e.trim()).filter(Boolean);
      for (const em of emailList) {
        if (!EMAIL_REGEX.test(em)) {
          errs.notifyEmails = `Invalid notification email: ${em}`;
          break;
        }
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setSaveError(null);

    const styling: FormStyling = {
      primaryColor,
      backgroundColor,
      borderRadius,
      buttonText: buttonText.trim() || 'Submit',
      darkMode,
    };

    const settings: FormSettings = {
      successMessage: successMessage.trim() || 'Thank you! Your information has been received.',
      redirectUrl: redirectUrl.trim() || undefined,
      notifyEmails: notifyEmails.trim()
        ? notifyEmails.split(',').map((e) => e.trim()).filter(Boolean)
        : undefined,
      emailNotification,
      duplicateHandling,
      autoScore,
      autoQualify,
      autoRoute,
    };

    const payload: WebFormPayload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      formType,
      status,
      fields,
      styling,
      settings,
      defaultSourceId: defaultSourceId || undefined,
      defaultOwnerId: defaultOwnerId || undefined,
      campaignName: campaignName.trim() || undefined,
      workspaceId,
    };

    try {
      if (id) {
        await leadGenerationService.updateForm(id, payload);
        navigate('/lead-generation/forms', { state: { flash: 'Web form updated successfully.' } });
      } else {
        await leadGenerationService.createForm(payload);
        navigate('/lead-generation/forms', { state: { flash: 'Web form created successfully.' } });
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save web form.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManage) {
    return (
      <LeadGenLayout title="Form Builder" icon={<SlidersIcon size={22} />}>
        <div className="lg-card lg-state-box">
          <EmptyState title="Permission Required" description="Only workspace admins and owners can build or edit forms." />
        </div>
      </LeadGenLayout>
    );
  }

  if (isEdit && isLoading) {
    return (
      <LeadGenLayout title="Form Builder" icon={<SlidersIcon size={22} />}>
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="medium" message="Loading form configuration..." />
        </div>
      </LeadGenLayout>
    );
  }

  return (
    <LeadGenLayout
      title={isEdit ? `Edit Form: ${name || 'Web Form'}` : 'New Lead Capture Form'}
      subtitle="Design forms, configure fields, adjust styling, and set up automated routing & scoring."
      icon={<SlidersIcon size={22} />}
      error={saveError || loadError}
      onDismissError={() => {
        setSaveError(null);
        clearError();
      }}
      actions={
        <Link to="/lead-generation/forms" className="auth-btn btn-ghost">
          <ArrowLeftIcon size={16} />
          <span>Back to Forms</span>
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="lg-grid-2">
          {/* Left Column: Form Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 1. Basic Info */}
            <div className="lg-card lg-section-card">
              <h2 className="lg-section-title">General Information</h2>
              <div className="lg-form-grid">
                <Field label="Form Name" htmlFor="lg-fb-name" required error={formErrors.name}>
                  <input
                    id="lg-fb-name"
                    className="lg-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Website Demo Request"
                  />
                </Field>

                <Field label="URL Slug" htmlFor="lg-fb-slug">
                  <input
                    id="lg-fb-slug"
                    className="lg-input"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                    placeholder="demo-request (auto-generated if empty)"
                  />
                </Field>

                <Field label="Display Title (Header)" htmlFor="lg-fb-title" required error={formErrors.title}>
                  <input
                    id="lg-fb-title"
                    className="lg-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Request a Product Demo"
                  />
                </Field>

                <Field label="Form Type" htmlFor="lg-fb-type">
                  <select
                    id="lg-fb-type"
                    className="lg-select"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as FormType)}
                  >
                    {FORM_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Status" htmlFor="lg-fb-status">
                  <select
                    id="lg-fb-status"
                    className="lg-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as FormStatus)}
                  >
                    {FORM_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Default Lead Source" htmlFor="lg-fb-source">
                  <select
                    id="lg-fb-source"
                    className="lg-select"
                    value={defaultSourceId}
                    onChange={(e) => setDefaultSourceId(e.target.value)}
                  >
                    <option value="">None (Auto-detect from channel)</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                    ))}
                  </select>
                </Field>

                <Field label="Default Assigned Owner" htmlFor="lg-fb-owner">
                  <select
                    id="lg-fb-owner"
                    className="lg-select"
                    value={defaultOwnerId}
                    onChange={(e) => setDefaultOwnerId(e.target.value)}
                  >
                    <option value="">None (Apply routing rules)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </Field>

                <Field label="Campaign Attribution" htmlFor="lg-fb-campaign">
                  <input
                    id="lg-fb-campaign"
                    className="lg-input"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Q3_Growth_Campaign"
                  />
                </Field>

                <Field label="Description / Subtitle" htmlFor="lg-fb-desc" className="lg-span-2">
                  <textarea
                    id="lg-fb-desc"
                    className="lg-textarea"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell visitors what they will get by submitting this form..."
                  />
                </Field>
              </div>
            </div>

            {/* 2. Field Builder */}
            <div className="lg-card lg-section-card">
              <div className="lg-section-head">
                <div>
                  <h2 className="lg-section-title">Form Fields ({fields.length})</h2>
                  <p className="lg-section-subtitle">Configure the inputs your prospects need to fill out.</p>
                </div>
                <button
                  type="button"
                  className="auth-btn btn-ghost"
                  onClick={addField}
                  id="lg-fb-add-field-btn"
                >
                  <PlusIcon size={14} />
                  <span>Add Field</span>
                </button>
              </div>

              {formErrors.fields && (
                <div className="lg-inline-alert" role="alert">
                  {formErrors.fields}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {fields.map((f, idx) => (
                  <div
                    key={idx}
                    className="lg-card lg-field-builder-row"
                    style={{
                      borderLeft: '3px solid #10B981',
                      border: '1px solid rgba(16, 185, 129, 0.22)',
                      borderLeftWidth: '3px',
                      borderLeftColor: '#10B981',
                      boxShadow: '0 2px 8px rgba(6, 46, 3, 0.04)',
                    }}
                  >
                    <div className="lg-grid-2">
                      <Field label="Field Identifier (Code)" required>
                        <input
                          className="lg-input"
                          value={f.name}
                          onChange={(e) => updateField(idx, { name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                          placeholder="fieldName"
                        />
                      </Field>
                      <Field label="Field Label" required>
                        <input
                          className="lg-input"
                          value={f.label}
                          onChange={(e) => updateField(idx, { label: e.target.value })}
                          placeholder="e.g. Work Email"
                        />
                      </Field>
                      <Field label="Field Type">
                        <select
                          className="lg-select"
                          value={f.type}
                          onChange={(e) => updateField(idx, { type: e.target.value as any })}
                        >
                          {FIELD_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Placeholder">
                        <input
                          className="lg-input"
                          value={f.placeholder || ''}
                          onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                          placeholder="Placeholder text"
                        />
                      </Field>
                    </div>

                    {f.type === 'select' && (
                      <Field label="Options (comma separated)" hint="e.g. Small (1-10), Medium (11-50), Large (50+)">
                        <input
                          className="lg-input"
                          value={f.options?.join(', ') || ''}
                          onChange={(e) =>
                            updateField(idx, {
                              options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </Field>
                    )}

                    <div className="lg-field-builder-actions">
                      <Toggle
                        label="Required field"
                        checked={Boolean(f.required)}
                        onChange={(chk) => updateField(idx, { required: chk })}
                        id={`lg-field-req-${idx}`}
                      />
                      <button
                        type="button"
                        className="lg-icon-btn danger"
                        onClick={() => removeField(idx)}
                        title="Remove field"
                        aria-label={`Remove field ${f.label}`}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Automation & Settings */}
            <div className="lg-card lg-section-card">
              <h2 className="lg-section-title">Submission Settings & Automations</h2>
              <div className="lg-form-grid">
                <Field label="Success Message" className="lg-span-2">
                  <input
                    className="lg-input"
                    value={successMessage}
                    onChange={(e) => setSuccessMessage(e.target.value)}
                    placeholder="Thank you! We will get in touch soon."
                  />
                </Field>

                <Field label="Redirect URL (Optional)" className="lg-span-2" hint="Redirect prospect to a thank-you page after submission">
                  <input
                    className="lg-input"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    placeholder="https://example.com/thank-you"
                  />
                </Field>

                <Field label="Duplicate Handling" htmlFor="lg-fb-dup">
                  <select
                    id="lg-fb-dup"
                    className="lg-select"
                    value={duplicateHandling}
                    onChange={(e) => setDuplicateHandling(e.target.value as any)}
                  >
                    {DUPLICATE_HANDLING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Internal Alert Emails" hint="Comma-separated emails to notify" error={formErrors.notifyEmails}>
                  <input
                    className="lg-input"
                    value={notifyEmails}
                    onChange={(e) => setNotifyEmails(e.target.value)}
                    placeholder="sales@company.com, team@company.com"
                  />
                </Field>
              </div>

              <div className="lg-cell-stack" style={{ marginTop: '1rem' }}>
                <Toggle
                  label="Send Email Notifications"
                  description="Email alert to the designated team on every lead captured."
                  checked={emailNotification}
                  onChange={setEmailNotification}
                  id="lg-fb-notify"
                />
                <Toggle
                  label="Automated Lead Scoring"
                  description="Apply workspace scoring rules immediately upon lead capture."
                  checked={autoScore}
                  onChange={setAutoScore}
                  id="lg-fb-autoscore"
                />
                <Toggle
                  label="Automated Lead Qualification"
                  description="Evaluate qualification rules and update lead status."
                  checked={autoQualify}
                  onChange={setAutoQualify}
                  id="lg-fb-autoqualify"
                />
                <Toggle
                  label="Automated Lead Routing"
                  description="Route captured lead to appropriate sales reps according to assignment rules."
                  checked={autoRoute}
                  onChange={setAutoRoute}
                  id="lg-fb-autoroute"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Styling & Live Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Styling Config */}
            <div className="lg-card lg-section-card">
              <h2 className="lg-section-title">Form Appearance</h2>
              <div className="lg-form-grid">
                <Field label="Button Accent Color" error={formErrors.primaryColor}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{
                        width: '44px',
                        height: '42px',
                        padding: '2px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      className="lg-input"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#10B981"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Palette:</span>
                    {[
                      { color: '#10B981', label: 'Emerald Green (Brand)' },
                      { color: '#062E03', label: 'Forest Obsidian' },
                      { color: '#059669', label: 'Vibrant Green' },
                      { color: '#0D9488', label: 'Teal Mint' },
                      { color: '#1E293B', label: 'Dark Slate' },
                    ].map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        title={preset.label}
                        onClick={() => setPrimaryColor(preset.color)}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: preset.color,
                          border:
                            primaryColor.toLowerCase() === preset.color.toLowerCase()
                              ? '2px solid #FFFFFF'
                              : '1px solid rgba(0,0,0,0.15)',
                          boxShadow:
                            primaryColor.toLowerCase() === preset.color.toLowerCase()
                              ? '0 0 0 2px #10B981'
                              : 'none',
                          cursor: 'pointer',
                          padding: 0,
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Button Text">
                  <input
                    className="lg-input"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Submit"
                  />
                </Field>

                <Field label="Corner Radius">
                  <select
                    className="lg-select"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.value)}
                  >
                    <option value="0px">Square (0px)</option>
                    <option value="4px">Slight (4px)</option>
                    <option value="8px">Rounded (8px)</option>
                    <option value="16px">Pill / Soft (16px)</option>
                  </select>
                </Field>

                <Field label="Container Theme">
                  <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                    <Toggle
                      label="Dark Theme Container"
                      checked={darkMode}
                      onChange={setDarkMode}
                      id="lg-fb-darkmode"
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Live Interactive Preview */}
            <div className="lg-card lg-section-card">
              <div className="lg-section-head">
                <div>
                  <h2 className="lg-section-title">
                    <EyeIcon size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Live Preview
                  </h2>
                  <p className="lg-section-subtitle">Real-time preview of how your capture form will look to visitors.</p>
                </div>
              </div>

              <div
                className="lg-preview-container"
                style={{
                  backgroundColor: darkMode ? (backgroundColor === '#0f172a' ? '#062E03' : backgroundColor) : '#FFFFFF',
                  color: darkMode ? '#EAF4ED' : '#062E03',
                  padding: '24px',
                  borderRadius: borderRadius,
                  border: darkMode ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.22)',
                  boxShadow: darkMode
                    ? '0 10px 25px rgba(6, 46, 3, 0.25)'
                    : '0 4px 16px rgba(6, 46, 3, 0.05)',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem', color: darkMode ? '#FFFFFF' : '#062E03' }}>
                  {title || 'Form Title'}
                </h3>
                {description && (
                  <p style={{ fontSize: '0.875rem', opacity: 0.85, marginBottom: '1.25rem', color: darkMode ? '#EAF4ED' : '#475569' }}>
                    {description}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {fields.map((f, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: darkMode ? '#EAF4ED' : '#1E293B' }}>
                        {f.label || f.name} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      {f.type === 'textarea' ? (
                        <textarea
                          placeholder={f.placeholder}
                          rows={2}
                          className="lg-input"
                          style={{
                            borderRadius,
                            resize: 'none',
                            backgroundColor: darkMode ? '#0B2414' : '#FFFFFF',
                            borderColor: darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                            color: darkMode ? '#FFFFFF' : '#1E293B',
                          }}
                          disabled
                        />
                      ) : f.type === 'select' ? (
                        <select
                          className="lg-select"
                          style={{
                            borderRadius,
                            backgroundColor: darkMode ? '#0B2414' : '#FFFFFF',
                            borderColor: darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                            color: darkMode ? '#FFFFFF' : '#1E293B',
                          }}
                          disabled
                        >
                          <option>Select an option...</option>
                          {f.options?.map((opt, oi) => (
                            <option key={oi}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          placeholder={f.placeholder}
                          className="lg-input"
                          style={{
                            borderRadius,
                            backgroundColor: darkMode ? '#0B2414' : '#FFFFFF',
                            borderColor: darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                            color: darkMode ? '#FFFFFF' : '#1E293B',
                          }}
                          disabled
                        />
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    style={{
                      marginTop: '0.5rem',
                      backgroundColor: primaryColor,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: borderRadius,
                      padding: '0.65rem 1.25rem',
                      fontWeight: 700,
                      cursor: 'default',
                      width: '100%',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {buttonText || 'Submit'}
                  </button>
                </div>
              </div>
            </div>

            {/* Public Link & Embed Snippet (Available in edit mode or when slug is defined) */}
            {isEdit && existingForm && (
              <div className="lg-card lg-section-card">
                <h2 className="lg-section-title">
                  <SparklesIcon size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Integration & Embed Code
                </h2>
                <p className="lg-section-subtitle">Embed this form on any external webpage or link directly to it.</p>

                <div className="lg-cell-stack" style={{ marginTop: '0.75rem' }}>
                  <Field label="Public Hosted URL">
                    <input
                      className="lg-input"
                      readOnly
                      value={existingForm.publicUrl || `/api/lead-generation/forms/public/${existingForm.slug}`}
                    />
                  </Field>

                  <Field label="Embed HTML Snippet">
                    <textarea
                      className="lg-textarea"
                      rows={3}
                      readOnly
                      value={
                        existingForm.embedSnippet ||
                        `<iframe src="${window.location.origin}/api/lead-generation/forms/public/${existingForm.slug}" width="100%" height="500" frameborder="0"></iframe>`
                      }
                    />
                  </Field>

                  <button
                    type="button"
                    className="auth-btn btn-ghost"
                    onClick={() => {
                      const snippet =
                        existingForm.embedSnippet ||
                        `<iframe src="${window.location.origin}/api/lead-generation/forms/public/${existingForm.slug}" width="100%" height="500" frameborder="0"></iframe>`;
                      navigator.clipboard.writeText(snippet);
                      setCopiedSnippet(true);
                      setTimeout(() => setCopiedSnippet(false), 2500);
                    }}
                  >
                    {copiedSnippet ? <CheckIcon size={16} /> : null}
                    <span>{copiedSnippet ? 'Copied to Clipboard!' : 'Copy Embed Code'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="lg-card lg-form-actions" style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            className="auth-btn btn-ghost"
            onClick={() => navigate('/lead-generation/forms')}
            disabled={isSaving}
          >
            Cancel
          </button>
          <PrimaryButton
            type="submit"
            fullWidth={false}
            isLoading={isSaving}
            loadingText="Saving Form..."
            id="lg-fb-save-btn"
          >
            {isEdit ? 'Save Changes' : 'Create Web Form'}
          </PrimaryButton>
        </div>
      </form>
    </LeadGenLayout>
  );
};
