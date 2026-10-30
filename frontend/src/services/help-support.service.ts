import { api } from './api';
import type {
  CreateSupportTicketPayload,
  DocCategory,
  DocPage,
  DocQueryFilters,
  FaqItem,
  FaqQueryFilters,
  FeedbackQueryFilters,
  HelpArticle,
  HelpCategory,
  HelpQueryFilters,
  PaginatedResult,
  SubmitFeedbackPayload,
  SupportTicket,
  TicketQueryFilters,
  UserFeedback,
} from '../types/help-support.types';
import {
  SEED_FAQS,
  SEED_HELP_ARTICLES,
  SEED_HELP_CATEGORIES,
} from '../pages/help-support/helpSupportConstants';

function unwrap<T = any>(res: any): T {
  if (res && typeof res === 'object' && 'data' in res && !('meta' in res && !Array.isArray(res.data))) {
    return res.data;
  }
  return res as T;
}

class HelpSupportService {
  // =========================================================================
  // 1. HELP CENTER
  // =========================================================================

  async getHelpCategories(workspaceId?: string): Promise<HelpCategory[]> {
    try {
      const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
      const res = await api.get<any>(`/help-support/help-center/categories${q}`);
      const data = unwrap<HelpCategory[]>(res);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // Fallback to seed categories
    }
    return SEED_HELP_CATEGORIES;
  }

  async getHelpArticles(
    query?: HelpQueryFilters,
  ): Promise<PaginatedResult<HelpArticle>> {
    try {
      const params = new URLSearchParams();
      if (query?.search?.trim()) params.append('search', query.search.trim());
      if (query?.categoryId) params.append('categoryId', query.categoryId);
      if (query?.tag) params.append('tag', query.tag);
      if (query?.page) params.append('page', String(query.page));
      if (query?.limit) params.append('limit', String(query.limit));

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<any>(`/help-support/help-center/articles${qs}`);

      if (res?.data && res?.meta) {
        return {
          data: Array.isArray(res.data) ? res.data : [],
          meta: res.meta,
        };
      }
      if (Array.isArray(res) && res.length > 0) {
        return {
          data: res,
          meta: {
            total: res.length,
            page: 1,
            limit: res.length,
            totalPages: 1,
          },
        };
      }
    } catch {
      // Fallback
    }

    // Filter seed articles by search/category if backend has no records yet
    let filtered = [...SEED_HELP_ARTICLES];
    if (query?.categoryId) {
      filtered = filtered.filter((a) => a.categoryId === query.categoryId);
    }
    if (query?.search?.trim()) {
      const s = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(s) ||
          a.summary?.toLowerCase().includes(s) ||
          a.tags.some((t) => t.toLowerCase().includes(s)),
      );
    }

    return {
      data: filtered,
      meta: {
        total: filtered.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };
  }

  async getHelpArticleById(id: string): Promise<HelpArticle | null> {
    try {
      const res = await api.get<any>(`/help-support/help-center/articles/${id}`);
      return unwrap<HelpArticle>(res);
    } catch {
      const found = SEED_HELP_ARTICLES.find((a) => a.id === id);
      return found || null;
    }
  }

  async voteHelpArticle(
    id: string,
    isHelpful: boolean,
  ): Promise<{ success: boolean }> {
    try {
      await api.post(`/help-support/help-center/articles/${id}/vote?isHelpful=${isHelpful}`, {});
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  // =========================================================================
  // 2. DOCUMENTATION
  // =========================================================================

  async getDocCategories(workspaceId?: string): Promise<DocCategory[]> {
    try {
      const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
      const res = await api.get<any>(`/help-support/docs/categories${q}`);
      const data = unwrap<DocCategory[]>(res);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // Fallback
    }

    return [
      {
        id: 'doc-cat-1',
        name: 'CRM Quickstart Guide',
        description: 'Initial onboarding, configuration, and team permissions.',
        version: '2.0.0',
        status: 'PUBLISHED',
        order: 1,
        pageCount: 3,
      },
      {
        id: 'doc-cat-2',
        name: 'Data Entities & Models',
        description: 'Detailed field schemas for Leads, Contacts, Deals, and Pipelines.',
        version: '2.0.0',
        status: 'PUBLISHED',
        order: 2,
        pageCount: 4,
      },
      {
        id: 'doc-cat-3',
        name: 'Automation & Workflows',
        description: 'Auto-assignment rules, routing algorithms, and stage decay triggers.',
        version: '2.0.0',
        status: 'PUBLISHED',
        order: 3,
        pageCount: 3,
      },
    ];
  }

  async getDocPages(query?: DocQueryFilters): Promise<PaginatedResult<DocPage>> {
    try {
      const params = new URLSearchParams();
      if (query?.search?.trim()) params.append('search', query.search.trim());
      if (query?.categoryId) params.append('categoryId', query.categoryId);
      if (query?.version) params.append('version', query.version);
      if (query?.page) params.append('page', String(query.page));
      if (query?.limit) params.append('limit', String(query.limit));

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<any>(`/help-support/docs/pages${qs}`);

      if (res?.data && res?.meta) {
        return {
          data: Array.isArray(res.data) ? res.data : [],
          meta: res.meta,
        };
      }
      if (Array.isArray(res) && res.length > 0) {
        return {
          data: res,
          meta: {
            total: res.length,
            page: 1,
            limit: res.length,
            totalPages: 1,
          },
        };
      }
    } catch {
      // Fallback
    }

    const fallbackPages: DocPage[] = [
      {
        id: 'doc-page-1',
        title: 'Platform Architecture & Tenancy',
        slug: 'platform-architecture',
        summary: 'Understand workspace scoping, database models, and authentication headers.',
        content: `### Platform Architecture\n\nThe CRM platform is built on modern modular micro-services with PostgreSQL storage and JWT token authentication.\n\n#### Core Concepts:\n- **Workspaces**: Multi-tenant boundaries that isolate Leads, Deals, Activities, and Custom Fields.\n- **Users & Roles**: Role-Based Access Control (Admin, Manager, User) protecting routes and data mutation endpoints.\n- **Real-Time Audit Trail**: Every data creation, status change, and session login is recorded immutably.`,
        categoryId: 'doc-cat-1',
        order: 1,
        status: 'PUBLISHED',
        tags: ['Architecture', 'Tenancy', 'Security'],
        createdAt: '2026-09-01T00:00:00Z',
      },
      {
        id: 'doc-page-2',
        title: 'Lead Ingestion & Deduplication Specification',
        slug: 'lead-ingestion-deduplication',
        summary: 'Technical rules for web form submissions, email normalization, and company domain mapping.',
        content: `### Lead Deduplication Logic\n\nWhen a new lead enters through web forms or manual capture:\n1. The system checks for matching email addresses within the current workspace.\n2. If deduplication setting is enabled, conflicting entries are flagged or merged.\n3. The company domain is extracted from the business email to associate existing accounts.`,
        categoryId: 'doc-cat-2',
        order: 2,
        status: 'PUBLISHED',
        tags: ['Leads', 'Deduplication', 'API'],
        createdAt: '2026-09-10T00:00:00Z',
      },
      {
        id: 'doc-page-3',
        title: 'Pipeline Automation & Stage Trigger API',
        slug: 'pipeline-automation-api',
        summary: 'Configure automatic webhook dispatches and win rate tracking across stages.',
        content: `### Pipeline Automation Rules\n\nPipeline stages support automated triggers when deals transition between phases.\n\n- **Stage Entry Triggers**: Dispatch welcome emails, notify assigned sales reps.\n- **Stage Decay Timers**: Trigger rotten deal alerts when inactive for more than N days.\n- **Probability Syncing**: Auto-adjust total weighted pipeline revenue based on stage probability.`,
        categoryId: 'doc-cat-3',
        order: 3,
        status: 'PUBLISHED',
        tags: ['Pipelines', 'Webhooks', 'Automation'],
        createdAt: '2026-09-20T00:00:00Z',
      },
    ];

    let filtered = fallbackPages;
    if (query?.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === query.categoryId);
    }
    if (query?.search?.trim()) {
      const s = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.summary?.toLowerCase().includes(s) ||
          p.tags.some((t) => t.toLowerCase().includes(s)),
      );
    }

    return {
      data: filtered,
      meta: {
        total: filtered.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };
  }

  async getDocPageById(id: string): Promise<DocPage | null> {
    try {
      const res = await api.get<any>(`/help-support/docs/pages/${id}`);
      return unwrap<DocPage>(res);
    } catch {
      return null;
    }
  }

  // =========================================================================
  // 3. FAQS
  // =========================================================================

  async getFaqs(query?: FaqQueryFilters): Promise<PaginatedResult<FaqItem>> {
    try {
      const params = new URLSearchParams();
      if (query?.search?.trim()) params.append('search', query.search.trim());
      if (query?.category && query.category !== 'ALL') {
        params.append('category', query.category);
      }
      if (query?.page) params.append('page', String(query.page));
      if (query?.limit) params.append('limit', String(query.limit));

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<any>(`/help-support/faqs${qs}`);

      if (res?.data && res?.meta) {
        return {
          data: Array.isArray(res.data) ? res.data : [],
          meta: res.meta,
        };
      }
      if (Array.isArray(res) && res.length > 0) {
        return {
          data: res,
          meta: {
            total: res.length,
            page: 1,
            limit: res.length,
            totalPages: 1,
          },
        };
      }
    } catch {
      // Fallback
    }

    let filtered = [...SEED_FAQS];
    if (query?.category && query.category !== 'ALL') {
      filtered = filtered.filter((f) => f.category === query.category);
    }
    if (query?.search?.trim()) {
      const s = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.question.toLowerCase().includes(s) ||
          f.answer.toLowerCase().includes(s),
      );
    }

    return {
      data: filtered,
      meta: {
        total: filtered.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };
  }

  async getFaqById(id: string): Promise<FaqItem | null> {
    try {
      const res = await api.get<any>(`/help-support/faqs/${id}`);
      return unwrap<FaqItem>(res);
    } catch {
      const found = SEED_FAQS.find((f) => f.id === id);
      return found || null;
    }
  }

  // =========================================================================
  // 4. CONTACT SUPPORT & TICKETS
  // =========================================================================

  async createTicket(payload: CreateSupportTicketPayload): Promise<SupportTicket> {
    const res = await api.post<any>('/help-support/tickets', payload);
    return unwrap<SupportTicket>(res);
  }

  async getTickets(
    query?: TicketQueryFilters,
  ): Promise<PaginatedResult<SupportTicket>> {
    try {
      const params = new URLSearchParams();
      if (query?.search?.trim()) params.append('search', query.search.trim());
      if (query?.status) params.append('status', query.status);
      if (query?.priority) params.append('priority', query.priority);
      if (query?.category) params.append('category', query.category);
      if (query?.page) params.append('page', String(query.page));
      if (query?.limit) params.append('limit', String(query.limit));

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<any>(`/help-support/tickets${qs}`);

      if (res?.data && res?.meta) {
        return {
          data: Array.isArray(res.data) ? res.data : [],
          meta: res.meta,
        };
      }
      if (Array.isArray(res)) {
        return {
          data: res,
          meta: {
            total: res.length,
            page: 1,
            limit: res.length || 20,
            totalPages: 1,
          },
        };
      }
    } catch {
      // Error fetching tickets
    }

    return {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  }

  async getTicketById(id: string): Promise<SupportTicket> {
    const res = await api.get<any>(`/help-support/tickets/${id}`);
    return unwrap<SupportTicket>(res);
  }

  async addTicketMessage(ticketId: string, message: string): Promise<any> {
    const res = await api.post<any>(`/help-support/tickets/${ticketId}/messages`, {
      message,
    });
    return unwrap(res);
  }

  // =========================================================================
  // 5. USER FEEDBACK
  // =========================================================================

  async submitFeedback(payload: SubmitFeedbackPayload): Promise<UserFeedback> {
    const res = await api.post<any>('/help-support/feedback', payload);
    return unwrap<UserFeedback>(res);
  }

  async getFeedbackList(
    query?: FeedbackQueryFilters,
  ): Promise<PaginatedResult<UserFeedback>> {
    try {
      const params = new URLSearchParams();
      if (query?.search?.trim()) params.append('search', query.search.trim());
      if (query?.type) params.append('type', query.type);
      if (query?.status) params.append('status', query.status);
      if (query?.module) params.append('module', query.module);
      if (query?.page) params.append('page', String(query.page));
      if (query?.limit) params.append('limit', String(query.limit));

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<any>(`/help-support/feedback${qs}`);

      if (res?.data && res?.meta) {
        return {
          data: Array.isArray(res.data) ? res.data : [],
          meta: res.meta,
        };
      }
      if (Array.isArray(res)) {
        return {
          data: res,
          meta: {
            total: res.length,
            page: 1,
            limit: res.length || 20,
            totalPages: 1,
          },
        };
      }
    } catch {
      // Error fetching feedback
    }

    return {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  }
}

export const helpSupportService = new HelpSupportService();

