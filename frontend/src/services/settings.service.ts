import { api } from './api';
import { workspaceService } from './workspace.service';
import { leadService } from './lead.service';
import { dealService } from './deal.service';
import { pipelineService } from './pipeline.service';
import { DEFAULT_SETTINGS_BUNDLE } from '../pages/settings/settingsConstants';
import type { User } from '../types/auth.types';
import type {
  AllSettingsBundle,
  SettingsScreenSlug,
  SystemSettingRecord,
} from '../types/settings.types';

const LOCAL_SETTINGS_STORAGE_KEY = 'crm_module_settings_bundle_v1';

function readLocalSettings(): Partial<AllSettingsBundle> {
  try {
    const raw = window.localStorage.getItem(LOCAL_SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<AllSettingsBundle>;
  } catch {
    return {};
  }
}

function writeLocalSettings<K extends SettingsScreenSlug>(
  section: K,
  value: AllSettingsBundle[K],
): void {
  try {
    const current = readLocalSettings();
    const updated = { ...current, [section]: value };
    window.localStorage.setItem(
      LOCAL_SETTINGS_STORAGE_KEY,
      JSON.stringify(updated),
    );
  } catch {
    // Ignore storage errors
  }
}

function unwrap<T = any>(res: any): T {
  if (
    res &&
    typeof res === 'object' &&
    'data' in res &&
    !Array.isArray(res.data)
  ) {
    return res.data as T;
  }
  return res as T;
}

class SettingsApiService {
  /**
   * Load settings for a given screen from backend APIs + persisted settings.
   */
  async loadScreenSettings<K extends SettingsScreenSlug>(
    screen: K,
    context?: {
      workspaceId?: string;
      user?: User | null;
    },
  ): Promise<AllSettingsBundle[K]> {
    const local = readLocalSettings();
    const fallback = {
      ...DEFAULT_SETTINGS_BUNDLE[screen],
      ...(local[screen] || {}),
    } as AllSettingsBundle[K];

    // 1. Try reading system key-value setting if available
    try {
      const sysRes = await api.get<any>('/settings').catch(() => null);
      const list: SystemSettingRecord[] = Array.isArray(sysRes)
        ? sysRes
        : Array.isArray(sysRes?.data)
          ? sysRes.data
          : [];
      const matching = list.find((item) => item.key === `crm_settings_${screen}`);
      if (matching?.value) {
        const parsed = JSON.parse(matching.value);
        Object.assign(fallback as object, parsed);
      }
    } catch {
      // Non-admin users may not have access to global /settings table; continue with specific endpoints
    }

    // 2. Load screen-specific API data
    try {
      if (screen === 'account' && context?.user) {
        return {
          ...(fallback as AllSettingsBundle['account']),
          email: context.user.email || DEFAULT_SETTINGS_BUNDLE.account.email,
          roleName:
            context.user.role?.name || DEFAULT_SETTINGS_BUNDLE.account.roleName,
          organizationName:
            context.user.organization?.name ||
            DEFAULT_SETTINGS_BUNDLE.account.organizationName,
        } as AllSettingsBundle[K];
      }

      if (screen === 'profile') {
        const profRes = await api.get<any>('/settings/profile').catch(() => null);
        const prof = unwrap<any>(profRes);
        return {
          ...(fallback as AllSettingsBundle['profile']),
          name: context?.user?.name || (fallback as AllSettingsBundle['profile']).name,
          phone:
            context?.user?.phone || (fallback as AllSettingsBundle['profile']).phone,
          theme:
            prof?.theme === 'dark' || prof?.theme === 'system'
              ? prof.theme
              : 'light',
          language: prof?.language || 'en',
          timezone: prof?.timezone || 'America/New_York',
        } as AllSettingsBundle[K];
      }

      if (screen === 'notifications') {
        const notifRes = await api
          .get<any>('/settings/notifications')
          .catch(() => null);
        const notif = unwrap<any>(notifRes);
        return {
          ...(fallback as AllSettingsBundle['notifications']),
          emailNotifications:
            notif?.emailNotifications ??
            (fallback as AllSettingsBundle['notifications']).emailNotifications,
          pushNotifications:
            notif?.pushNotifications ??
            (fallback as AllSettingsBundle['notifications']).pushNotifications,
        } as AllSettingsBundle[K];
      }

      if (screen === 'workspace' && context?.workspaceId) {
        const [ws, wsSettings] = await Promise.all([
          workspaceService.getWorkspace(context.workspaceId).catch(() => null),
          workspaceService.getSettings(context.workspaceId).catch(() => null),
        ]);
        const base = fallback as AllSettingsBundle['workspace'];
        return {
          ...base,
          name: ws?.name || base.name,
          slug: ws?.slug || base.slug,
          description: ws?.description || base.description,
          website: ws?.website || base.website,
          companyName: wsSettings?.general?.companyName || base.companyName,
          industry: wsSettings?.general?.industry || base.industry,
          supportEmail: wsSettings?.general?.supportEmail || base.supportEmail,
          primaryColor: wsSettings?.branding?.primaryColor || base.primaryColor,
          accentColor: wsSettings?.branding?.accentColor || base.accentColor,
          weeklyWorkspaceDigest:
            wsSettings?.preferences?.weeklyDigest ?? base.weeklyWorkspaceDigest,
        } as AllSettingsBundle[K];
      }

      if (screen === 'general' && context?.workspaceId) {
        const wsSettings = await workspaceService
          .getSettings(context.workspaceId)
          .catch(() => null);
        const base = fallback as AllSettingsBundle['general'];
        return {
          ...base,
          defaultCurrency:
            wsSettings?.localization?.currency || base.defaultCurrency,
          defaultTimezone:
            wsSettings?.localization?.timezone || base.defaultTimezone,
          dateFormat: wsSettings?.localization?.dateFormat || base.dateFormat,
          timeFormat:
            (wsSettings?.localization?.timeFormat as '12h' | '24h') ||
            base.timeFormat,
        } as AllSettingsBundle[K];
      }

      if (screen === 'leads') {
        const leadCfg = await leadService.getSettings().catch(() => null);
        const base = fallback as AllSettingsBundle['leads'];
        if (leadCfg) {
          return {
            ...base,
            defaultStatus: leadCfg.defaultStatus || base.defaultStatus,
            defaultSource: leadCfg.defaultSource || base.defaultSource,
            defaultView: leadCfg.defaultView || base.defaultView,
            hotScoreThreshold:
              leadCfg.hotScoreThreshold ?? base.hotScoreThreshold,
            warmScoreThreshold:
              leadCfg.warmScoreThreshold ?? base.warmScoreThreshold,
            autoAssignNewLeads:
              leadCfg.autoRouteOnCreate ?? base.autoAssignNewLeads,
            duplicateEmailCheck:
              leadCfg.preventDuplicateEmails ?? base.duplicateEmailCheck,
            autoCreateDealOnConvert:
              leadCfg.autoCreateDealOnConversion ?? base.autoCreateDealOnConvert,
          } as AllSettingsBundle[K];
        }
      }

      if (screen === 'deals') {
        const dealCfg = await dealService.getSettings().catch(() => null);
        const base = fallback as AllSettingsBundle['deals'];
        if (dealCfg) {
          return {
            ...base,
            defaultCurrency: dealCfg.defaultCurrency || base.defaultCurrency,
            defaultView: dealCfg.defaultView || base.defaultView,
            defaultProbability:
              dealCfg.defaultProbability ?? base.defaultProbability,
            requireLostReason:
              dealCfg.requireNoteOnLost ?? base.requireLostReason,
            celebrateWonDeals:
              dealCfg.celebrateWonDeals ?? base.celebrateWonDeals,
          } as AllSettingsBundle[K];
        }
      }

      if (screen === 'pipelines') {
        const pipeCfg = await pipelineService.getSettings().catch(() => null);
        const base = fallback as AllSettingsBundle['pipelines'];
        if (pipeCfg) {
          return {
            ...base,
            defaultViewMode: pipeCfg.defaultView || base.defaultViewMode,
            autoUpdateProbabilityByStage:
              pipeCfg.autoSyncProbabilityWithStage ??
              base.autoUpdateProbabilityByStage,
            showWeightedValueOnCards:
              pipeCfg.showWeightedValue ?? base.showWeightedValueOnCards,
            rottingDealDaysWarning:
              pipeCfg.rottenDealDays ?? base.rottingDealDaysWarning,
          } as AllSettingsBundle[K];
        }
      }

      if (screen === 'security' && context?.workspaceId) {
        const wsSettings = await workspaceService
          .getSettings(context.workspaceId)
          .catch(() => null);
        const base = fallback as AllSettingsBundle['security'];
        if (wsSettings?.security) {
          return {
            ...base,
            enforceTwoFactor:
              wsSettings.security.enforceTwoFactor ?? base.enforceTwoFactor,
            sessionTimeoutMinutes:
              wsSettings.security.sessionTimeoutMinutes ??
              base.sessionTimeoutMinutes,
            allowedEmailDomains: Array.isArray(
              wsSettings.security.allowedEmailDomains,
            )
              ? wsSettings.security.allowedEmailDomains.join(', ')
              : base.allowedEmailDomains,
            ipAllowlist: Array.isArray(wsSettings.security.ipAllowlist)
              ? wsSettings.security.ipAllowlist.join(', ')
              : base.ipAllowlist,
          } as AllSettingsBundle[K];
        }
      }
    } catch {
      // Fallback to local/default
    }

    return fallback;
  }

  /**
   * Save settings for a given screen through backend APIs + local persistence.
   */
  async saveScreenSettings<K extends SettingsScreenSlug>(
    screen: K,
    data: AllSettingsBundle[K],
    context?: {
      workspaceId?: string;
      updateUserProfile?: (payload: {
        name: string;
        phone?: string;
      }) => Promise<unknown>;
    },
  ): Promise<AllSettingsBundle[K]> {
    // Always persist locally for instant consistency
    writeLocalSettings(screen, data);

    // 1. Call dedicated backend endpoints where applicable
    if (screen === 'profile') {
      const prof = data as AllSettingsBundle['profile'];
      await api.patch('/settings/profile', {
        theme: prof.theme,
        language: prof.language,
        timezone: prof.timezone,
      });
      if (context?.updateUserProfile && prof.name.trim()) {
        await context.updateUserProfile({
          name: prof.name.trim(),
          phone: prof.phone.trim() || undefined,
        });
      }
    } else if (screen === 'notifications') {
      const notif = data as AllSettingsBundle['notifications'];
      await api.patch('/settings/notifications', {
        emailNotifications: notif.emailNotifications,
        pushNotifications: notif.pushNotifications,
      });
    } else if (screen === 'workspace' && context?.workspaceId) {
      const ws = data as AllSettingsBundle['workspace'];
      await Promise.all([
        workspaceService
          .updateWorkspace(context.workspaceId, {
            name: ws.name,
            description: ws.description,
            website: ws.website,
          })
          .catch(() => null),
        workspaceService
          .updateSettings(context.workspaceId, {
            general: {
              companyName: ws.companyName,
              industry: ws.industry,
              supportEmail: ws.supportEmail,
            },
          })
          .catch(() => null),
        workspaceService
          .updateBranding(context.workspaceId, {
            primaryColor: ws.primaryColor,
            accentColor: ws.accentColor,
          })
          .catch(() => null),
      ]);
    } else if (screen === 'general' && context?.workspaceId) {
      const gen = data as AllSettingsBundle['general'];
      await workspaceService
        .updateLocalization(context.workspaceId, {
          currency: gen.defaultCurrency,
          timezone: gen.defaultTimezone,
          dateFormat: gen.dateFormat,
          timeFormat: gen.timeFormat,
        })
        .catch(() => null);
    } else if (screen === 'leads') {
      const l = data as AllSettingsBundle['leads'];
      await leadService
        .saveSettings({
          defaultStatus: l.defaultStatus as any,
          defaultSource: l.defaultSource as any,
          defaultView: l.defaultView,
          pageSize: 20,
          hotScoreThreshold: l.hotScoreThreshold,
          warmScoreThreshold: l.warmScoreThreshold,
          requireQualifiedForConversion: false,
          autoCreateDealOnConversion: l.autoCreateDealOnConvert,
          preventDuplicateEmails: l.duplicateEmailCheck,
          autoScoreOnCreate: true,
          autoRouteOnCreate: l.autoAssignNewLeads,
        })
        .catch(() => null);
    } else if (screen === 'deals') {
      const d = data as AllSettingsBundle['deals'];
      await dealService
        .saveSettings({
          defaultCurrency: d.defaultCurrency,
          defaultView: d.defaultView,
          defaultProbability: d.defaultProbability,
          pageSize: 25,
          showWeightedValue: true,
          requireNoteOnLost: d.requireLostReason,
          celebrateWonDeals: d.celebrateWonDeals,
        })
        .catch(() => null);
    } else if (screen === 'pipelines') {
      const p = data as AllSettingsBundle['pipelines'];
      await pipelineService
        .saveSettings({
          defaultView: p.defaultViewMode,
          defaultCurrency: 'USD',
          showWeightedValue: p.showWeightedValueOnCards,
          showStageProbabilityBar: true,
          enableDragAndDrop: true,
          rottenDealDays: p.rottingDealDaysWarning,
          autoSyncProbabilityWithStage: p.autoUpdateProbabilityByStage,
        })
        .catch(() => null);
    } else if (screen === 'security' && context?.workspaceId) {
      const sec = data as AllSettingsBundle['security'];
      await workspaceService
        .updateSecurity(context.workspaceId, {
          enforceTwoFactor: sec.enforceTwoFactor,
          sessionTimeoutMinutes: sec.sessionTimeoutMinutes,
          allowedEmailDomains: sec.allowedEmailDomains
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          ipAllowlist: sec.ipAllowlist
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        })
        .catch(() => null);
    }

    // 2. Also upsert into /settings key-value store when user has ADMIN role
    await api
      .patch('/settings', {
        key: `crm_settings_${screen}`,
        value: JSON.stringify(data),
        category: screen.toUpperCase(),
        isPublic: false,
      })
      .catch(() => null);

    return data;
  }
}

export const settingsService = new SettingsApiService();
export default settingsService;

