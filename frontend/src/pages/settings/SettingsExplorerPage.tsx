import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import { settingsService } from '../../services/settings.service';
import type {
  AllSettingsBundle,
  SettingsScreenSlug,
} from '../../types/settings.types';
import {
  DEFAULT_SETTINGS_BUNDLE,
  SETTINGS_SCREEN_META,
} from './settingsConstants';
import { SettingsLayout } from './components/SettingsLayout';
import {
  AccountSettingsSection,
  ActivitySettingsSection,
  CompanySettingsSection,
  ContactSettingsSection,
  DealSettingsSection,
  EmailSettingsSection,
  GeneralSettingsSection,
  IntegrationSettingsSection,
  LeadSettingsSection,
  NotificationSettingsSection,
  PipelineSettingsSection,
  ProfileSettingsSection,
  SecuritySettingsSection,
  WorkspaceSettingsSection,
} from './components/SettingsSections';

interface SettingsExplorerPageProps {
  screen: SettingsScreenSlug;
}

export const SettingsExplorerPage: React.FC<SettingsExplorerPageProps> = ({
  screen,
}) => {
  const { user, updateProfile } = useAuth();
  const { currentWorkspace, canManageWorkspace } = useWorkspace();

  const meta = SETTINGS_SCREEN_META[screen] || SETTINGS_SCREEN_META.account;

  // Determine editing privileges
  const isAdminOrManager =
    canManageWorkspace ||
    user?.role?.name === 'ADMIN' ||
    user?.role?.name === 'MANAGER';
  const canEdit = meta.requiresAdminOrManager ? isAdminOrManager : true;

  // Form State & Clean Reference State (Instant synchronous load from cache/defaults)
  const [initialData, setInitialData] = useState<AllSettingsBundle[typeof screen]>(
    () => settingsService.getCachedSettings(screen),
  );
  const [formData, setFormData] = useState<AllSettingsBundle[typeof screen]>(
    () => settingsService.getCachedSettings(screen),
  );

  // UI Feedback State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | string[] | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-Save Implementation
  const isInitialMount = React.useRef(true);

  // Instant switch data when changing screen without any loading delay
  useEffect(() => {
    const cached = settingsService.getCachedSettings(screen);
    setInitialData(cached);
    setFormData(cached);
    isInitialMount.current = true;
    setError(null);
  }, [screen]);

  // Load screen data in background without blocking UI
  const loadData = useCallback(async () => {
    try {
      const data = await settingsService.loadScreenSettings(screen, {
        workspaceId: currentWorkspace?.id,
        user,
      });
      setInitialData(data);
      setFormData((prev: any) => {
        const wasEdited = JSON.stringify(prev) !== JSON.stringify(settingsService.getCachedSettings(screen));
        return wasEdited ? prev : data;
      });
    } catch {
      // Silent background sync fallback: keep cached/default data without interrupting user
    }
  }, [screen, currentWorkspace?.id, user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Determine if form is dirty
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  // Patch Form Helper
  const patchFormData = (patch: Record<string, unknown>) => {
    setFormData((prev: any) => ({
      ...prev,
      ...patch,
    }));
  };

  const performSave = useCallback(
    async (dataToSave: any) => {
      if (!canEdit) return;

      setIsSaving(true);
      setError(null);

      try {
        const saved = await settingsService.saveScreenSettings(screen, dataToSave, {
          workspaceId: currentWorkspace?.id,
          updateUserProfile: updateProfile,
        });
        setInitialData(saved);
        setSuccess('Changes saved automatically');
        const timer = setTimeout(() => setSuccess(null), 3000);
        return () => clearTimeout(timer);
      } catch (err: unknown) {
        const apiErr = err as {
          response?: { data?: { message?: string | string[] } };
        };
        setError(
          apiErr?.response?.data?.message ||
            `Failed to auto-save ${meta.label}. Please verify inputs.`,
        );
      } finally {
        setIsSaving(false);
      }
    },
    [canEdit, screen, currentWorkspace?.id, updateProfile, meta.label],
  );

  // Debounced auto-save effect whenever formData changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (JSON.stringify(formData) !== JSON.stringify(initialData)) {
      const timer = setTimeout(() => {
        void performSave(formData);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [formData, initialData, performSave]);

  // Reset to Defaults with immediate auto-save
  const handleResetDefaults = async () => {
    const defaultData = DEFAULT_SETTINGS_BUNDLE[screen];
    setFormData(defaultData);
    await performSave(defaultData);
    setSuccess(`Restored default ${meta.shortLabel} settings and saved automatically.`);
  };

  return (
    <SettingsLayout
      screen={screen}
      isDirty={isDirty}
      canEdit={canEdit}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      onSave={() => performSave(formData)}
      onDiscard={() => setFormData(initialData)}
      onResetDefaults={handleResetDefaults}
      isSaving={isSaving}
    >
      {screen === 'account' && (
        <AccountSettingsSection
          value={formData as AllSettingsBundle['account']}
          onChange={patchFormData}
        />
      )}

      {screen === 'profile' && (
        <ProfileSettingsSection
          value={formData as AllSettingsBundle['profile']}
          onChange={patchFormData}
        />
      )}

          {screen === 'workspace' && (
            <WorkspaceSettingsSection
              value={formData as AllSettingsBundle['workspace']}
              onChange={patchFormData}
            />
          )}

          {screen === 'general' && (
            <GeneralSettingsSection
              value={formData as AllSettingsBundle['general']}
              onChange={patchFormData}
            />
          )}

          {screen === 'leads' && (
            <LeadSettingsSection
              value={formData as AllSettingsBundle['leads']}
              onChange={patchFormData}
            />
          )}

          {screen === 'contacts' && (
            <ContactSettingsSection
              value={formData as AllSettingsBundle['contacts']}
              onChange={patchFormData}
            />
          )}

          {screen === 'companies' && (
            <CompanySettingsSection
              value={formData as AllSettingsBundle['companies']}
              onChange={patchFormData}
            />
          )}

          {screen === 'deals' && (
            <DealSettingsSection
              value={formData as AllSettingsBundle['deals']}
              onChange={patchFormData}
            />
          )}

          {screen === 'pipelines' && (
            <PipelineSettingsSection
              value={formData as AllSettingsBundle['pipelines']}
              onChange={patchFormData}
            />
          )}

          {screen === 'activities' && (
            <ActivitySettingsSection
              value={formData as AllSettingsBundle['activities']}
              onChange={patchFormData}
            />
          )}

          {screen === 'notifications' && (
            <NotificationSettingsSection
              value={formData as AllSettingsBundle['notifications']}
              onChange={patchFormData}
            />
          )}

          {screen === 'email' && (
            <EmailSettingsSection
              value={formData as AllSettingsBundle['email']}
              onChange={patchFormData}
            />
          )}

          {screen === 'integrations' && (
            <IntegrationSettingsSection
              value={formData as AllSettingsBundle['integrations']}
              onChange={patchFormData}
            />
          )}

          {screen === 'security' && (
            <SecuritySettingsSection
              value={formData as AllSettingsBundle['security']}
              onChange={patchFormData}
            />
          )}
    </SettingsLayout>
  );
};

