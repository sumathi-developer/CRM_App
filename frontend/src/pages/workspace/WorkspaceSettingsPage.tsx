import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { workspaceService } from '../../services/workspace.service';
import { Navbar } from '../../components/common/Navbar';
import { WorkspaceHeader } from '../../components/workspace/WorkspaceHeader';
import { WorkspaceSwitcher } from '../../components/workspace/WorkspaceSwitcher';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { FormField } from '../../components/auth/FormField';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  BuildingIcon,
  PaletteIcon,
  GlobeIcon,
  SlidersIcon,
  ShieldIcon,
  TrashIcon,
  CheckCircleIcon,
  MailIcon,
} from '../../components/common/Icons';

export const WorkspaceSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentWorkspace, canManageWorkspace, refreshCurrentWorkspace, refreshWorkspaces } = useWorkspace();

  const [activeSection, setActiveSection] = useState<'general' | 'branding' | 'localization' | 'preferences' | 'security' | 'danger'>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingWs, setIsDeletingWs] = useState(false);

  // General Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  // Branding Fields
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [accentColor, setAccentColor] = useState('#10b981');
  const [companyPortalUrl, setCompanyPortalUrl] = useState('');

  // Localization Fields
  const [timezone, setTimezone] = useState('America/New_York');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = useState('24h');

  // Preferences Fields
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoAssignLeads, setAutoAssignLeads] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Security Fields
  const [enforceTwoFactor, setEnforceTwoFactor] = useState(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(1440);
  const [allowedEmailDomains, setAllowedEmailDomains] = useState('');
  const [ipAllowlist, setIpAllowlist] = useState('');

  // Modals & Feedback
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);


  useEffect(() => {
    let ignore = false;
    if (!currentWorkspace?.id) return;

    const fetchInitialSettings = async () => {
      try {
        const data = await workspaceService.getSettings(currentWorkspace.id);
        if (!ignore) {
          setName(currentWorkspace.name || '');
          setSlug(currentWorkspace.slug || '');
          setDescription(currentWorkspace.description || '');
          setWebsite(currentWorkspace.website || '');
          setCompanyName(data.general?.companyName || '');
          setIndustry(data.general?.industry || '');
          setSupportEmail(data.general?.supportEmail || '');

          setLogoUrl(data.branding?.logoUrl || '');
          setFaviconUrl(data.branding?.faviconUrl || '');
          setPrimaryColor(data.branding?.primaryColor || '#3b82f6');
          setAccentColor(data.branding?.accentColor || '#10b981');
          setCompanyPortalUrl(data.branding?.companyPortalUrl || '');

          setTimezone(data.localization?.timezone || currentWorkspace.timezone || 'UTC');
          setCurrency(data.localization?.currency || currentWorkspace.currency || 'USD');
          setLanguage(data.localization?.language || 'en');
          setDateFormat(data.localization?.dateFormat || 'YYYY-MM-DD');
          setTimeFormat(data.localization?.timeFormat || '24h');

          setEmailNotifications(data.preferences?.emailNotifications ?? true);
          setAutoAssignLeads(data.preferences?.autoAssignLeads ?? false);
          setWeeklyDigest(data.preferences?.weeklyDigest ?? true);

          setEnforceTwoFactor(data.security?.enforceTwoFactor ?? false);
          setSessionTimeoutMinutes(data.security?.sessionTimeoutMinutes || 1440);
          setAllowedEmailDomains((data.security?.allowedEmailDomains || []).join(', '));
          setIpAllowlist((data.security?.ipAllowlist || []).join(', '));
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load workspace settings');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialSettings();
    return () => {
      ignore = true;
    };
  }, [currentWorkspace]);

  // Save General
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id) return;
    setIsSaving(true);
    setApiError(null);

    try {
      // 1. Update Workspace metadata
      await workspaceService.updateWorkspace(currentWorkspace.id, {
        name,
        slug,
        description,
        website,
      });

      // 2. Update General Settings
      await workspaceService.updateSettings(currentWorkspace.id, {
        general: {
          companyName,
          industry,
          supportEmail,
        },
      });

      await refreshCurrentWorkspace();
      setApiSuccess('General information updated successfully!');
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to save general settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id) return;
    setIsSaving(true);
    setApiError(null);

    try {
      await workspaceService.updateBranding(currentWorkspace.id, {
        logoUrl,
        faviconUrl,
        primaryColor,
        accentColor,
        companyPortalUrl,
      });

      setApiSuccess('Branding settings updated!');
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to save branding');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Localization
  const handleSaveLocalization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id) return;
    setIsSaving(true);
    setApiError(null);

    try {
      await workspaceService.updateLocalization(currentWorkspace.id, {
        timezone,
        currency,
        language,
        dateFormat,
        timeFormat,
      });

      await refreshCurrentWorkspace();
      setApiSuccess('Localization & currency updated!');
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to save localization');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id) return;
    setIsSaving(true);
    setApiError(null);

    try {
      await workspaceService.updatePreferences(currentWorkspace.id, {
        emailNotifications,
        autoAssignLeads,
        weeklyDigest,
      });

      setApiSuccess('Workspace preferences saved!');
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Security
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id) return;
    setIsSaving(true);
    setApiError(null);

    const domains = allowedEmailDomains
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const ips = ipAllowlist
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      await workspaceService.updateSecurity(currentWorkspace.id, {
        enforceTwoFactor,
        sessionTimeoutMinutes: Number(sessionTimeoutMinutes) || 1440,
        allowedEmailDomains: domains,
        ipAllowlist: ips,
      });

      setApiSuccess('Workspace security policies updated!');
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to save security settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Workspace
  const handleConfirmDeleteWorkspace = async () => {
    if (!currentWorkspace?.id) return;
    setIsDeletingWs(true);

    try {
      await workspaceService.deleteWorkspace(currentWorkspace.id);
      await refreshWorkspaces();
      setIsDeleteModalOpen(false);
      navigate('/workspaces/switcher');
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete workspace');
    } finally {
      setIsDeletingWs(false);
    }
  };

  return (
    <div className="authenticated-page-layout">
      <Navbar />

      <main className="authenticated-container" id="workspace-settings-page">
        <WorkspaceHeader onOpenSwitcher={() => setIsSwitcherOpen(true)} />

        <div className="section-toolbar-row">
          <div>
            <h2 className="section-title">Workspace Configuration</h2>
            <p className="section-desc">
              Manage organization metadata, custom branding, regional formatting, and security controls
            </p>
          </div>
        </div>

        <ErrorMessage
          error={apiError}
          onDismiss={() => setApiError(null)}
          title="Settings Error"
        />

        <SuccessMessage
          message={apiSuccess}
          onDismiss={() => setApiSuccess(null)}
          title="Settings Saved"
        />

        {isLoading ? (
          <div className="workspace-loading-state" role="status">
            <LoadingIndicator size="large" message="Loading workspace settings..." />
          </div>
        ) : (
          <div className="settings-tabbed-layout">
            {/* Left Nav Menu */}
            <aside className="settings-sidebar-nav">
              <button
                type="button"
                className={`settings-nav-btn ${activeSection === 'general' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('general')}
              >
                <BuildingIcon size={18} />
                <span>General Information</span>
              </button>

              <button
                type="button"
                className={`settings-nav-btn ${activeSection === 'branding' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('branding')}
              >
                <PaletteIcon size={18} />
                <span>Branding & Theme</span>
              </button>

              <button
                type="button"
                className={`settings-nav-btn ${activeSection === 'localization' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('localization')}
              >
                <GlobeIcon size={18} />
                <span>Localization & Currency</span>
              </button>

              <button
                type="button"
                className={`settings-nav-btn ${activeSection === 'preferences' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('preferences')}
              >
                <SlidersIcon size={18} />
                <span>Preferences & Automation</span>
              </button>

              <button
                type="button"
                className={`settings-nav-btn ${activeSection === 'security' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                <ShieldIcon size={18} />
                <span>Security & Compliance</span>
              </button>

              <button
                type="button"
                className={`settings-nav-btn danger-tab ${activeSection === 'danger' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('danger')}
              >
                <TrashIcon size={18} />
                <span>Danger Zone</span>
              </button>
            </aside>

            {/* Right Form Card */}
            <div className="settings-content-card">
              {/* 1. GENERAL SETTINGS */}
              {activeSection === 'general' && (
                <form onSubmit={handleSaveGeneral} className="portal-form" id="form-general-settings">
                  <div className="card-section-header">
                    <div className="section-icon-badge">
                      <BuildingIcon size={20} />
                    </div>
                    <div>
                      <h3 className="section-title">General Information</h3>
                      <p className="section-desc">Workspace naming, routing slug, and organizational identity</p>
                    </div>
                  </div>

                  <FormField
                    id="ws-name-edit"
                    name="name"
                    label="Workspace Display Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={!canManageWorkspace || isSaving}
                  />

                  <FormField
                    id="ws-slug-edit"
                    name="slug"
                    label="Routing Slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    disabled={!canManageWorkspace || isSaving}
                    helperText="Used in workspace URLs and subdomains."
                  />

                  <div className="form-field-group">
                    <label htmlFor="ws-desc-edit" className="form-field-label">Workspace Description</label>
                    <textarea
                      id="ws-desc-edit"
                      className="form-textarea"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!canManageWorkspace || isSaving}
                    />
                  </div>

                  <div className="form-row-two-col">
                    <FormField
                      id="ws-company-edit"
                      name="companyName"
                      label="Company Name"
                      placeholder="e.g. Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={!canManageWorkspace || isSaving}
                    />

                    <FormField
                      id="ws-industry-edit"
                      name="industry"
                      label="Industry Vertical"
                      placeholder="e.g. Financial Software, SaaS"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      disabled={!canManageWorkspace || isSaving}
                    />
                  </div>

                  <div className="form-row-two-col">
                    <FormField
                      id="ws-support-email-edit"
                      name="supportEmail"
                      type="email"
                      label="Support Contact Email"
                      placeholder="support@company.com"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      icon={<MailIcon size={18} />}
                      disabled={!canManageWorkspace || isSaving}
                    />

                    <FormField
                      id="ws-website-edit"
                      name="website"
                      label="Official Website URL"
                      placeholder="https://company.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      disabled={!canManageWorkspace || isSaving}
                    />
                  </div>

                  {canManageWorkspace && (
                    <div className="form-action-row">
                      <PrimaryButton
                        type="submit"
                        isLoading={isSaving}
                        loadingText="Saving Settings..."
                        icon={<CheckCircleIcon size={16} />}
                        fullWidth={false}
                        id="btn-save-general-settings"
                      >
                        Save General Information
                      </PrimaryButton>
                    </div>
                  )}
                </form>
              )}

              {/* 2. BRANDING SETTINGS */}
              {activeSection === 'branding' && (
                <form onSubmit={handleSaveBranding} className="portal-form" id="form-branding-settings">
                  <div className="card-section-header">
                    <div className="section-icon-badge">
                      <PaletteIcon size={20} />
                    </div>
                    <div>
                      <h3 className="section-title">Branding & White-Label Theme</h3>
                      <p className="section-desc">Customize logos, favicons, and corporate palette colors</p>
                    </div>
                  </div>

                  <FormField
                    id="branding-logo-url"
                    name="logoUrl"
                    label="Workspace Logo URL"
                    placeholder="https://cdn.example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    disabled={!canManageWorkspace || isSaving}
                    helperText="Recommended dimension: 256x256 PNG or SVG with transparent background."
                  />

                  <FormField
                    id="branding-favicon-url"
                    name="faviconUrl"
                    label="Favicon URL"
                    placeholder="https://cdn.example.com/favicon.ico"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    disabled={!canManageWorkspace || isSaving}
                  />

                  <div className="form-row-two-col">
                    <div className="form-field-group">
                      <label htmlFor="color-primary-input" className="form-field-label">Primary Brand Color</label>
                      <div className="color-picker-input-wrap">
                        <input
                          id="color-primary-input"
                          type="color"
                          className="color-picker-swatch"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          disabled={!canManageWorkspace || isSaving}
                        />
                        <input
                          type="text"
                          className="form-input font-mono"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          disabled={!canManageWorkspace || isSaving}
                        />
                      </div>
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="color-accent-input" className="form-field-label">Accent Highlight Color</label>
                      <div className="color-picker-input-wrap">
                        <input
                          id="color-accent-input"
                          type="color"
                          className="color-picker-swatch"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          disabled={!canManageWorkspace || isSaving}
                        />
                        <input
                          type="text"
                          className="form-input font-mono"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          disabled={!canManageWorkspace || isSaving}
                        />
                      </div>
                    </div>
                  </div>

                  <FormField
                    id="branding-portal-url"
                    name="companyPortalUrl"
                    label="Custom Enterprise Portal URL"
                    placeholder="https://crm.mycompany.com"
                    value={companyPortalUrl}
                    onChange={(e) => setCompanyPortalUrl(e.target.value)}
                    disabled={!canManageWorkspace || isSaving}
                  />

                  {canManageWorkspace && (
                    <div className="form-action-row">
                      <PrimaryButton
                        type="submit"
                        isLoading={isSaving}
                        loadingText="Updating Branding..."
                        icon={<CheckCircleIcon size={16} />}
                        fullWidth={false}
                        id="btn-save-branding-settings"
                      >
                        Save Branding Configuration
                      </PrimaryButton>
                    </div>
                  )}
                </form>
              )}

              {/* 3. LOCALIZATION SETTINGS */}
              {activeSection === 'localization' && (
                <form onSubmit={handleSaveLocalization} className="portal-form" id="form-localization-settings">
                  <div className="card-section-header">
                    <div className="section-icon-badge">
                      <GlobeIcon size={20} />
                    </div>
                    <div>
                      <h3 className="section-title">Localization & Regional Standards</h3>
                      <p className="section-desc">Timezone calculations, default currency, and date representations</p>
                    </div>
                  </div>

                  <div className="form-row-two-col">
                    <div className="form-field-group">
                      <label htmlFor="loc-tz-select" className="form-field-label">Timezone</label>
                      <select
                        id="loc-tz-select"
                        className="form-select"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        disabled={!canManageWorkspace || isSaving}
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York">America/New_York (EST/EDT)</option>
                        <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                        <option value="Europe/London">Europe/London (GMT/BST)</option>
                        <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="loc-curr-select" className="form-field-label">Base Currency</label>
                      <select
                        id="loc-curr-select"
                        className="form-select"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        disabled={!canManageWorkspace || isSaving}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-two-col">
                    <div className="form-field-group">
                      <label htmlFor="loc-date-select" className="form-field-label">Date Format</label>
                      <select
                        id="loc-date-select"
                        className="form-select"
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        disabled={!canManageWorkspace || isSaving}
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-27)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (10/27/2026)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (27/10/2026)</option>
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="loc-time-select" className="form-field-label">Time Format</label>
                      <select
                        id="loc-time-select"
                        className="form-select"
                        value={timeFormat}
                        onChange={(e) => setTimeFormat(e.target.value)}
                        disabled={!canManageWorkspace || isSaving}
                      >
                        <option value="24h">24-hour (14:30)</option>
                        <option value="12h">12-hour (2:30 PM)</option>
                      </select>
                    </div>
                  </div>

                  {canManageWorkspace && (
                    <div className="form-action-row">
                      <PrimaryButton
                        type="submit"
                        isLoading={isSaving}
                        loadingText="Updating Localization..."
                        icon={<CheckCircleIcon size={16} />}
                        fullWidth={false}
                        id="btn-save-localization-settings"
                      >
                        Save Localization
                      </PrimaryButton>
                    </div>
                  )}
                </form>
              )}

              {/* 4. PREFERENCES SETTINGS */}
              {activeSection === 'preferences' && (
                <form onSubmit={handleSavePreferences} className="portal-form" id="form-preferences-settings">
                  <div className="card-section-header">
                    <div className="section-icon-badge">
                      <SlidersIcon size={20} />
                    </div>
                    <div>
                      <h3 className="section-title">Preferences & Automation Policies</h3>
                      <p className="section-desc">Automated assignment rules, notification digests, and defaults</p>
                    </div>
                  </div>

                  <div className="settings-switches-stack">
                    <label className="settings-toggle-card">
                      <div className="toggle-text-wrap">
                        <span className="toggle-title">System Email Notifications</span>
                        <span className="toggle-sub">Notify team members regarding new lead assignments and deal updates</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        disabled={!canManageWorkspace || isSaving}
                      />
                    </label>

                    <label className="settings-toggle-card">
                      <div className="toggle-text-wrap">
                        <span className="toggle-title">Automatic Lead Routing</span>
                        <span className="toggle-sub">Auto-assign new inbound leads evenly across active sales reps</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoAssignLeads}
                        onChange={(e) => setAutoAssignLeads(e.target.checked)}
                        disabled={!canManageWorkspace || isSaving}
                      />
                    </label>

                    <label className="settings-toggle-card">
                      <div className="toggle-text-wrap">
                        <span className="toggle-title">Weekly Performance Digest</span>
                        <span className="toggle-sub">Send executive summary report every Monday at 08:00 AM</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={weeklyDigest}
                        onChange={(e) => setWeeklyDigest(e.target.checked)}
                        disabled={!canManageWorkspace || isSaving}
                      />
                    </label>
                  </div>

                  {canManageWorkspace && (
                    <div className="form-action-row">
                      <PrimaryButton
                        type="submit"
                        isLoading={isSaving}
                        loadingText="Saving Preferences..."
                        icon={<CheckCircleIcon size={16} />}
                        fullWidth={false}
                        id="btn-save-preferences-settings"
                      >
                        Save Preferences
                      </PrimaryButton>
                    </div>
                  )}
                </form>
              )}

              {/* 5. SECURITY SETTINGS */}
              {activeSection === 'security' && (
                <form onSubmit={handleSaveSecurity} className="portal-form" id="form-security-settings">
                  <div className="card-section-header">
                    <div className="section-icon-badge">
                      <ShieldIcon size={20} />
                    </div>
                    <div>
                      <h3 className="section-title">Security & Enterprise Governance</h3>
                      <p className="section-desc">Enforce two-factor authentication, session timeouts, and IP whitelisting</p>
                    </div>
                  </div>

                  <div className="settings-switches-stack">
                    <label className="settings-toggle-card">
                      <div className="toggle-text-wrap">
                        <span className="toggle-title">Enforce Two-Factor Authentication (2FA)</span>
                        <span className="toggle-sub">Mandate 2FA verification for all workspace members upon login</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enforceTwoFactor}
                        onChange={(e) => setEnforceTwoFactor(e.target.checked)}
                        disabled={!canManageWorkspace || isSaving}
                      />
                    </label>
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="sec-timeout-input" className="form-field-label">
                      Session Inactivity Timeout (Minutes)
                    </label>
                    <input
                      id="sec-timeout-input"
                      type="number"
                      className="form-input"
                      min={15}
                      max={10080}
                      value={sessionTimeoutMinutes}
                      onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                      disabled={!canManageWorkspace || isSaving}
                    />
                    <p className="form-field-helper">Default: 1440 minutes (24 hours). Minimum: 15 minutes.</p>
                  </div>

                  <FormField
                    id="sec-domains-input"
                    name="allowedEmailDomains"
                    label="Allowed Email Domains (Comma Separated)"
                    placeholder="company.com, globalpartners.com"
                    value={allowedEmailDomains}
                    onChange={(e) => setAllowedEmailDomains(e.target.value)}
                    disabled={!canManageWorkspace || isSaving}
                    helperText="Leave empty to permit any authorized email domain."
                  />

                  <FormField
                    id="sec-ip-input"
                    name="ipAllowlist"
                    label="CIDR IP Allowlist (Comma Separated)"
                    placeholder="192.168.1.0/24, 10.0.0.0/16"
                    value={ipAllowlist}
                    onChange={(e) => setIpAllowlist(e.target.value)}
                    disabled={!canManageWorkspace || isSaving}
                    helperText="Restricts workspace API queries to trusted network ranges."
                  />

                  {canManageWorkspace && (
                    <div className="form-action-row">
                      <PrimaryButton
                        type="submit"
                        isLoading={isSaving}
                        loadingText="Applying Policies..."
                        icon={<CheckCircleIcon size={16} />}
                        fullWidth={false}
                        id="btn-save-security-settings"
                      >
                        Apply Security Policies
                      </PrimaryButton>
                    </div>
                  )}
                </form>
              )}

              {/* 6. DANGER ZONE */}
              {activeSection === 'danger' && (
                <div className="danger-zone-container">
                  <div className="card-section-header">
                    <div className="section-icon-badge danger">
                      <TrashIcon size={20} />
                    </div>
                    <div>
                      <h3 className="section-title text-danger">Danger Zone</h3>
                      <p className="section-desc">Irreversible operational actions for this CRM workspace</p>
                    </div>
                  </div>

                  <div className="danger-action-card">
                    <div className="danger-action-info">
                      <h4 className="danger-action-title">Delete this Workspace</h4>
                      <p className="danger-action-desc">
                        Permanently deletes <strong>{currentWorkspace?.name || 'this workspace'}</strong>, including all linked leads, deals, contacts, pipeline stages, and audit logs.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="auth-btn btn-danger"
                      onClick={() => setIsDeleteModalOpen(true)}
                      disabled={!canManageWorkspace}
                      id="btn-delete-workspace-trigger"
                    >
                      <TrashIcon size={16} />
                      <span>Delete Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <WorkspaceSwitcher
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Permanently Delete Workspace"
        message={`Are you completely certain you want to delete "${currentWorkspace?.name}"? All contacts, pipelines, deals, and team settings will be permanently destroyed. This cannot be undone.`}
        itemName={currentWorkspace?.name}
        confirmLabel="I understand, Delete Workspace"
        isLoading={isDeletingWs}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteWorkspace}
      />
    </div>
  );
};
