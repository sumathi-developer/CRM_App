import type {
  SearchEntityType,
  SearchResultItem,
  SearchScopeSlug,
} from '../../types/search.types';

export interface SearchScopeMeta {
  slug: SearchScopeSlug;
  entityType?: SearchEntityType;
  label: string;
  shortLabel: string;
  path: string;
  subtitle: string;
  placeholder: string;
  statusOptions?: Array<{ value: string; label: string }>;
  typeOptions?: Array<{ value: string; label: string }>;
}

export const SEARCH_SCOPE_META: Record<SearchScopeSlug, SearchScopeMeta> = {
  all: {
    slug: 'all',
    label: 'Search All CRM',
    shortLabel: 'Search All',
    path: '/search',
    subtitle:
      'Search across Leads, Contacts, Companies, Deals, Activities, Documents, Notes, and Users with instant relevance ranking.',
    placeholder:
      'Search anything across CRM (names, emails, companies, deals, notes, documents)...',
  },
  leads: {
    slug: 'leads',
    entityType: 'LEADS',
    label: 'Search Leads',
    shortLabel: 'Leads',
    path: '/search/leads',
    subtitle:
      'Search leads by title, name, email, phone, company, qualification status, and owner.',
    placeholder: 'Search leads by title, name, email, phone, or company...',
    statusOptions: [
      { value: 'NEW', label: 'New' },
      { value: 'CONTACTED', label: 'Contacted' },
      { value: 'QUALIFIED', label: 'Qualified' },
      { value: 'UNQUALIFIED', label: 'Unqualified' },
      { value: 'CONVERTED', label: 'Converted' },
    ],
  },
  contacts: {
    slug: 'contacts',
    entityType: 'CONTACTS',
    label: 'Search Contacts',
    shortLabel: 'Contacts',
    path: '/search/contacts',
    subtitle:
      'Search customer and prospect contacts by name, email, phone, job title, department, or company.',
    placeholder:
      'Search contacts by first/last name, email, phone, job title, or company...',
    statusOptions: [
      { value: 'LEAD', label: 'Lead Stage' },
      { value: 'OPPORTUNITY', label: 'Opportunity Stage' },
      { value: 'CUSTOMER', label: 'Customer Stage' },
      { value: 'CHURNED', label: 'Churned' },
    ],
  },
  companies: {
    slug: 'companies',
    entityType: 'COMPANIES',
    label: 'Search Companies',
    shortLabel: 'Companies',
    path: '/search/companies',
    subtitle:
      'Search organizations and companies by name, domain, industry, website, phone, city, or country.',
    placeholder:
      'Search companies by name, domain, industry, city, or country...',
    statusOptions: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
    ],
  },
  deals: {
    slug: 'deals',
    entityType: 'DEALS',
    label: 'Search Deals',
    shortLabel: 'Deals',
    path: '/search/deals',
    subtitle:
      'Search sales pipeline opportunities and deals by title, organization, contact, status, and owner.',
    placeholder: 'Search deals by opportunity title, company, or contact...',
    statusOptions: [
      { value: 'OPEN', label: 'Open' },
      { value: 'WON', label: 'Won' },
      { value: 'LOST', label: 'Lost' },
    ],
  },
  activities: {
    slug: 'activities',
    entityType: 'ACTIVITIES',
    label: 'Search Activities',
    shortLabel: 'Activities',
    path: '/search/activities',
    subtitle:
      'Search scheduled and completed calls, meetings, emails, follow-ups, and tasks.',
    placeholder:
      'Search activities by subject, description, contact, lead, or deal...',
    statusOptions: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
    ],
    typeOptions: [
      { value: 'CALL', label: 'Call' },
      { value: 'MEETING', label: 'Meeting' },
      { value: 'EMAIL', label: 'Email' },
      { value: 'FOLLOW_UP', label: 'Follow-up' },
      { value: 'WHATSAPP', label: 'WhatsApp' },
    ],
  },
  documents: {
    slug: 'documents',
    entityType: 'DOCUMENTS',
    label: 'Search Documents',
    shortLabel: 'Documents',
    path: '/search/documents',
    subtitle:
      'Search uploaded CRM files, proposals, contracts, and attachments by filename or MIME type.',
    placeholder: 'Search documents by filename, extension, or file type...',
  },
  notes: {
    slug: 'notes',
    entityType: 'NOTES',
    label: 'Search Notes',
    shortLabel: 'Notes',
    path: '/search/notes',
    subtitle:
      'Search CRM notes across contacts, leads, and deals by note title, content, or author.',
    placeholder: 'Search notes by title, content keywords, or linked record...',
  },
  users: {
    slug: 'users',
    entityType: 'USERS',
    label: 'Search Users',
    shortLabel: 'Users',
    path: '/search/users',
    subtitle:
      'Search CRM team members and users by full name, email address, phone, or role.',
    placeholder: 'Search team members by name, email, phone, or role...',
    statusOptions: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'SUSPENDED', label: 'Suspended' },
    ],
  },
};

export const ALL_SEARCH_ENTITY_TYPES: Array<{
  type: SearchEntityType;
  slug: SearchScopeSlug;
  label: string;
}> = [
  { type: 'LEADS', slug: 'leads', label: 'Leads' },
  { type: 'CONTACTS', slug: 'contacts', label: 'Contacts' },
  { type: 'COMPANIES', slug: 'companies', label: 'Companies' },
  { type: 'DEALS', slug: 'deals', label: 'Deals' },
  { type: 'ACTIVITIES', slug: 'activities', label: 'Activities' },
  { type: 'DOCUMENTS', slug: 'documents', label: 'Documents' },
  { type: 'NOTES', slug: 'notes', label: 'Notes' },
  { type: 'USERS', slug: 'users', label: 'Users' },
];

export const QUICK_SAMPLE_SEARCHES: string[] = [
  'Acme',
  'Enterprise',
  'Follow-up',
  '@',
  'Proposal',
  'Demo',
];

export function entityBadgeTone(
  entityType?: SearchEntityType | string,
): 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'slate' {
  switch ((entityType || '').toUpperCase()) {
    case 'LEADS':
      return 'amber';
    case 'CONTACTS':
      return 'blue';
    case 'COMPANIES':
      return 'purple';
    case 'DEALS':
      return 'green';
    case 'ACTIVITIES':
      return 'blue';
    case 'DOCUMENTS':
      return 'slate';
    case 'NOTES':
      return 'amber';
    case 'USERS':
      return 'purple';
    default:
      return 'blue';
  }
}

export function resolveSearchResultPath(item: SearchResultItem): string {
  switch (item.entityType) {
    case 'LEADS':
      return `/leads/${item.id}`;
    case 'CONTACTS':
      return `/contacts/${item.id}`;
    case 'DEALS':
      return `/deals/${item.id}`;
    case 'ACTIVITIES':
      return `/activities/${item.id}`;
    case 'USERS':
      return `/users/${item.id}`;
    case 'COMPANIES':
      return `/contacts`;
    case 'DOCUMENTS':
      return `/leads/documents`;
    case 'NOTES':
      return `/leads/notes`;
    default:
      return item.url || '/workspaces';
  }
}

