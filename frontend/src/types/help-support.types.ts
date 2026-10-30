/**
 * Help & Support Module Types
 * Matches backend /help-support controller and Prisma models.
 */

export type HelpScreenSlug =
  | 'center'
  | 'documentation'
  | 'faqs'
  | 'support'
  | 'feedback';

// ---------------------------------------------------------------------------
// 1. HELP CENTER
// ---------------------------------------------------------------------------

export interface HelpCategory {
  id: string;
  name: string;
  description: string | null;
  icon?: string | null;
  order: number;
  isPublished: boolean;
  articleCount?: number;
  _count?: {
    articles: number;
  };
}

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  categoryId: string;
  category?: HelpCategory;
  tags: string[];
  views: number;
  helpfulCount: number;
  unhelpfulCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HelpQueryFilters {
  search?: string;
  categoryId?: string;
  tag?: string;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// 2. DOCUMENTATION
// ---------------------------------------------------------------------------

export interface DocCategory {
  id: string;
  name: string;
  description: string | null;
  version: string;
  status: string;
  order: number;
  pageCount?: number;
  _count?: {
    pages: number;
  };
}

export interface DocPage {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  categoryId: string;
  category?: DocCategory;
  order: number;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface DocQueryFilters {
  search?: string;
  categoryId?: string;
  version?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// 3. FAQS
// ---------------------------------------------------------------------------

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
  helpfulCount: number;
  createdAt?: string;
}

export interface FaqQueryFilters {
  search?: string;
  category?: string;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// 4. CONTACT SUPPORT & TICKETS
// ---------------------------------------------------------------------------

export type TicketCategory =
  | 'TECHNICAL'
  | 'BILLING'
  | 'ACCOUNT'
  | 'FEATURE_REQUEST'
  | 'BUG'
  | 'GENERAL';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'RESOLVED'
  | 'CLOSED';

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  userId: string;
  assignedToId: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  messages?: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportTicketPayload {
  subject: string;
  description: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
  }>;
  workspaceId?: string;
}

export interface TicketQueryFilters {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// 5. USER FEEDBACK
// ---------------------------------------------------------------------------

export type FeedbackType =
  | 'BUG_REPORT'
  | 'FEATURE_REQUEST'
  | 'IMPROVEMENT'
  | 'PRAISE'
  | 'GENERAL';

export type FeedbackStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'DECLINED';

export interface UserFeedback {
  id: string;
  type: FeedbackType;
  rating: number | null;
  description: string;
  module: string | null;
  pageUrl: string | null;
  status: FeedbackStatus;
  userId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface SubmitFeedbackPayload {
  type?: FeedbackType;
  rating?: number;
  description: string;
  module?: string;
  pageUrl?: string;
  workspaceId?: string;
}

export interface FeedbackQueryFilters {
  search?: string;
  type?: FeedbackType;
  status?: FeedbackStatus;
  module?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// PAGINATION
// ---------------------------------------------------------------------------

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

