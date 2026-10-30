import type {
  FaqItem,
  FeedbackType,
  HelpArticle,
  HelpCategory,
  HelpScreenSlug,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../types/help-support.types';

export interface HelpScreenMeta {
  slug: HelpScreenSlug;
  label: string;
  shortLabel: string;
  path: string;
  description: string;
}

export const HELP_SCREENS_META: Record<HelpScreenSlug, HelpScreenMeta> = {
  center: {
    slug: 'center',
    label: 'Help Center',
    shortLabel: 'Help Center',
    path: '/help/center',
    description:
      'Search our knowledge base, find step-by-step guides, and learn best practices.',
  },
  documentation: {
    slug: 'documentation',
    label: 'Documentation',
    shortLabel: 'Documentation',
    path: '/help/docs',
    description:
      'In-depth technical guides, module workflows, permissions, and API references.',
  },
  faqs: {
    slug: 'faqs',
    label: 'Frequently Asked Questions',
    shortLabel: 'FAQs',
    path: '/help/faqs',
    description:
      'Instant answers to common questions about billing, pipelines, and account setup.',
  },
  support: {
    slug: 'support',
    label: 'Contact Support',
    shortLabel: 'Contact Support',
    path: '/help/support',
    description:
      'Submit support tickets to our assistance team and follow existing conversations.',
  },
  feedback: {
    slug: 'feedback',
    label: 'Feedback & Ideas',
    shortLabel: 'Feedback',
    path: '/help/feedback',
    description:
      'Suggest new features, report issues, and help us improve your CRM experience.',
  },
};

export const HELP_NAV_ITEMS: HelpScreenMeta[] = [
  HELP_SCREENS_META.center,
  HELP_SCREENS_META.documentation,
  HELP_SCREENS_META.faqs,
  HELP_SCREENS_META.support,
  HELP_SCREENS_META.feedback,
];

// ---------------------------------------------------------------------------
// OPTIONS & BADGES
// ---------------------------------------------------------------------------

export const TICKET_CATEGORY_OPTIONS: Array<{
  value: TicketCategory;
  label: string;
}> = [
  { value: 'TECHNICAL', label: 'Technical Issue' },
  { value: 'BILLING', label: 'Billing & Payments' },
  { value: 'ACCOUNT', label: 'Account & Access' },
  { value: 'BUG', label: 'Bug Report' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'GENERAL', label: 'General Inquiry' },
];

export const TICKET_PRIORITY_OPTIONS: Array<{
  value: TicketPriority;
  label: string;
  badgeClass: string;
}> = [
  {
    value: 'LOW',
    label: 'Low',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    value: 'HIGH',
    label: 'High',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
];

export const TICKET_STATUS_OPTIONS: Record<
  TicketStatus,
  { label: string; badgeClass: string }
> = {
  OPEN: {
    label: 'Open',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  WAITING_FOR_USER: {
    label: 'Waiting for You',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  RESOLVED: {
    label: 'Resolved',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  CLOSED: {
    label: 'Closed',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

export const FEEDBACK_TYPE_OPTIONS: Array<{
  value: FeedbackType;
  label: string;
  desc: string;
}> = [
  {
    value: 'FEATURE_REQUEST',
    label: 'Feature Request',
    desc: 'Idea for new functionality',
  },
  {
    value: 'BUG_REPORT',
    label: 'Bug Report',
    desc: 'Something is broken or not working as expected',
  },
  {
    value: 'IMPROVEMENT',
    label: 'Improvement',
    desc: 'Make an existing capability faster or smoother',
  },
  {
    value: 'PRAISE',
    label: 'Praise',
    desc: 'Share what you like about the CRM',
  },
  {
    value: 'GENERAL',
    label: 'General Feedback',
    desc: 'General thoughts and suggestions',
  },
];

export const FAQ_CATEGORIES = [
  { value: 'ALL', label: 'All FAQs' },
  { value: 'GENERAL', label: 'General' },
  { value: 'CRM', label: 'Leads & Deals' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'ACCOUNT', label: 'Account & Security' },
  { value: 'INTEGRATIONS', label: 'Integrations' },
];

// ---------------------------------------------------------------------------
// SEED FALLBACK DATA (For pristine empty environments)
// ---------------------------------------------------------------------------

export const SEED_HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'seed-cat-1',
    name: 'Getting Started',
    description: 'Learn the essentials of workspace navigation and CRM setup.',
    order: 1,
    isPublished: true,
    articleCount: 4,
  },
  {
    id: 'seed-cat-2',
    name: 'Leads & Prospects',
    description: 'Lead generation, web forms, scoring, and automated routing.',
    order: 2,
    isPublished: true,
    articleCount: 3,
  },
  {
    id: 'seed-cat-3',
    name: 'Sales Pipelines & Deals',
    description: 'Configure stages, track deals, win rates, and forecast revenue.',
    order: 3,
    isPublished: true,
    articleCount: 5,
  },
  {
    id: 'seed-cat-4',
    name: 'Communications & Calendar',
    description: 'Sync email inboxes, schedule appointments, and log activities.',
    order: 4,
    isPublished: true,
    articleCount: 3,
  },
  {
    id: 'seed-cat-5',
    name: 'Workspace & Security',
    description: 'Two-factor auth, role permissions, audit trails, and data export.',
    order: 5,
    isPublished: true,
    articleCount: 4,
  },
];

export const SEED_HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'seed-art-1',
    title: 'How to convert a Lead into a Contact, Company, and Deal',
    slug: 'convert-lead-to-contact-deal',
    summary:
      'Learn how to qualify a lead and seamlessly create associated contacts, accounts, and deal opportunities in one step.',
    content: `When a lead reaches the qualification threshold, converting them into an active sales opportunity takes only a single click.\n\n### Step-by-Step Conversion:\n1. Open the **Leads Explorer** and click on the target lead record.\n2. In the top action bar, select **Convert Lead**.\n3. The conversion modal will automatically verify existing company domains and contact email addresses to prevent duplicate entries.\n4. Enter the estimated deal value and target pipeline stage.\n5. Click **Confirm Conversion**. The lead is marked as converted and linked to your new Contact, Company, and Deal records.`,
    categoryId: 'seed-cat-2',
    tags: ['Leads', 'Conversion', 'Deals', 'Workflow'],
    views: 420,
    helpfulCount: 58,
    unhelpfulCount: 2,
    isPublished: true,
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-10-20T14:30:00Z',
  },
  {
    id: 'seed-art-2',
    title: 'Customizing Pipelines, Stages, and Rotten Deal Limits',
    slug: 'customizing-pipelines-and-stages',
    summary:
      'Configure multiple sales pipelines, assign stage probabilities, and set rotten deal alert thresholds.',
    content: `Multiple sales pipelines allow your team to manage different product lines and services independently.\n\n### Managing Pipeline Stages:\n- Navigate to **Settings > Pipeline Settings**.\n- Reorder stages using drag-and-drop or rank selectors.\n- Assign win probability percentages (0% - 100%) to each stage.\n- Turn on **Rotten Deal Alerts** by defining maximum idle days before deals turn amber or red.`,
    categoryId: 'seed-cat-3',
    tags: ['Pipeline', 'Stages', 'Rotten Deals', 'Sales'],
    views: 310,
    helpfulCount: 42,
    unhelpfulCount: 1,
    isPublished: true,
    createdAt: '2026-09-18T11:00:00Z',
    updatedAt: '2026-10-22T09:15:00Z',
  },
  {
    id: 'seed-art-3',
    title: 'Connecting Google Workspace and SMTP Email',
    slug: 'connecting-email-smtp',
    summary:
      'Step-by-step instructions on setting up outbound SMTP and inbound IMAP communications in CRM.',
    content: `Centralize your client communications by syncing outbound mail.\n\n1. Go to **Settings > Email Settings**.\n2. Input your SMTP Host, Port (usually 587 or 465), Sender Email, and Display Name.\n3. Enable TLS encryption for secure message delivery.\n4. Send a test email from the Communication Center to verify server handshake.`,
    categoryId: 'seed-cat-4',
    tags: ['Email', 'SMTP', 'Communications', 'Setup'],
    views: 290,
    helpfulCount: 37,
    unhelpfulCount: 0,
    isPublished: true,
    createdAt: '2026-09-22T08:00:00Z',
    updatedAt: '2026-10-25T16:00:00Z',
  },
  {
    id: 'seed-art-4',
    title: 'Understanding Role-Based Access Control (RBAC)',
    slug: 'role-based-access-control-guide',
    summary:
      'How to assign permissions, create custom roles, and restrict access to confidential deal data.',
    content: `The CRM platform uses granular RBAC to protect organizational data integrity.\n\n- **ADMIN**: Unrestricted access to workspace configuration, user billing, and system audit logs.\n- **MANAGER**: Team oversight, pipeline assignments, and report generation.\n- **USER / SALES REP**: Access to assigned leads, contacts, deals, and communication threads.\n- Custom permission matrices can be configured in **Roles & Permissions**.`,
    categoryId: 'seed-cat-5',
    tags: ['RBAC', 'Roles', 'Security', 'Permissions'],
    views: 185,
    helpfulCount: 29,
    unhelpfulCount: 1,
    isPublished: true,
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-28T11:45:00Z',
  },
];

export const SEED_FAQS: FaqItem[] = [
  {
    id: 'seed-faq-1',
    question: 'How do I invite team members to my CRM workspace?',
    answer:
      'Administrators can invite colleagues by opening Users & Teams, clicking "Invite User", and entering their email address along with their assigned role (Admin, Manager, or Sales Representative). An onboarding invitation will be dispatched instantly.',
    category: 'ACCOUNT',
    order: 1,
    isPublished: true,
    helpfulCount: 34,
  },
  {
    id: 'seed-faq-2',
    question: 'Can I export my CRM data for offline analysis or backups?',
    answer:
      'Yes. You can export Leads, Contacts, Deals, and Audit Logs at any time. Simply navigate to the corresponding module and select "Export" to download your data in RFC 4180 CSV or JSON format.',
    category: 'CRM',
    order: 2,
    isPublished: true,
    helpfulCount: 28,
  },
  {
    id: 'seed-faq-3',
    question: 'How does lead scoring work?',
    answer:
      'Lead scoring automatically calculates a score (0 to 100) based on criteria you define, such as company size, email domain validity, job title, and engagement events. Leads crossing your qualification threshold are flagged for immediate sales rep outreach.',
    category: 'CRM',
    order: 3,
    isPublished: true,
    helpfulCount: 41,
  },
  {
    id: 'seed-faq-4',
    question: 'Are audit logs permanent and tamper-proof?',
    answer:
      'Yes. All system audit logs, user activity, record mutations, and authentication attempts are cryptographically timestamped and completely read-only. Audit logs cannot be edited or modified from the frontend.',
    category: 'ACCOUNT',
    order: 4,
    isPublished: true,
    helpfulCount: 19,
  },
  {
    id: 'seed-faq-5',
    question: 'How do I report a bug or request a new feature?',
    answer:
      'Use the Feedback & Ideas tab inside the Help Center! Select "Feature Request" or "Bug Report", provide reproduction steps or your concept, and our engineering product team will review it directly.',
    category: 'GENERAL',
    order: 5,
    isPublished: true,
    helpfulCount: 52,
  },
];

