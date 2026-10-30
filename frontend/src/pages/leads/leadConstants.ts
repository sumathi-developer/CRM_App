import type {
  Lead,
  LeadStatus,
  LeadSourceType,
  LeadSortField,
  SortDirection,
  ScoreTier,
  ActivityType,
  ActivityStatus,
  ActivityPriority,
  CreateLeadPayload,
} from '../../types/lead.types';
import type { Option, Tone } from '../lead-generation/leadGenConstants';

export const LEAD_STATUSES: Array<{
  value: LeadStatus;
  label: string;
  tone: Tone;
  description: string;
}> = [
  {
    value: 'NEW',
    label: 'New',
    tone: 'blue',
    description: 'Newly captured lead awaiting initial sales outreach.',
  },
  {
    value: 'CONTACTED',
    label: 'Contacted',
    tone: 'cyan',
    description: 'Initial outreach completed; discovery conversation in progress.',
  },
  {
    value: 'QUALIFIED',
    label: 'Qualified',
    tone: 'green',
    description: 'Meets BANT / qualification criteria and ready for deal conversion.',
  },
  {
    value: 'UNQUALIFIED',
    label: 'Unqualified',
    tone: 'red',
    description: 'Does not currently fit ideal customer profile, budget, or timeline.',
  },
  {
    value: 'CONVERTED',
    label: 'Converted',
    tone: 'purple',
    description: 'Successfully converted into a Contact, Organization, and Sales Deal.',
  },
];

export const LEAD_STATUS_OPTIONS: Option<LeadStatus>[] = LEAD_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}));

export const LEAD_SOURCE_OPTIONS: Option<LeadSourceType>[] = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'COLD_OUTREACH', label: 'Cold Outreach' },
  { value: 'ADVERTISING', label: 'Advertising' },
  { value: 'EVENT', label: 'Event' },
  { value: 'OTHER', label: 'Other' },
];

export const LEAD_SORT_OPTIONS: Option<LeadSortField>[] = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'leadScore', label: 'Lead Score' },
  { value: 'estimatedValue', label: 'Estimated Value' },
  { value: 'title', label: 'Lead Title' },
  { value: 'lastName', label: 'Contact Name' },
  { value: 'companyName', label: 'Company Name' },
  { value: 'status', label: 'Qualification Status' },
];

export const SCORE_TIER_OPTIONS: Option<ScoreTier>[] = [
  { value: 'HOT', label: 'Hot (70–100)' },
  { value: 'WARM', label: 'Warm (40–69)' },
  { value: 'COLD', label: 'Cold (0–39)' },
];

export const ACTIVITY_TYPE_OPTIONS: Option<ActivityType>[] = [
  { value: 'CALL', label: 'Phone Call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MEETING', label: 'Meeting / Demo' },
  { value: 'WHATSAPP', label: 'WhatsApp / Chat' },
  { value: 'FOLLOW_UP', label: 'Follow-Up' },
];

export const ACTIVITY_STATUS_OPTIONS: Option<ActivityStatus>[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const ACTIVITY_PRIORITY_OPTIONS: Option<ActivityPriority>[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export const BANT_CHECKLIST_ITEMS = [
  {
    id: 'budget',
    label: 'Budget Confirmed',
    desc: 'Prospect has allocated or can approve budget for the solution.',
  },
  {
    id: 'authority',
    label: 'Decision Maker / Authority',
    desc: 'Contact is a decision maker or direct champion with buying influence.',
  },
  {
    id: 'need',
    label: 'Clear Business Need',
    desc: 'Identified pain points align with product capabilities.',
  },
  {
    id: 'timeline',
    label: 'Defined Purchase Timeline',
    desc: 'Target implementation or evaluation timeframe established.',
  },
];

export function statusTone(status?: string | null): Tone {
  switch ((status || '').toUpperCase()) {
    case 'NEW':
      return 'blue';
    case 'CONTACTED':
      return 'cyan';
    case 'QUALIFIED':
      return 'green';
    case 'CONVERTED':
      return 'purple';
    case 'UNQUALIFIED':
      return 'red';
    default:
      return 'slate';
  }
}

export function activityStatusTone(status?: string | null): Tone {
  switch ((status || '').toUpperCase()) {
    case 'COMPLETED':
      return 'green';
    case 'PENDING':
      return 'amber';
    case 'CANCELLED':
      return 'red';
    default:
      return 'slate';
  }
}

export function priorityTone(priority?: string | null): Tone {
  switch ((priority || '').toUpperCase()) {
    case 'URGENT':
      return 'red';
    case 'HIGH':
      return 'amber';
    case 'MEDIUM':
      return 'blue';
    case 'LOW':
    default:
      return 'slate';
  }
}

export function getScoreTier(
  score?: number | null,
  hotThreshold = 70,
  warmThreshold = 40,
): { tier: 'HOT' | 'WARM' | 'COLD'; label: string; tone: Tone } {
  const s = Number(score || 0);
  if (s >= hotThreshold) {
    return { tier: 'HOT', label: 'Hot', tone: 'green' };
  }
  if (s >= warmThreshold) {
    return { tier: 'WARM', label: 'Warm', tone: 'amber' };
  }
  return { tier: 'COLD', label: 'Cold', tone: 'slate' };
}

export function getInitials(name?: string | null): string {
  if (!name) return 'L';
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function leadFullName(lead?: Partial<Lead> | null): string {
  if (!lead) return '—';
  const full = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
  return full || lead.title || 'Unnamed Lead';
}

export function formatBytes(bytes?: number | null): string {
  const b = Number(bytes || 0);
  if (b <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
  const val = b / Math.pow(1024, idx);
  return `${val.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export function filterAndSortLeads(
  leads: Lead[],
  options: {
    scoreTier?: ScoreTier;
    sortField?: LeadSortField;
    sortDirection?: SortDirection;
    hotThreshold?: number;
    warmThreshold?: number;
  },
): Lead[] {
  const {
    scoreTier = '',
    sortField = 'createdAt',
    sortDirection = 'desc',
    hotThreshold = 70,
    warmThreshold = 40,
  } = options;

  let filtered = [...leads];

  if (scoreTier) {
    filtered = filtered.filter(
      (l) => getScoreTier(l.leadScore, hotThreshold, warmThreshold).tier === scoreTier,
    );
  }

  const dir = sortDirection === 'asc' ? 1 : -1;

  filtered.sort((a, b) => {
    switch (sortField) {
      case 'leadScore':
        return ((a.leadScore || 0) - (b.leadScore || 0)) * dir;
      case 'estimatedValue':
        return ((a.estimatedValue || 0) - (b.estimatedValue || 0)) * dir;
      case 'title':
        return (a.title || '').localeCompare(b.title || '') * dir;
      case 'lastName':
        return leadFullName(a).localeCompare(leadFullName(b)) * dir;
      case 'companyName':
        return (a.companyName || '').localeCompare(b.companyName || '') * dir;
      case 'status':
        return (a.status || '').localeCompare(b.status || '') * dir;
      case 'createdAt':
      default:
        return (
          (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * dir
        );
    }
  });

  return filtered;
}

export const SAMPLE_LEADS_CSV = `title,firstName,lastName,email,phone,companyName,status,source,leadScore,estimatedValue
Enterprise Cloud Migration,Elena,Rostova,elena.rostova@novatech.io,+1-555-0191,NovaTech Systems,NEW,WEBSITE,82,48000
Global Security Audit,Marcus,Vance,m.vance@apexfin.com,+1-555-0142,Apex Financial,CONTACTED,REFERRAL,76,65000
Annual CRM Seat Expansion,Sophia,Chen,schen@luminahealth.org,+1-555-0188,Lumina Healthcare,QUALIFIED,EVENT,91,120000`;

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export interface ParsedImportRow {
  rowNumber: number;
  payload: CreateLeadPayload;
  errors: string[];
}

export function parseLeadsImportText(rawText: string, format: 'csv' | 'json' = 'csv'): ParsedImportRow[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  if (format === 'json' || trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (!Array.isArray(arr)) return [];
      return arr.map((item, idx) => validateImportItem(item, idx + 1));
    } catch {
      return [
        {
          rowNumber: 1,
          payload: { title: '', firstName: '', lastName: '', email: '' },
          errors: ['Invalid JSON format. Provide a valid JSON array of lead objects.'],
        },
      ];
    }
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  return lines.slice(1).map((line, idx) => {
    const cols = splitCsvLine(line);
    const record: Record<string, any> = {};
    headers.forEach((h, i) => {
      record[h] = cols[i] ?? '';
    });

    const mapped = {
      title: record.title || record.leadtitle || record.dealtitle || '',
      firstName: record.firstname || record.first || '',
      lastName: record.lastname || record.last || '',
      email: record.email || record.emailaddress || '',
      phone: record.phone || record.phonenumber || undefined,
      companyName: record.companyname || record.company || record.organization || undefined,
      status: (record.status || 'NEW').toUpperCase(),
      source: (record.source || 'WEBSITE').toUpperCase(),
      leadScore: record.leadscore || record.score ? Number(record.leadscore || record.score) : 0,
      estimatedValue:
        record.estimatedvalue || record.value ? Number(record.estimatedvalue || record.value) : 0,
    };

    return validateImportItem(mapped, idx + 2);
  });
}

function validateImportItem(raw: any, rowNumber: number): ParsedImportRow {
  const errors: string[] = [];
  const title = String(raw?.title || '').trim();
  const firstName = String(raw?.firstName || '').trim();
  const lastName = String(raw?.lastName || '').trim();
  const email = String(raw?.email || '').trim().toLowerCase();
  const phone = raw?.phone ? String(raw.phone).trim() : undefined;
  const companyName = raw?.companyName ? String(raw.companyName).trim() : undefined;

  const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'];
  const validSources = ['WEBSITE', 'REFERRAL', 'COLD_OUTREACH', 'ADVERTISING', 'EVENT', 'OTHER'];

  const statusRaw = String(raw?.status || 'NEW').toUpperCase();
  const sourceRaw = String(raw?.source || 'WEBSITE').toUpperCase();

  const status = validStatuses.includes(statusRaw) ? statusRaw : 'NEW';
  const source = validSources.includes(sourceRaw) ? sourceRaw : 'WEBSITE';

  const leadScore = Number(raw?.leadScore ?? 0);
  const estimatedValue = Number(raw?.estimatedValue ?? 0);

  if (!title) errors.push('Missing title');
  if (!firstName) errors.push('Missing firstName');
  if (!lastName) errors.push('Missing lastName');
  if (!email) {
    errors.push('Missing email');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email');
  }
  if (Number.isNaN(leadScore) || leadScore < 0) {
    errors.push('Invalid leadScore');
  }
  if (Number.isNaN(estimatedValue) || estimatedValue < 0) {
    errors.push('Invalid estimatedValue');
  }

  return {
    rowNumber,
    payload: {
      title,
      firstName,
      lastName,
      email,
      phone,
      companyName,
      status,
      source,
      leadScore: Number.isNaN(leadScore) ? 0 : Math.max(0, Math.round(leadScore)),
      estimatedValue: Number.isNaN(estimatedValue) ? 0 : Math.max(0, estimatedValue),
    },
    errors,
  };
}

export const EXPORT_COLUMNS: Array<{
  key: string;
  label: string;
  getValue: (lead: Lead) => string | number;
}> = [
  { key: 'id', label: 'Lead ID', getValue: (l) => l.id },
  { key: 'title', label: 'Title', getValue: (l) => l.title || '' },
  { key: 'firstName', label: 'First Name', getValue: (l) => l.firstName || '' },
  { key: 'lastName', label: 'Last Name', getValue: (l) => l.lastName || '' },
  { key: 'email', label: 'Email', getValue: (l) => l.email || '' },
  { key: 'phone', label: 'Phone', getValue: (l) => l.phone || '' },
  { key: 'companyName', label: 'Company', getValue: (l) => l.companyName || '' },
  { key: 'status', label: 'Status', getValue: (l) => l.status || 'NEW' },
  { key: 'source', label: 'Source', getValue: (l) => l.source || 'WEBSITE' },
  { key: 'leadScore', label: 'Lead Score', getValue: (l) => Number(l.leadScore || 0) },
  { key: 'estimatedValue', label: 'Estimated Value', getValue: (l) => Number(l.estimatedValue || 0) },
  { key: 'owner', label: 'Owner', getValue: (l) => l.owner?.name || 'Unassigned' },
  { key: 'createdAt', label: 'Created At', getValue: (l) => l.createdAt || '' },
];

export function generateLeadsCsv(leads: Lead[], selectedKeys?: string[]): string {
  const cols = selectedKeys?.length
    ? EXPORT_COLUMNS.filter((c) => selectedKeys.includes(c.key))
    : EXPORT_COLUMNS;

  const escapeCsvCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = cols.map((c) => escapeCsvCell(c.key)).join(',');
  const dataRows = leads.map((lead) =>
    cols.map((c) => escapeCsvCell(c.getValue(lead))).join(','),
  );

  return [headerRow, ...dataRows].join('\n');
}

export function triggerFileDownload(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

