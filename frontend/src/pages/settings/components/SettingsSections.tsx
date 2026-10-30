import React from 'react';
import { SectionCard } from '../../lead-generation/components/Cards';
import { Field, Toggle } from '../../lead-generation/components/FormParts';
import {
  CURRENCY_SELECT_OPTIONS,
  LANGUAGE_SELECT_OPTIONS,
  TIMEZONE_SELECT_OPTIONS,
} from '../settingsConstants';
import type {
  AccountSettingsState,
  ActivitySettingsState,
  CompanySettingsState,
  ContactSettingsState,
  DealSettingsFormState,
  EmailSettingsState,
  GeneralSettingsState,
  IntegrationSettingsState,
  LeadSettingsFormState,
  NotificationSettingsState,
  PipelineSettingsFormState,
  ProfileSettingsState,
  SecuritySettingsState,
  WorkspaceSettingsFormState,
} from '../../../types/settings.types';

/* ==========================================================================
   1. Account Settings Section
   ========================================================================== */
interface AccountSectionProps {
  value: AccountSettingsState;
  onChange: (patch: Partial<AccountSettingsState>) => void;
}

export const AccountSettingsSection: React.FC<AccountSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Account Identity & Role"
      subtitle="Your authenticated credentials, access level, and organization assignment."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email Address">
          <input
            type="email"
            value={value.email}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
          />
        </Field>

        <Field label="Assigned System Role">
          <input
            type="text"
            value={value.roleName}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
          />
        </Field>

        <Field label="Organization">
          <input
            type="text"
            value={value.organizationName}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
          />
        </Field>

        <Field label="Account Status">
          <input
            type="text"
            value={value.accountStatus}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
          />
        </Field>
      </div>
    </SectionCard>

    <SectionCard
      title="Application & Navigation Preferences"
      subtitle="Customize default landing page and interface behavior for your user session."
    >
      <div className="space-y-4">
        <Field
          label="Default Landing Page"
          hint="Where you are redirected after logging in."
        >
          <select
            value={value.defaultLandingPage}
            onChange={(e) => onChange({ defaultLandingPage: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="/dashboard">Overview Dashboard (/dashboard)</option>
            <option value="/leads">Leads Explorer (/leads)</option>
            <option value="/deals">Deals Board (/deals)</option>
            <option value="/contacts">Contacts (/contacts)</option>
            <option value="/activities">Activities (/activities)</option>
            <option value="/calendar">Calendar (/calendar)</option>
            <option value="/communications">Communications (/communications)</option>
          </select>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle
            label="Compact Sidebar"
            description="Use icon-only mode in large screen viewports."
            checked={value.compactSidebar}
            onChange={(checked) => onChange({ compactSidebar: checked })}
          />
          <Toggle
            label="Keyboard Shortcuts"
            description="Enable global hotkeys like quick search and dialog triggers."
            checked={value.keyboardShortcuts}
            onChange={(checked) => onChange({ keyboardShortcuts: checked })}
          />
          <Toggle
            label="Auto-Save Drafts"
            description="Automatically preserve email and comment drafts in local storage."
            checked={value.autoSaveDrafts}
            onChange={(checked) => onChange({ autoSaveDrafts: checked })}
          />
          <Toggle
            label="Session Expiration Warnings"
            description="Display warning banner 5 minutes before authentication token expiry."
            checked={value.sessionAlerts}
            onChange={(checked) => onChange({ sessionAlerts: checked })}
          />
        </div>
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   2. Profile Settings Section
   ========================================================================== */
interface ProfileSectionProps {
  value: ProfileSettingsState;
  onChange: (patch: Partial<ProfileSettingsState>) => void;
}

export const ProfileSettingsSection: React.FC<ProfileSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Personal Information"
      subtitle="Public profile details displayed across activities, comments, and team leaderboards."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" required>
          <input
            type="text"
            value={value.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="John Doe"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Phone Number">
          <input
            type="tel"
            value={value.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Job Title">
          <input
            type="text"
            value={value.jobTitle}
            onChange={(e) => onChange({ jobTitle: e.target.value })}
            placeholder="Senior Account Executive"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Department">
          <input
            type="text"
            value={value.department}
            onChange={(e) => onChange({ department: e.target.value })}
            placeholder="Sales & Business Development"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>
      </div>
    </SectionCard>

    <SectionCard
      title="Regional & Interface Preferences"
      subtitle="Personal theme, display language, and active timezone for event timestamps."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Interface Theme">
          <select
            value={value.theme}
            onChange={(e) =>
              onChange({ theme: e.target.value as 'light' | 'dark' | 'system' })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="light">Light Theme</option>
            <option value="dark">Dark Theme</option>
            <option value="system">System Default</option>
          </select>
        </Field>

        <Field label="Language">
          <select
            value={value.language}
            onChange={(e) => onChange({ language: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            {LANGUAGE_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Personal Timezone">
          <select
            value={value.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            {TIMEZONE_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   3. Workspace Settings Section
   ========================================================================== */
interface WorkspaceSectionProps {
  value: WorkspaceSettingsFormState;
  onChange: (patch: Partial<WorkspaceSettingsFormState>) => void;
}

export const WorkspaceSettingsSection: React.FC<WorkspaceSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Workspace Identity"
      subtitle="Unique workspace name, subdomain identifier, and customer-facing company profile."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Workspace Name" required>
          <input
            type="text"
            value={value.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Workspace Slug (Identifier)">
          <input
            type="text"
            value={value.slug}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
          />
        </Field>

        <Field label="Company Name">
          <input
            type="text"
            value={value.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Industry Sector">
          <input
            type="text"
            value={value.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Company Website">
          <input
            type="url"
            value={value.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://acme.example.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Support / Inquiries Email">
          <input
            type="email"
            value={value.supportEmail}
            onChange={(e) => onChange({ supportEmail: e.target.value })}
            placeholder="support@acme.example.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Workspace Description">
          <textarea
            value={value.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>
      </div>
    </SectionCard>

    <SectionCard
      title="Brand Accent Colors"
      subtitle="Workspace theme styling used across headers, badges, and progress tracks."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Primary Theme Color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value.primaryColor}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              className="h-9 w-14 cursor-pointer rounded border border-gray-300 p-0.5"
            />
            <input
              type="text"
              value={value.primaryColor}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              className="w-36 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 uppercase"
            />
          </div>
        </Field>

        <Field label="Secondary Accent Color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value.accentColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="h-9 w-14 cursor-pointer rounded border border-gray-300 p-0.5"
            />
            <input
              type="text"
              value={value.accentColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="w-36 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 uppercase"
            />
          </div>
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <Toggle
          label="Allow Member Invitations"
          description="Permit team managers to invite new workspace collaborators."
          checked={value.allowMemberInvites}
          onChange={(checked) => onChange({ allowMemberInvites: checked })}
        />
        <Toggle
          label="Weekly Workspace Digest"
          description="Send weekly consolidated summary of closed revenue and newly captured leads."
          checked={value.weeklyWorkspaceDigest}
          onChange={(checked) => onChange({ weeklyWorkspaceDigest: checked })}
        />
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   4. General Settings Section
   ========================================================================== */
interface GeneralSectionProps {
  value: GeneralSettingsState;
  onChange: (patch: Partial<GeneralSettingsState>) => void;
}

export const GeneralSettingsSection: React.FC<GeneralSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Application & Currency Localization"
      subtitle="Default monetary currency and date/time formatting rules."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Application Title">
          <input
            type="text"
            value={value.applicationName}
            onChange={(e) => onChange({ applicationName: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="System Default Currency">
          <select
            value={value.defaultCurrency}
            onChange={(e) => onChange({ defaultCurrency: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            {CURRENCY_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Default Timezone">
          <select
            value={value.defaultTimezone}
            onChange={(e) => onChange({ defaultTimezone: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            {TIMEZONE_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date Format">
          <select
            value={value.dateFormat}
            onChange={(e) => onChange({ dateFormat: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-30)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (10/30/2026)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (30/10/2026)</option>
            <option value="MMM D, YYYY">MMM D, YYYY (Oct 30, 2026)</option>
          </select>
        </Field>

        <Field label="Time Format">
          <select
            value={value.timeFormat}
            onChange={(e) =>
              onChange({ timeFormat: e.target.value as '12h' | '24h' })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="24h">24-hour clock (14:30)</option>
            <option value="12h">12-hour clock (2:30 PM)</option>
          </select>
        </Field>

        <Field label="Fiscal Year Start Month">
          <select
            value={value.fiscalYearStartMonth}
            onChange={(e) => onChange({ fiscalYearStartMonth: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="JANUARY">January (Calendar Year)</option>
            <option value="APRIL">April (Q1 starts Apr 1)</option>
            <option value="JULY">July (Q1 starts Jul 1)</option>
            <option value="OCTOBER">October (Q1 starts Oct 1)</option>
          </select>
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <Toggle
          label="Enable Global Audit Logging"
          description="Log all entity creates, updates, and deletes for enterprise compliance."
          checked={value.enableGlobalAuditLog}
          onChange={(checked) => onChange({ enableGlobalAuditLog: checked })}
        />
        <Toggle
          label="Recycle Bin & Soft-Delete"
          description="Retain deleted records for 30 days before permanent purging."
          checked={value.enableRecycleBin}
          onChange={(checked) => onChange({ enableRecycleBin: checked })}
        />
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   5. Lead Settings Section
   ========================================================================== */
interface LeadSectionProps {
  value: LeadSettingsFormState;
  onChange: (patch: Partial<LeadSettingsFormState>) => void;
}

export const LeadSettingsSection: React.FC<LeadSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Lead Defaults & View Preferences"
      subtitle="Default initial status, acquisition channel, and primary explorer view."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Default Lead Status">
          <select
            value={value.defaultStatus}
            onChange={(e) => onChange({ defaultStatus: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNQUALIFIED">Unqualified</option>
          </select>
        </Field>

        <Field label="Default Lead Source">
          <select
            value={value.defaultSource}
            onChange={(e) => onChange({ defaultSource: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="EMAIL_CAMPAIGN">Email Campaign</option>
            <option value="PAID_ADS">Paid Ads</option>
            <option value="COLD_CALL">Cold Call</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>

        <Field label="Default Explorer Layout">
          <select
            value={value.defaultView}
            onChange={(e) =>
              onChange({
                defaultView: e.target.value as 'list' | 'board' | 'table',
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="list">List Cards</option>
            <option value="board">Kanban Board</option>
            <option value="table">Data Table</option>
          </select>
        </Field>
      </div>
    </SectionCard>

    <SectionCard
      title="Lead Scoring & Qualification Thresholds"
      subtitle="Configure Hot and Warm tier thresholds used by AI scoring and qualification algorithms."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Hot Lead Score Threshold"
          hint="Leads with scores at or above this value receive priority attention."
        >
          <input
            type="number"
            min={50}
            max={100}
            value={value.hotScoreThreshold}
            onChange={(e) =>
              onChange({ hotScoreThreshold: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field
          label="Warm Lead Score Threshold"
          hint="Minimum score to flag as a warm prospect."
        >
          <input
            type="number"
            min={10}
            max={80}
            value={value.warmScoreThreshold}
            onChange={(e) =>
              onChange({ warmScoreThreshold: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <Toggle
          label="Auto-Assign New Leads via Routing Rules"
          description="Immediately distribute incoming leads using active round-robin or territory assignment rules."
          checked={value.autoAssignNewLeads}
          onChange={(checked) => onChange({ autoAssignNewLeads: checked })}
        />
        <Toggle
          label="Duplicate Email Detection"
          description="Warn users when capturing a lead whose email address already exists in Leads or Contacts."
          checked={value.duplicateEmailCheck}
          onChange={(checked) => onChange({ duplicateEmailCheck: checked })}
        />
        <Toggle
          label="Require Company Name on Lead Creation"
          description="Enforce organizational attribution during manual lead creation."
          checked={value.requireCompanyOnCreate}
          onChange={(checked) => onChange({ requireCompanyOnCreate: checked })}
        />
        <Toggle
          label="Auto-Create Deal on Conversion"
          description="Prompt and pre-fill deal opportunity form automatically upon lead qualification."
          checked={value.autoCreateDealOnConvert}
          onChange={(checked) =>
            onChange({ autoCreateDealOnConvert: checked })
          }
        />
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   6. Contact Settings Section
   ========================================================================== */
interface ContactSectionProps {
  value: ContactSettingsState;
  onChange: (patch: Partial<ContactSettingsState>) => void;
}

export const ContactSettingsSection: React.FC<ContactSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Contact Lifecycle & Defaults"
      subtitle="Default customer lifecycle stages, layout styles, and validation rules."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Default Lifecycle Stage">
          <select
            value={value.defaultLifecycleStage}
            onChange={(e) =>
              onChange({
                defaultLifecycleStage: e.target.value as
                  | 'LEAD'
                  | 'OPPORTUNITY'
                  | 'CUSTOMER'
                  | 'CHURNED',
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="LEAD">Lead Stage</option>
            <option value="OPPORTUNITY">Opportunity Stage</option>
            <option value="CUSTOMER">Customer Stage</option>
            <option value="CHURNED">Churned</option>
          </select>
        </Field>

        <Field label="Default View Mode">
          <select
            value={value.defaultView}
            onChange={(e) =>
              onChange({ defaultView: e.target.value as 'list' | 'table' })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="list">Card List View</option>
            <option value="table">Tabular Grid View</option>
          </select>
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <Toggle
          label="Require Email Address on Contact Create"
          description="Ensure every contact record contains a valid primary email."
          checked={value.requireEmailOnCreate}
          onChange={(checked) => onChange({ requireEmailOnCreate: checked })}
        />
        <Toggle
          label="Require Phone Number on Contact Create"
          description="Mandate direct contact phone numbers for outbound calling."
          checked={value.requirePhoneOnCreate}
          onChange={(checked) => onChange({ requirePhoneOnCreate: checked })}
        />
        <Toggle
          label="Enforce Unique Email Addresses"
          description="Prevent duplicate contact entries sharing the exact same email address."
          checked={value.enforceUniqueEmail}
          onChange={(checked) => onChange({ enforceUniqueEmail: checked })}
        />
        <Toggle
          label="Auto-Link Company by Email Domain"
          description="Automatically associate new contacts with existing companies sharing the email domain."
          checked={value.autoLinkCompanyByDomain}
          onChange={(checked) =>
            onChange({ autoLinkCompanyByDomain: checked })
          }
        />
        <Toggle
          label="Enable Unified Contact Activity Timeline"
          description="Stream all calls, emails, meetings, and notes in the contact detail screen."
          checked={value.enableContactActivityTimeline}
          onChange={(checked) =>
            onChange({ enableContactActivityTimeline: checked })
          }
        />
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   7. Company Settings Section
   ========================================================================== */
interface CompanySectionProps {
  value: CompanySettingsState;
  onChange: (patch: Partial<CompanySettingsState>) => void;
}

export const CompanySettingsSection: React.FC<CompanySectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Company & Organization Rules"
      subtitle="Organizational hierarchy defaults, duplicate rules, and owner cascading policies."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Default Company Status">
          <select
            value={value.defaultCompanyStatus}
            onChange={(e) =>
              onChange({
                defaultCompanyStatus: e.target.value as 'ACTIVE' | 'INACTIVE',
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="ACTIVE">Active Account</option>
            <option value="INACTIVE">Inactive Account</option>
          </select>
        </Field>

        <Field label="Default Industry Classification">
          <input
            type="text"
            value={value.defaultIndustrySector}
            onChange={(e) =>
              onChange({ defaultIndustrySector: e.target.value })
            }
            placeholder="Software & Technology"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <Toggle
          label="Require Domain URL on Company Creation"
          description="Mandate website domain (e.g. acme.com) to prevent ambiguous organization names."
          checked={value.requireDomainOnCreate}
          onChange={(checked) => onChange({ requireDomainOnCreate: checked })}
        />
        <Toggle
          label="Automatic Domain Data Enrichment"
          description="Extract company domain metadata and logos from website URLs."
          checked={value.autoEnrichFromDomain}
          onChange={(checked) => onChange({ autoEnrichFromDomain: checked })}
        />
        <Toggle
          label="Allow Duplicate Company Names"
          description="Allow identically named company entries if operating in distinct jurisdictions."
          checked={value.allowDuplicateCompanyNames}
          onChange={(checked) =>
            onChange({ allowDuplicateCompanyNames: checked })
          }
        />
        <Toggle
          label="Cascade Company Owner to Associated Contacts"
          description="When changing a company account owner, automatically update linked contact owners."
          checked={value.cascadeOwnerToContacts}
          onChange={(checked) =>
            onChange({ cascadeOwnerToContacts: checked })
          }
        />
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   8. Deal Settings Section
   ========================================================================== */
interface DealSectionProps {
  value: DealSettingsFormState;
  onChange: (patch: Partial<DealSettingsFormState>) => void;
}

export const DealSettingsSection: React.FC<DealSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Deal Defaults & Stale Opportunity Warnings"
      subtitle="Currency defaults, initial probabilities, and rotting deal detection."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Deal Currency">
          <select
            value={value.defaultCurrency}
            onChange={(e) => onChange({ defaultCurrency: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            {CURRENCY_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Default Initial Probability (%)">
          <input
            type="number"
            min={0}
            max={100}
            value={value.defaultProbability}
            onChange={(e) =>
              onChange({ defaultProbability: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Default Layout View">
          <select
            value={value.defaultView}
            onChange={(e) =>
              onChange({
                defaultView: e.target.value as 'list' | 'board' | 'table',
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="board">Kanban Board View</option>
            <option value="list">List Cards View</option>
            <option value="table">Table Grid View</option>
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field
          label="Stale Deal Warning Threshold (Days)"
          hint="Flag deals with no logged activity for more than this number of days as stale/rotting."
        >
          <input
            type="number"
            min={1}
            max={90}
            value={value.staleDealThresholdDays}
            onChange={(e) =>
              onChange({ staleDealThresholdDays: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none sm:w-64"
          />
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <Toggle
          label="Require Expected Close Date on Deal Create"
          description="Mandate target closing date to power accurate revenue forecast projections."
          checked={value.requireExpectedCloseDate}
          onChange={(checked) =>
            onChange({ requireExpectedCloseDate: checked })
          }
        />
        <Toggle
          label="Require Linked Contact or Organization"
          description="Prevent orphaned deals not attached to any customer identity."
          checked={value.requireContactOrCompany}
          onChange={(checked) =>
            onChange({ requireContactOrCompany: checked })
          }
        />
        <Toggle
          label="Mandate Lost Reason on Deal Closed-Lost"
          description="Require reps to record competitive or budget loss reasons for analytics reporting."
          checked={value.requireLostReason}
          onChange={(checked) => onChange({ requireLostReason: checked })}
        />
        <Toggle
          label="Celebrate Won Deals with UI Confetti"
          description="Show celebratory feedback when an opportunity is moved into Closed-Won."
          checked={value.celebrateWonDeals}
          onChange={(checked) => onChange({ celebrateWonDeals: checked })}
        />
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   9. Pipeline Settings Section
   ========================================================================== */
interface PipelineSectionProps {
  value: PipelineSettingsFormState;
  onChange: (patch: Partial<PipelineSettingsFormState>) => void;
}

export const PipelineSettingsSection: React.FC<PipelineSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Sales Pipeline Governance & Automation"
      subtitle="Stage movement policies, probability synchronization, and weighted pipeline values."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Default Pipeline Layout">
          <select
            value={value.defaultViewMode}
            onChange={(e) =>
              onChange({
                defaultViewMode: e.target.value as 'board' | 'list' | 'table',
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="board">Kanban Columns</option>
            <option value="list">Stage Groups List</option>
            <option value="table">Table View</option>
          </select>
        </Field>

        <Field
          label="Rotting Deal Warning Indicator (Days)"
          hint="Days without stage transition before showing visual rotting pill."
        >
          <input
            type="number"
            min={3}
            max={120}
            value={value.rottingDealDaysWarning}
            onChange={(e) =>
              onChange({ rottingDealDaysWarning: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <Toggle
          label="Enforce Sequential Stage Progression"
          description="Prevent skipping intermediate stages when advancing opportunities."
          checked={value.enforceSequentialStageMovement}
          onChange={(checked) =>
            onChange({ enforceSequentialStageMovement: checked })
          }
        />
        <Toggle
          label="Auto-Update Deal Probability by Stage"
          description="Automatically sync deal win probability when dragged to a new stage."
          checked={value.autoUpdateProbabilityByStage}
          onChange={(checked) =>
            onChange({ autoUpdateProbabilityByStage: checked })
          }
        />
        <Toggle
          label="Display Weighted Deal Values on Cards"
          description="Show probability-adjusted dollar amounts directly on pipeline kanban cards."
          checked={value.showWeightedValueOnCards}
          onChange={(checked) =>
            onChange({ showWeightedValueOnCards: checked })
          }
        />
        <Toggle
          label="Allow Multiple Sales Pipelines"
          description="Enable distinct sales processes (e.g. Enterprise, Self-Serve, Renewals)."
          checked={value.allowMultiplePipelines}
          onChange={(checked) => onChange({ allowMultiplePipelines: checked })}
        />
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   10. Activity Settings Section
   ========================================================================== */
interface ActivitySectionProps {
  value: ActivitySettingsState;
  onChange: (patch: Partial<ActivitySettingsState>) => void;
}

export const ActivitySettingsSection: React.FC<ActivitySectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Activity Defaults & Meeting Scheduling"
      subtitle="Standard reminder offsets, duration presets, and calendar synchronization."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Default Activity Type">
          <select
            value={value.defaultActivityType}
            onChange={(e) =>
              onChange({
                defaultActivityType: e.target.value as
                  | 'CALL'
                  | 'MEETING'
                  | 'EMAIL'
                  | 'FOLLOW_UP'
                  | 'WHATSAPP',
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="CALL">Phone Call</option>
            <option value="MEETING">Meeting</option>
            <option value="EMAIL">Email</option>
            <option value="FOLLOW_UP">Follow-Up Task</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </Field>

        <Field label="Default Priority">
          <select
            value={value.defaultPriority}
            onChange={(e) =>
              onChange({
                defaultPriority: e.target.value as
                  | 'LOW'
                  | 'MEDIUM'
                  | 'HIGH'
                  | 'URGENT',
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </Field>

        <Field label="Default Reminder Offset (Minutes)">
          <select
            value={value.defaultReminderMinutes}
            onChange={(e) =>
              onChange({ defaultReminderMinutes: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value={5}>5 minutes prior</option>
            <option value={15}>15 minutes prior</option>
            <option value={30}>30 minutes prior</option>
            <option value={60}>1 hour prior</option>
            <option value={1440}>24 hours prior</option>
          </select>
        </Field>

        <Field label="Default Call Duration (Minutes)">
          <input
            type="number"
            min={5}
            max={240}
            value={value.defaultCallDurationMinutes}
            onChange={(e) =>
              onChange({
                defaultCallDurationMinutes: Number(e.target.value),
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Default Meeting Duration (Minutes)">
          <input
            type="number"
            min={15}
            max={480}
            value={value.defaultMeetingDurationMinutes}
            onChange={(e) =>
              onChange({
                defaultMeetingDurationMinutes: Number(e.target.value),
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <Toggle
          label="Auto-Complete Past Meetings"
          description="Automatically mark meetings as completed 2 hours after their scheduled end time."
          checked={value.autoCompletePastMeetings}
          onChange={(checked) =>
            onChange({ autoCompletePastMeetings: checked })
          }
        />
        <Toggle
          label="Auto-Create Follow-Up Task on Missed Call"
          description="Prompt for follow-up callback whenever a call outcome is logged as Unanswered."
          checked={value.createFollowUpTaskOnMissedCall}
          onChange={(checked) =>
            onChange({ createFollowUpTaskOnMissedCall: checked })
          }
        />
        <Toggle
          label="Bi-Directional Calendar Synchronization"
          description="Sync CRM meetings with connected Google Calendar or Microsoft Outlook."
          checked={value.syncActivitiesToCalendar}
          onChange={(checked) =>
            onChange({ syncActivitiesToCalendar: checked })
          }
        />
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   11. Notification Settings Section
   ========================================================================== */
interface NotificationSectionProps {
  value: NotificationSettingsState;
  onChange: (patch: Partial<NotificationSettingsState>) => void;
}

export const NotificationSettingsSection: React.FC<NotificationSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Notification Channels"
      subtitle="Select the media used to deliver your CRM updates."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Toggle
          label="Email Notifications"
          description="Deliver alerts directly to your primary email inbox."
          checked={value.emailNotifications}
          onChange={(checked) => onChange({ emailNotifications: checked })}
        />
        <Toggle
          label="Browser Push Alerts"
          description="Receive instant desktop notifications even when tab is backgrounded."
          checked={value.pushNotifications}
          onChange={(checked) => onChange({ pushNotifications: checked })}
        />
        <Toggle
          label="In-App Banner Notifications"
          description="Display toast banners and notification center counter in top navbar."
          checked={value.inAppNotifications}
          onChange={(checked) => onChange({ inAppNotifications: checked })}
        />
      </div>
    </SectionCard>

    <SectionCard
      title="Event Triggers & Digest Delivery"
      subtitle="Fine-tune which CRM activities send notifications."
    >
      <div className="space-y-3">
        <Toggle
          label="New Lead Assigned"
          description="Notify me whenever a new lead is assigned to my account."
          checked={value.notifyOnNewLeadAssigned}
          onChange={(checked) =>
            onChange({ notifyOnNewLeadAssigned: checked })
          }
        />
        <Toggle
          label="Deal Won or Lost"
          description="Notify me when deals I own or collaborate on transition to Won or Lost."
          checked={value.notifyOnDealWonOrLost}
          onChange={(checked) => onChange({ notifyOnDealWonOrLost: checked })}
        />
        <Toggle
          label="Overdue Activity Warnings"
          description="Send reminder when a scheduled call, meeting, or task passes its due date."
          checked={value.notifyOnActivityOverdue}
          onChange={(checked) =>
            onChange({ notifyOnActivityOverdue: checked })
          }
        />
        <Toggle
          label="Mentions in Internal Comments"
          description="Alert me immediately when a teammate @mentions me in a lead or deal comment."
          checked={value.notifyOnMentionInComment}
          onChange={(checked) =>
            onChange({ notifyOnMentionInComment: checked })
          }
        />
        <Toggle
          label="Daily Morning Agenda Summary"
          description="Send an 8:00 AM summary of today's scheduled meetings and priority calls."
          checked={value.dailyAgendaSummary}
          onChange={(checked) => onChange({ dailyAgendaSummary: checked })}
        />
        <Toggle
          label="Weekly Sales Performance Digest"
          description="Receive a Monday morning leaderboard and activity recap email."
          checked={value.weeklyPerformanceDigest}
          onChange={(checked) =>
            onChange({ weeklyPerformanceDigest: checked })
          }
        />
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   12. Email Settings Section
   ========================================================================== */
interface EmailSectionProps {
  value: EmailSettingsState;
  onChange: (patch: Partial<EmailSettingsState>) => void;
}

export const EmailSettingsSection: React.FC<EmailSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Outbound Sender Configuration"
      subtitle="Sender display names, reply-to routing, and compliance BCC archiving."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Sender Display Name" required>
          <input
            type="text"
            value={value.senderDisplayName}
            onChange={(e) => onChange({ senderDisplayName: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Reply-To Address">
          <input
            type="email"
            value={value.replyToEmail}
            onChange={(e) => onChange({ replyToEmail: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field
          label="Compliance BCC Archiving Address"
          hint="Automatically BCC every outbound CRM email to an archiving inbox."
        >
          <input
            type="email"
            value={value.bccComplianceAddress}
            onChange={(e) =>
              onChange({ bccComplianceAddress: e.target.value })
            }
            placeholder="archive@acme.example.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field label="Daily Outbound Send Limit (per User)">
          <input
            type="number"
            min={10}
            max={2000}
            value={value.dailySendLimitPerUser}
            onChange={(e) =>
              onChange({ dailySendLimitPerUser: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Default Email Signature">
          <textarea
            value={value.defaultSignatureHtml}
            onChange={(e) =>
              onChange({ defaultSignatureHtml: e.target.value })
            }
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white p-2.5 font-mono text-xs text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <Toggle
          label="Track Email Opens"
          description="Embed lightweight tracking beacon to record recipient opens in real time."
          checked={value.trackEmailOpens}
          onChange={(checked) => onChange({ trackEmailOpens: checked })}
        />
        <Toggle
          label="Track Link Clicks"
          description="Rewrite URLs to log link click engagement in the communication stream."
          checked={value.trackLinkClicks}
          onChange={(checked) => onChange({ trackLinkClicks: checked })}
        />
        <Toggle
          label="Auto-Link Incoming Inquiries to Contacts"
          description="Automatically associate inbound email responses with existing contact records."
          checked={value.autoLinkEmailsToContacts}
          onChange={(checked) =>
            onChange({ autoLinkEmailsToContacts: checked })
          }
        />
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   13. Integration Settings Section
   ========================================================================== */
interface IntegrationSectionProps {
  value: IntegrationSettingsState;
  onChange: (patch: Partial<IntegrationSettingsState>) => void;
}

export const IntegrationSettingsSection: React.FC<IntegrationSectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Productivity & Messaging Integrations"
      subtitle="Connect third-party enterprise tools to synchronize communications and alerts."
    >
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              Google Workspace (Gmail &amp; Google Calendar)
            </h4>
            <p className="text-xs text-gray-600">
              Synchronize outbound emails, inbound replies, and calendar events.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                googleWorkspaceConnected: !value.googleWorkspaceConnected,
              })
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              value.googleWorkspaceConnected
                ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {value.googleWorkspaceConnected ? 'Disconnect' : 'Connect Account'}
          </button>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              Microsoft 365 (Outlook &amp; Teams)
            </h4>
            <p className="text-xs text-gray-600">
              Bi-directional calendar scheduling and Exchange email syncing.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                microsoft365Connected: !value.microsoft365Connected,
              })
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              value.microsoft365Connected
                ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {value.microsoft365Connected ? 'Disconnect' : 'Connect Account'}
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                Slack Notifications
              </h4>
              <p className="text-xs text-gray-600">
                Post high-priority lead captures and won deal announcements to Slack.
              </p>
            </div>
            <Toggle
              label="Enable Slack Sync"
              checked={value.slackWebhookEnabled}
              onChange={(checked) =>
                onChange({ slackWebhookEnabled: checked })
              }
            />
          </div>

          {value.slackWebhookEnabled && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              <Field label="Slack Target Channel">
                <input
                  type="text"
                  value={value.slackChannelName}
                  onChange={(e) =>
                    onChange({ slackChannelName: e.target.value })
                  }
                  placeholder="#crm-deal-alerts"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none sm:w-80"
                />
              </Field>
            </div>
          )}
        </div>
      </div>
    </SectionCard>

    <SectionCard
      title="Webhooks & External API Automation"
      subtitle="Send realtime webhook payloads for CRM record mutations."
    >
      <div className="space-y-4">
        <Toggle
          label="Enable Outbound Webhooks"
          description="Send HTTP POST requests when leads, deals, or contacts are updated."
          checked={value.zapierWebhooksEnabled}
          onChange={(checked) => onChange({ zapierWebhooksEnabled: checked })}
        />

        {value.zapierWebhooksEnabled && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Webhook Endpoint URL">
              <input
                type="url"
                value={value.webhookEndpointUrl}
                onChange={(e) =>
                  onChange({ webhookEndpointUrl: e.target.value })
                }
                placeholder="https://hooks.acme.example.com/crm-events"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
              />
            </Field>

            <Field label="Sync Polling Interval (Minutes)">
              <select
                value={value.syncIntervalMinutes}
                onChange={(e) =>
                  onChange({ syncIntervalMinutes: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
              >
                <option value={5}>Every 5 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 1 hour</option>
              </select>
            </Field>
          </div>
        )}
      </div>
    </SectionCard>
  </div>
);

/* ==========================================================================
   14. Security Settings Section
   ========================================================================== */
interface SecuritySectionProps {
  value: SecuritySettingsState;
  onChange: (patch: Partial<SecuritySettingsState>) => void;
}

export const SecuritySettingsSection: React.FC<SecuritySectionProps> = ({
  value,
  onChange,
}) => (
  <div className="space-y-6">
    <SectionCard
      title="Authentication & Session Policies"
      subtitle="Two-factor authentication, session expiration timeouts, and device alerts."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Session Timeout (Minutes)">
          <select
            value={value.sessionTimeoutMinutes}
            onChange={(e) =>
              onChange({ sessionTimeoutMinutes: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          >
            <option value={60}>1 hour</option>
            <option value={240}>4 hours</option>
            <option value={480}>8 hours</option>
            <option value={1440}>24 hours (1 day)</option>
            <option value={10080}>7 days</option>
          </select>
        </Field>

        <Field label="Minimum Password Length">
          <input
            type="number"
            min={8}
            max={32}
            value={value.passwordMinLength}
            onChange={(e) =>
              onChange({ passwordMinLength: Number(e.target.value) })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
        <Toggle
          label="Enforce Two-Factor Authentication (2FA) for All Users"
          description="Require TOTP authenticator app verification on login."
          checked={value.enforceTwoFactor}
          onChange={(checked) => onChange({ enforceTwoFactor: checked })}
        />
        <Toggle
          label="Require Special Characters in Passwords"
          description="Mandate numbers, uppercase letters, and special symbols."
          checked={value.requireSpecialCharacters}
          onChange={(checked) =>
            onChange({ requireSpecialCharacters: checked })
          }
        />
        <Toggle
          label="Alert on New Device / IP Login"
          description="Send security alert email when login occurs from an unverified browser."
          checked={value.notifyOnNewDeviceLogin}
          onChange={(checked) =>
            onChange({ notifyOnNewDeviceLogin: checked })
          }
        />
      </div>
    </SectionCard>

    <SectionCard
      title="Network Access Restrictions & Data Export Governance"
      subtitle="Restrict workspace access to verified corporate domains and IP ranges."
    >
      <div className="space-y-4">
        <Field
          label="Allowed Corporate Email Domains"
          hint="Comma-separated domains permitted for workspace membership (e.g. acme.com, acme.org)."
        >
          <input
            type="text"
            value={value.allowedEmailDomains}
            onChange={(e) => onChange({ allowedEmailDomains: e.target.value })}
            placeholder="acme.com, acme.org"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <Field
          label="IP Address Allowlist (CIDR)"
          hint="Leave blank to allow any IP address. Otherwise enter comma-separated IP CIDR ranges."
        >
          <input
            type="text"
            value={value.ipAllowlist}
            onChange={(e) => onChange({ ipAllowlist: e.target.value })}
            placeholder="192.168.1.0/24, 10.0.0.0/8"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
          />
        </Field>

        <div className="border-t border-gray-100 pt-3">
          <Toggle
            label="Allow CSV / Excel Data Export for Non-Admin Users"
            description="When disabled, only Workspace Administrators may perform bulk CRM exports."
            checked={value.allowDataExportForNonAdmins}
            onChange={(checked) =>
              onChange({ allowDataExportForNonAdmins: checked })
            }
          />
        </div>
      </div>
    </SectionCard>
  </div>
);

