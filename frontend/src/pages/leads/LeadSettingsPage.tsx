import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_LEAD_SETTINGS, leadService } from '../../services/lead.service';
import type {
  LeadModuleSettings,
  LeadSourceType,
  LeadStatus,
  LeadViewMode,
} from '../../types/lead.types';
import { SectionCard } from '../lead-generation/components/Cards';
import { Field, Toggle } from '../lead-generation/components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { LEAD_SOURCE_OPTIONS, LEAD_STATUS_OPTIONS } from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import {
  ArrowLeftIcon,
  AwardIcon,
  CheckCircleIcon,
  SettingsIcon,
  SlidersIcon,
  TagIcon,
  UsersIcon,
} from '../../components/common/Icons';

export const LeadSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<LeadModuleSettings>(DEFAULT_LEAD_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const loaded = await leadService.getSettings();
        if (!ignore) setSettings(loaded);
      } catch (err: any) {
        if (!ignore) setError(err?.message || 'Failed to load lead settings.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const update = <K extends keyof LeadModuleSettings>(key: K, value: LeadModuleSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.hotScoreThreshold <= settings.warmScoreThreshold) {
      setError('Hot score threshold must be greater than Warm score threshold.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await leadService.saveSettings(settings);
      setSettings(saved);
      setSuccess('Lead module settings saved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save lead settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setSettings(DEFAULT_LEAD_SETTINGS);
    await leadService.saveSettings(DEFAULT_LEAD_SETTINGS);
    setSuccess('Lead settings restored to factory defaults.');
  };

  return (
    <LeadsLayout
      title="Lead Settings"
      subtitle="Configure default lead stages, view preferences, score tier thresholds, and conversion rules."
      icon={<SettingsIcon size={22} />}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link to="/leads" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to All Leads
        </Link>
      }
      actions={
        <button
          type="button"
          className="auth-btn btn-ghost"
          onClick={handleResetDefaults}
          disabled={isSaving}
        >
          Reset to Defaults
        </button>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading lead configuration..." />
        </div>
      ) : (
        <form className="ld-modal-stack" onSubmit={handleSave}>
          <SectionCard
            title="1. Default Lead Capture & View Preferences"
            subtitle="Applied when creating new leads or opening the Leads Explorer."
          >
            <div className="lg-form-grid">
              <Field label="Default Qualification Status" htmlFor="set-default-status">
                <select
                  id="set-default-status"
                  className="lg-select"
                  value={settings.defaultStatus}
                  onChange={(e) => update('defaultStatus', e.target.value as LeadStatus)}
                >
                  {LEAD_STATUS_OPTIONS.filter((s) => s.value !== 'CONVERTED').map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Default Lead Source" htmlFor="set-default-source">
                <select
                  id="set-default-source"
                  className="lg-select"
                  value={settings.defaultSource}
                  onChange={(e) => update('defaultSource', e.target.value as LeadSourceType)}
                >
                  {LEAD_SOURCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Default Leads View Mode" htmlFor="set-default-view">
                <select
                  id="set-default-view"
                  className="lg-select"
                  value={settings.defaultView}
                  onChange={(e) => update('defaultView', e.target.value as LeadViewMode)}
                >
                  <option value="table">Table View</option>
                  <option value="list">List View (Cards)</option>
                  <option value="board">Kanban Board View</option>
                </select>
              </Field>

              <Field label="Default Page Size" htmlFor="set-page-size">
                <select
                  id="set-page-size"
                  className="lg-select"
                  value={String(settings.pageSize)}
                  onChange={(e) => update('pageSize', Number(e.target.value))}
                >
                  <option value="10">10 leads per page</option>
                  <option value="20">20 leads per page</option>
                  <option value="50">50 leads per page</option>
                </select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="2. Lead Score Tier Thresholds"
            subtitle="Define minimum score cutoffs for Hot and Warm lead badges across Table, List, and Board views."
          >
            <div className="lg-form-grid">
              <Field
                label={`Hot Lead Threshold (${settings.hotScoreThreshold}+ points)`}
                htmlFor="set-hot-threshold"
                hint="Leads at or above this score are highlighted in green as Hot."
              >
                <input
                  id="set-hot-threshold"
                  type="number"
                  min={10}
                  max={100}
                  className="lg-input"
                  value={settings.hotScoreThreshold}
                  onChange={(e) => update('hotScoreThreshold', Number(e.target.value))}
                />
              </Field>

              <Field
                label={`Warm Lead Threshold (${settings.warmScoreThreshold}–${
                  settings.hotScoreThreshold - 1
                } points)`}
                htmlFor="set-warm-threshold"
                hint="Leads below this threshold are classified as Cold."
              >
                <input
                  id="set-warm-threshold"
                  type="number"
                  min={1}
                  max={95}
                  className="lg-input"
                  value={settings.warmScoreThreshold}
                  onChange={(e) => update('warmScoreThreshold', Number(e.target.value))}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="3. Qualification, Conversion & Automation Policies"
            subtitle="Control lifecycle governance and automated processing."
          >
            <div className="ld-modal-stack">
              <Toggle
                id="set-require-qualified"
                checked={settings.requireQualifiedForConversion}
                onChange={(val) => update('requireQualifiedForConversion', val)}
                label="Recommend QUALIFIED status before converting a lead"
                description="Displays a governance warning if a user converts a lead that has not yet been marked QUALIFIED."
              />

              <Toggle
                id="set-auto-deal"
                checked={settings.autoCreateDealOnConversion}
                onChange={(val) => update('autoCreateDealOnConversion', val)}
                label="Automatically create a Sales Deal upon lead conversion"
                description="Pre-fills deal title and estimated value from the lead record during conversion."
              />

              <Toggle
                id="set-prevent-duplicates"
                checked={settings.preventDuplicateEmails}
                onChange={(val) => update('preventDuplicateEmails', val)}
                label="Flag duplicate work emails during Lead Import"
                description="Highlights duplicate email addresses in the CSV/JSON import preview."
              />

              <Toggle
                id="set-auto-score"
                checked={settings.autoScoreOnCreate}
                onChange={(val) => update('autoScoreOnCreate', val)}
                label="Enable automated rule-based lead scoring"
                description="Evaluate active workspace scoring rules when calculating lead scores."
              />

              <Toggle
                id="set-auto-route"
                checked={settings.autoRouteOnCreate}
                onChange={(val) => update('autoRouteOnCreate', val)}
                label="Enable automated assignment routing rules"
                description="Allow leads to be routed via round-robin and load-balanced assignment rules."
              />
            </div>
          </SectionCard>

          <SectionCard
            title="4. Related Lead Schema & Automation Configurations"
            subtitle="Jump directly to custom fields, tags, and rule builders."
          >
            <div className="lg-quick-grid">
              <Link to="/custom-fields" className="lg-quick-link">
                <span className="lg-quick-icon">
                  <SlidersIcon size={18} />
                </span>
                <span className="lg-quick-text">
                  <strong>Lead Custom Fields</strong>
                  <span>Add custom attributes to lead forms</span>
                </span>
              </Link>

              <Link to="/tags" className="lg-quick-link">
                <span className="lg-quick-icon">
                  <TagIcon size={18} />
                </span>
                <span className="lg-quick-text">
                  <strong>Lead Tags</strong>
                  <span>Manage categorization tags</span>
                </span>
              </Link>

              <Link to="/lead-generation/scoring" className="lg-quick-link">
                <span className="lg-quick-icon">
                  <AwardIcon size={18} />
                </span>
                <span className="lg-quick-text">
                  <strong>Scoring Rules Engine</strong>
                  <span>Configure point rules by attribute</span>
                </span>
              </Link>

              <Link to="/lead-generation/qualification" className="lg-quick-link">
                <span className="lg-quick-icon">
                  <CheckCircleIcon size={18} />
                </span>
                <span className="lg-quick-text">
                  <strong>Qualification Rules</strong>
                  <span>Configure automated qualification criteria</span>
                </span>
              </Link>

              <Link to="/lead-generation/assignment-rules" className="lg-quick-link">
                <span className="lg-quick-icon">
                  <UsersIcon size={18} />
                </span>
                <span className="lg-quick-text">
                  <strong>Assignment & Routing Rules</strong>
                  <span>Round-robin and territory routing</span>
                </span>
              </Link>
            </div>
          </SectionCard>

          <div className="lg-form-actions">
            <PrimaryButton
              type="submit"
              fullWidth={false}
              isLoading={isSaving}
              loadingText="Saving Settings..."
              icon={<CheckCircleIcon size={16} />}
            >
              Save Lead Settings
            </PrimaryButton>
          </div>
        </form>
      )}
    </LeadsLayout>
  );
};

