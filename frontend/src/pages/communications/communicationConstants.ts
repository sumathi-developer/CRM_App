import type {
  CommunicationChannel,
  EmailFolder,
  EmailMessageItem,
  EmailStatus,
  TemplateCategory,
} from '../../types/communication.types';

export const EMAIL_FOLDER_OPTIONS: Array<{
  value: EmailFolder;
  label: string;
}> = [
  { value: 'ALL', label: 'All Folders' },
  { value: 'INBOX', label: 'Inbox' },
  { value: 'SENT', label: 'Sent' },
  { value: 'DRAFTS', label: 'Drafts' },
  { value: 'ARCHIVE', label: 'Archive' },
  { value: 'TRASH', label: 'Trash' },
];

export const EMAIL_STATUS_OPTIONS: Array<{
  value: EmailStatus;
  label: string;
}> = [
  { value: 'SENT', label: 'Sent' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'OPENED', label: 'Opened' },
  { value: 'CLICKED', label: 'Clicked' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'BOUNCED', label: 'Bounced' },
  { value: 'FAILED', label: 'Failed' },
];

export const TEMPLATE_CATEGORY_OPTIONS: Array<{
  value: TemplateCategory;
  label: string;
}> = [
  { value: 'SALES', label: 'Sales Outreach' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'SUPPORT', label: 'Customer Support' },
  { value: 'GENERAL', label: 'General' },
];

export const COMMUNICATION_CHANNEL_OPTIONS: Array<{
  value: CommunicationChannel;
  label: string;
}> = [
  { value: 'ALL', label: 'All Channels' },
  { value: 'EMAIL', label: 'Emails' },
  { value: 'CALL', label: 'Calls' },
  { value: 'MEETING', label: 'Meetings' },
  { value: 'FOLLOW_UP', label: 'Follow-ups' },
  { value: 'COMMENT', label: 'Internal Comments' },
  { value: 'NOTE', label: 'CRM Notes' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
];

export const DEFAULT_TEMPLATE_TOKENS: Array<{
  token: string;
  label: string;
}> = [
  { token: '{{contact.firstName}}', label: 'Contact First Name' },
  { token: '{{contact.lastName}}', label: 'Contact Last Name' },
  { token: '{{contact.email}}', label: 'Contact Email' },
  { token: '{{lead.title}}', label: 'Lead Title' },
  { token: '{{lead.companyName}}', label: 'Lead Company' },
  { token: '{{deal.title}}', label: 'Deal Title' },
  { token: '{{deal.value}}', label: 'Deal Value' },
  { token: '{{organization.name}}', label: 'Organization Name' },
  { token: '{{user.name}}', label: 'Sender Name' },
  { token: '{{user.email}}', label: 'Sender Email' },
];

export function emailStatusTone(
  status?: string | null,
): 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'slate' {
  switch ((status || '').toUpperCase()) {
    case 'DELIVERED':
    case 'SENT':
    case 'RECEIVED':
      return 'green';
    case 'OPENED':
    case 'CLICKED':
      return 'purple';
    case 'QUEUED':
    case 'DRAFT':
      return 'amber';
    case 'BOUNCED':
    case 'FAILED':
      return 'red';
    default:
      return 'blue';
  }
}

export function channelBadgeTone(
  channel?: string | null,
): 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'slate' {
  switch ((channel || '').toUpperCase()) {
    case 'EMAIL':
      return 'blue';
    case 'CALL':
      return 'green';
    case 'MEETING':
      return 'purple';
    case 'COMMENT':
      return 'amber';
    case 'NOTE':
      return 'slate';
    default:
      return 'blue';
  }
}

export function formatBytes(bytes?: number | null): string {
  const n = Number(bytes || 0);
  if (!n || n <= 0) return '0 KB';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function stripHtmlToText(html?: string | null): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getEmailRelatedLinks(email: EmailMessageItem): Array<{
  entityType: 'Contact' | 'Lead' | 'Deal';
  id: string;
  label: string;
  path: string;
}> {
  const links: Array<{
    entityType: 'Contact' | 'Lead' | 'Deal';
    id: string;
    label: string;
    path: string;
  }> = [];

  if (email.contact || email.contactId) {
    const id = email.contact?.id || email.contactId || '';
    if (id) {
      const name = email.contact
        ? `${email.contact.firstName || ''} ${email.contact.lastName || ''}`.trim()
        : '';
      links.push({
        entityType: 'Contact',
        id,
        label: name || email.contact?.email || 'Linked Contact',
        path: `/contacts/${id}`,
      });
    }
  }

  if (email.lead || email.leadId) {
    const id = email.lead?.id || email.leadId || '';
    if (id) {
      links.push({
        entityType: 'Lead',
        id,
        label: email.lead?.title || 'Linked Lead',
        path: `/leads/${id}`,
      });
    }
  }

  if (email.deal || email.dealId) {
    const id = email.deal?.id || email.dealId || '';
    if (id) {
      links.push({
        entityType: 'Deal',
        id,
        label: email.deal?.title || 'Linked Deal',
        path: `/deals/${id}`,
      });
    }
  }

  return links;
}

