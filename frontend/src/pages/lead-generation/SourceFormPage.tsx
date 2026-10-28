import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import type { LeadSourcePayload, LeadSourceType } from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { Field } from './components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import { SOURCE_TYPE_OPTIONS } from './leadGenConstants';
import { GlobeIcon, ArrowLeftIcon } from '../../components/common/Icons';
import { EmptyState } from '../../components/common/EmptyState';

interface SourceFormState {
  name: string;
  code: string;
  type: LeadSourceType;
  description: string;
  status: string;
  cost: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

const EMPTY_FORM: SourceFormState = {
  name: '',
  code: '',
  type: 'WEBSITE',
  description: '',
  status: 'ACTIVE',
  cost: '0',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
};

type FormErrors = Partial<Record<keyof SourceFormState, string>>;

function validate(f: SourceFormState): FormErrors {
  const errors: FormErrors = {};
  if (!f.name.trim()) errors.name = 'Source name is required.';
  else if (f.name.trim().length > 150) errors.name = 'Name cannot exceed 150 characters.';
  if (f.code.trim() && !/^[A-Za-z0-9_-]+$/.test(f.code.trim())) {
    errors.code = 'Use letters, numbers, dashes or underscores only.';
  }
  if (f.cost.trim() === '' || Number.isNaN(Number(f.cost)) || Number(f.cost) < 0) {
    errors.cost = 'Cost must be a number of 0 or more.';
  }
  return errors;
}

interface SourceEditorProps {
  sourceId?: string;
  initial: SourceFormState;
  isSystem?: boolean;
}

const SourceEditor: React.FC<SourceEditorProps> = ({ sourceId, initial, isSystem }) => {
  const navigate = useNavigate();
  const { workspaceId } = useLeadGenAccess();
  const isEdit = Boolean(sourceId);

  const [form, setForm] = useState<SourceFormState>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = <K extends keyof SourceFormState>(key: K, value: SourceFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload: LeadSourcePayload = {
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      cost: Number(form.cost),
      ...(form.code.trim() ? { code: form.code.trim().toUpperCase() } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.utmSource.trim() ? { utmSource: form.utmSource.trim() } : {}),
      ...(form.utmMedium.trim() ? { utmMedium: form.utmMedium.trim() } : {}),
      ...(form.utmCampaign.trim() ? { utmCampaign: form.utmCampaign.trim() } : {}),
    };

    setIsSaving(true);
    setApiError(null);
    try {
      if (sourceId) {
        await leadGenerationService.updateSource(sourceId, payload);
        navigate(`/lead-generation/sources/${sourceId}`, { state: { flash: 'Lead source updated successfully.' } });
      } else {
        const created = await leadGenerationService.createSource({ ...payload, workspaceId });
        navigate(`/lead-generation/sources/${created.id}`, { state: { flash: 'Lead source created successfully.' } });
      }
    } catch (err: any) {
      setApiError(
        err?.statusCode === 409
          ? 'A lead source with this code already exists. Choose a different code.'
          : err?.message || 'Failed to save lead source.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="lg-card lg-form-card" onSubmit={handleSubmit} noValidate>
      {apiError && (
        <div className="lg-inline-alert" role="alert">
          {apiError}
        </div>
      )}
      {isSystem && (
        <div className="lg-inline-note">This is a system source. You can adjust its settings, but it cannot be deleted.</div>
      )}

      <div className="lg-form-grid">
        <Field label="Source name" htmlFor="lg-src-name" required error={errors.name}>
          <input id="lg-src-name" className="lg-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Google Ads — Summer Campaign" disabled={isSaving} />
        </Field>

        <Field label="Code" htmlFor="lg-src-code" error={errors.code} hint="Unique identifier, auto-uppercased. e.g. GOOGLE_ADS_SUMMER">
          <input id="lg-src-code" className="lg-input" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="GOOGLE_ADS_SUMMER" disabled={isSaving} />
        </Field>

        <Field label="Channel type" htmlFor="lg-src-type" required>
          <select id="lg-src-type" className="lg-select" value={form.type} onChange={(e) => set('type', e.target.value as LeadSourceType)} disabled={isSaving}>
            {SOURCE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" htmlFor="lg-src-status">
          <select id="lg-src-status" className="lg-select" value={form.status} onChange={(e) => set('status', e.target.value)} disabled={isSaving}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>

        <Field label="Total cost invested (USD)" htmlFor="lg-src-cost" error={errors.cost} hint="Used to calculate cost per lead, CAC and ROI.">
          <input id="lg-src-cost" className="lg-input" type="number" min={0} step="0.01" value={form.cost} onChange={(e) => set('cost', e.target.value)} disabled={isSaving} />
        </Field>

        <Field label="Description" htmlFor="lg-src-desc" className="lg-span-2">
          <textarea id="lg-src-desc" className="lg-textarea" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Where do these leads come from?" disabled={isSaving} />
        </Field>
      </div>

      <h3 className="lg-form-section-title">Default UTM attribution</h3>
      <div className="lg-form-grid lg-form-grid-3">
        <Field label="UTM source" htmlFor="lg-src-utm-source">
          <input id="lg-src-utm-source" className="lg-input" value={form.utmSource} onChange={(e) => set('utmSource', e.target.value)} placeholder="google" disabled={isSaving} />
        </Field>
        <Field label="UTM medium" htmlFor="lg-src-utm-medium">
          <input id="lg-src-utm-medium" className="lg-input" value={form.utmMedium} onChange={(e) => set('utmMedium', e.target.value)} placeholder="cpc" disabled={isSaving} />
        </Field>
        <Field label="UTM campaign" htmlFor="lg-src-utm-campaign">
          <input id="lg-src-utm-campaign" className="lg-input" value={form.utmCampaign} onChange={(e) => set('utmCampaign', e.target.value)} placeholder="summer_promo" disabled={isSaving} />
        </Field>
      </div>

      <div className="lg-form-actions">
        <button type="button" className="auth-btn btn-ghost" onClick={() => navigate(-1)} disabled={isSaving}>
          Cancel
        </button>
        <PrimaryButton type="submit" fullWidth={false} isLoading={isSaving} loadingText="Saving...">
          {isEdit ? 'Save changes' : 'Create source'}
        </PrimaryButton>
      </div>
    </form>
  );
};

/** Handles both /sources/create and /sources/:id/edit. */
export const SourceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { canManage } = useLeadGenAccess();
  const isEdit = Boolean(id);

  const loader = useCallback(async () => (id ? leadGenerationService.getSourceById(id) : null), [id]);
  const { data: source, isLoading, error, clearError } = useAsyncData(loader);

  const header = (
    <Link to={id ? `/lead-generation/sources/${id}` : '/lead-generation/sources'} className="auth-btn btn-ghost">
      <ArrowLeftIcon size={16} />
      <span>Back</span>
    </Link>
  );

  if (!canManage) {
    return (
      <LeadGenLayout title="Lead Source" icon={<GlobeIcon size={22} />} actions={header}>
        <div className="lg-card lg-state-box">
          <EmptyState title="Permission required" description="Only workspace owners and admins can create or edit lead sources." />
        </div>
      </LeadGenLayout>
    );
  }

  return (
    <LeadGenLayout
      title={isEdit ? 'Edit Lead Source' : 'New Lead Source'}
      subtitle={isEdit ? 'Update the source settings and cost tracking.' : 'Define a new channel or campaign that generates leads.'}
      icon={<GlobeIcon size={22} />}
      error={error}
      onDismissError={clearError}
      actions={header}
    >
      {isEdit && isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="medium" message="Loading lead source..." />
        </div>
      ) : isEdit && !source ? (
        <div className="lg-card lg-state-box">
          <EmptyState title="Lead source not found" description="It may have been deleted." />
        </div>
      ) : (
        <SourceEditor
          key={id || 'new'}
          sourceId={id}
          isSystem={source?.isSystem}
          initial={
            source
              ? {
                  name: source.name,
                  code: source.code || '',
                  type: source.type,
                  description: source.description || '',
                  status: source.status || 'ACTIVE',
                  cost: String(source.cost ?? 0),
                  utmSource: source.utmSource || '',
                  utmMedium: source.utmMedium || '',
                  utmCampaign: source.utmCampaign || '',
                }
              : EMPTY_FORM
          }
        />
      )}
    </LeadGenLayout>
  );
};
