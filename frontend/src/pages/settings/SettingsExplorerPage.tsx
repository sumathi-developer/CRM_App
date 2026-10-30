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
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';

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

  // Form State & Clean Reference State
  const [initialData, setInitialData] = useState<AllSettingsBundle[typeof screen]>(
    () => DEFAULT_SETTINGS_BUNDLE[screen],
  );
  const [formData, setFormData] = useState<AllSettingsBundle[typeof screen]>(
    () => DEFAULT_SETTINGS_BUNDLE[screen],
  );

  // UI Feedback State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | string[] | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load screen data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await settingsService.loadScreenSettings(screen, {
        workspaceId: currentWorkspace?.id,
        user,
      });
      setInitialData(data);
      setFormData(data);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      setError(
        apiErr?.response?.data?.message ||
          `Failed to load ${meta.label}. Please try refreshing.`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [screen, currentWorkspace?.id, user, meta.label]);

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

  // Save Settings Handler
  const handleSave = async () => {
    if (!canEdit) {
      setError('You do not have permission to modify these settings.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const saved = await settingsService.saveScreenSettings(screen, formData, {
        workspaceId: currentWorkspace?.id,
        updateUserProfile: updateProfile,
      });
      setInitialData(saved);
      setFormData(saved);
      setSuccess(`${meta.label} saved successfully.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      setError(
        apiErr?.response?.data?.message ||
          `Failed to save ${meta.label}. Please verify inputs and try again.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Discard Changes
  const handleDiscard = () => {
    setFormData(initialData);
    setError(null);
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    const defaultData = DEFAULT_SETTINGS_BUNDLE[screen];
    setFormData(defaultData);
    setSuccess(
      `Restored default ${meta.shortLabel} values. Click Save Changes to commit.`,
    );
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
      onSave={handleSave}
      onDiscard={handleDiscard}
      onResetDefaults={handleResetDefaults}
      isSaving={isSaving}
    >
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingIndicator
            size="large"
            message={`Loading ${meta.label}...`}
          />
        </div>
      ) : (
        <>
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
        </>
      )}
    </SettingsLayout>
  );
};

