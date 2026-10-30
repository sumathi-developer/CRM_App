import type {
  Contact,
  ContactSortField,
  ContactStage,
  CreateContactPayload,
  SortDirection,
} from '../../types/contact.types';
import type { User } from '../../types/auth.types';
import { EMAIL_REGEX } from '../lead-generation/leadGenConstants';

export const CONTACT_STAGE_OPTIONS: Array<{
  value: ContactStage;
  label: string;
  tone: 'blue' | 'amber' | 'green' | 'red' | 'slate';
  description: string;
}> = [
  {
    value: 'LEAD',
    label: 'Lead',
    tone: 'blue',
    description: 'Initial contact or prospect in early outreach',
  },
  {
    value: 'OPPORTUNITY',
    label: 'Opportunity',
    tone: 'amber',
    description: 'Engaged stakeholder in an active sales cycle',
  },
  {
    value: 'CUSTOMER',
    label: 'Customer',
    tone: 'green',
    description: 'Active paying customer or closed-won account contact',
  },
  {
    value: 'CHURNED',
    label: 'Churned',
    tone: 'red',
    description: 'Former customer or inactive relationship',
  },
];

export const CONTACT_SORT_OPTIONS: Array<{ value: ContactSortField; label: string }> = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'firstName', label: 'First Name' },
  { value: 'email', label: 'Email Address' },
  { value: 'stage', label: 'Lifecycle Stage' },
  { value: 'jobTitle', label: 'Job Title' },
];

export const DEPARTMENT_SUGGESTIONS: string[] = [
  'Executive',
  'Sales',
  'Marketing',
  'Engineering',
  'Operations',
  'Finance',
  'Product',
  'Procurement',
  'Customer Success',
  'IT & Security',
];

export function contactStageTone(
  stage?: string | null,
): 'blue' | 'amber' | 'green' | 'red' | 'slate' {
  switch ((stage || '').toUpperCase()) {
    case 'LEAD':
      return 'blue';
    case 'OPPORTUNITY':
      return 'amber';
    case 'CUSTOMER':
      return 'green';
    case 'CHURNED':
      return 'red';
    default:
      return 'slate';
  }
}

export function contactFullName(
  contact?: { firstName?: string | null; lastName?: string | null } | null,
): string {
  if (!contact) return '—';
  return `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || '—';
}

export interface ContactPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canImport: boolean;
  canExport: boolean;
  roleLabel: string;
}

export function getContactPermissions(user?: User | null): ContactPermissions {
  const roleName = (user?.role?.name || 'USER').toUpperCase();
  const isSuspended = user?.status === 'SUSPENDED' || user?.status === 'INACTIVE';
  const isViewerOnly = roleName === 'VIEWER' || roleName === 'READ_ONLY' || roleName === 'GUEST';

  return {
    canView: true,
    canCreate: !isSuspended && !isViewerOnly,
    canEdit: !isSuspended && !isViewerOnly,
    canDelete: !isSuspended && !isViewerOnly,
    canImport: !isSuspended && !isViewerOnly,
    canExport: true,
    roleLabel: user?.role?.name || 'Member',
  };
}

export function filterAndSortContacts(
  contacts: Contact[],
  options: {
    search?: string;
    stage?: string;
    organizationId?: string;
    ownerId?: string;
    department?: string;
    sortField?: ContactSortField;
    sortDirection?: SortDirection;
  },
): Contact[] {
  const {
    search = '',
    stage = '',
    organizationId = '',
    ownerId = '',
    department = '',
    sortField = 'createdAt',
    sortDirection = 'desc',
  } = options;

  const q = search.trim().toLowerCase();
  const deptQuery = department.trim().toLowerCase();

  const filtered = contacts.filter((contact) => {
    if (stage && (contact.stage || '').toUpperCase() !== stage.toUpperCase()) {
      return false;
    }
    if (organizationId && contact.organizationId !== organizationId) {
      return false;
    }
    if (ownerId && contact.ownerId !== ownerId) {
      return false;
    }
    if (deptQuery && !(contact.department || '').toLowerCase().includes(deptQuery)) {
      return false;
    }
    if (q) {
      const haystack = [
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.phone || '',
        contact.jobTitle || '',
        contact.department || '',
        contact.organization?.name || '',
        contact.owner?.name || '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const dir = sortDirection === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    switch (sortField) {
      case 'lastName':
        return dir * (a.lastName || '').localeCompare(b.lastName || '');
      case 'firstName':
        return dir * (a.firstName || '').localeCompare(b.firstName || '');
      case 'email':
        return dir * (a.email || '').localeCompare(b.email || '');
      case 'stage':
        return dir * (a.stage || '').localeCompare(b.stage || '');
      case 'jobTitle':
        return dir * (a.jobTitle || '').localeCompare(b.jobTitle || '');
      case 'createdAt':
      default: {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return dir * (tA - tB);
      }
    }
  });
}

/* ---------------- CSV / JSON Import & Export Utilities ---------------- */

export interface ParsedContactImportRow {
  rowNumber: number;
  payload: CreateContactPayload;
  organizationName?: string;
  isValid: boolean;
  errors: string[];
}

const VALID_STAGES = new Set<string>(['LEAD', 'OPPORTUNITY', 'CUSTOMER', 'CHURNED']);

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
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

export function validateContactImportRow(
  raw: Record<string, any>,
  rowNumber: number,
): ParsedContactImportRow {
  const errors: string[] = [];

  const firstName = String(raw.firstName || raw.first_name || raw.firstname || '').trim();
  const lastName = String(raw.lastName || raw.last_name || raw.lastname || '').trim();
  const email = String(raw.email || raw.workEmail || '').trim().toLowerCase();
  const phone = String(raw.phone || raw.phoneNumber || '').trim() || undefined;
  const jobTitle =
    String(raw.jobTitle || raw.job_title || raw.title || raw.role || '').trim() || undefined;
  const department = String(raw.department || raw.dept || '').trim() || undefined;
  const organizationId =
    String(raw.organizationId || raw.organization_id || '').trim() || undefined;
  const organizationName =
    String(raw.organization || raw.company || raw.companyName || '').trim() || undefined;

  const rawStage = String(raw.stage || 'LEAD').trim().toUpperCase();
  const stage = (VALID_STAGES.has(rawStage) ? rawStage : 'LEAD') as ContactStage;

  if (!firstName) errors.push('Missing firstName');
  if (!lastName) errors.push('Missing lastName');
  if (!email) {
    errors.push('Missing email');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push(`Invalid email "${email}"`);
  }

  return {
    rowNumber,
    payload: {
      firstName: firstName || 'Unknown',
      lastName: lastName || 'Contact',
      email,
      phone,
      jobTitle,
      department,
      stage,
      organizationId,
    },
    organizationName,
    isValid: errors.length === 0,
    errors,
  };
}

export function parseAndValidateContactImportText(
  content: string,
  format: 'csv' | 'json' | 'auto' = 'auto',
): ParsedContactImportRow[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const isJson = format === 'json' || (format === 'auto' && trimmed.startsWith('['));

  if (isJson) {
    try {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr.map((item, idx) => validateContactImportRow(item || {}, idx + 1));
    } catch (err: any) {
      return [
        {
          rowNumber: 1,
          payload: { firstName: '', lastName: '', email: '' },
          isValid: false,
          errors: [`Invalid JSON syntax: ${err?.message || 'Unable to parse JSON'}`],
        },
      ];
    }
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [
      {
        rowNumber: 1,
        payload: { firstName: '', lastName: '', email: '' },
        isValid: false,
        errors: ['CSV must include a header row and at least one contact row.'],
      },
    ];
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());

  return lines.slice(1).map((line, idx) => {
    const values = splitCsvLine(line);
    const obj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      obj[h] = values[colIdx] ?? '';
    });
    return validateContactImportRow(obj, idx + 2);
  });
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateContactsCsv(contacts: Contact[], selectedColumns?: string[]): string {
  const defaultColumns = [
    'id',
    'firstName',
    'lastName',
    'email',
    'phone',
    'jobTitle',
    'department',
    'stage',
    'organizationName',
    'ownerName',
    'createdAt',
  ];
  const cols = selectedColumns && selectedColumns.length > 0 ? selectedColumns : defaultColumns;

  const headerLine = cols.join(',');
  const rows = contacts.map((contact) =>
    cols
      .map((col) => {
        if (col === 'organizationName') {
          return escapeCsvCell(contact.organization?.name || '');
        }
        if (col === 'ownerName') {
          return escapeCsvCell(contact.owner?.name || contact.owner?.email || '');
        }
        return escapeCsvCell((contact as Record<string, any>)[col]);
      })
      .join(','),
  );

  return [headerLine, ...rows].join('\n');
}

export function generateContactsJson(contacts: Contact[], selectedColumns?: string[]): string {
  if (!selectedColumns || selectedColumns.length === 0) {
    return JSON.stringify(contacts, null, 2);
  }
  const projected = contacts.map((contact) => {
    const row: Record<string, unknown> = {};
    selectedColumns.forEach((col) => {
      if (col === 'organizationName') {
        row.organizationName = contact.organization?.name || null;
      } else if (col === 'ownerName') {
        row.ownerName = contact.owner?.name || contact.owner?.email || null;
      } else {
        row[col] = (contact as Record<string, any>)[col] ?? null;
      }
    });
    return row;
  });
  return JSON.stringify(projected, null, 2);
}

export const SAMPLE_CONTACTS_CSV = `firstName,lastName,email,phone,jobTitle,department,stage
Bruce,Wayne,bruce.wayne@wayneenterprises.com,+1-555-0199,Chief Executive Officer,Executive,CUSTOMER
Selina,Kyle,selina.kyle@gothamvault.io,+1-555-0142,VP of Security,IT & Security,OPPORTUNITY
Lucius,Fox,lucius.fox@appliedsciences.org,+1-555-0188,Head of R&D,Engineering,LEAD`;

export const SAMPLE_CONTACTS_JSON = JSON.stringify(
  [
    {
      firstName: 'Bruce',
      lastName: 'Wayne',
      email: 'bruce.wayne@wayneenterprises.com',
      phone: '+1-555-0199',
      jobTitle: 'Chief Executive Officer',
      department: 'Executive',
      stage: 'CUSTOMER',
    },
    {
      firstName: 'Selina',
      lastName: 'Kyle',
      email: 'selina.kyle@gothamvault.io',
      phone: '+1-555-0142',
      jobTitle: 'VP of Security',
      department: 'IT & Security',
      stage: 'OPPORTUNITY',
    },
  ],
  null,
  2,
);

