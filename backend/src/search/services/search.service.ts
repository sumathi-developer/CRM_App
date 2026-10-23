import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GlobalSearchDto } from '../dto/global-search.dto';
import { EntitySearchDto } from '../dto/entity-search.dto';
import { SearchSuggestionsDto } from '../dto/search-suggestions.dto';
import {
  SearchEntityType,
  SearchResultItem,
  GroupedSearchResults,
  GlobalSearchResponse,
  SearchSuggestion,
} from '../interfaces/search-result.interface';
import { RelevanceScorer } from '../utils/relevance-scorer.util';
import { PermissionFilter, UserSearchContext } from '../utils/permission-filter.util';
import { SearchHistoryService } from './search-history.service';
import { createPaginatedResponse } from '../../common/utils/response.util';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchHistoryService: SearchHistoryService,
  ) {}

  /**
   * Global multi-entity search with relevance scoring, pagination, and workspace isolation.
   */
  async globalSearch(
    dto: GlobalSearchDto,
    currentUser: any,
    workspaceContext?: any,
  ): Promise<GlobalSearchResponse> {
    const startTime = Date.now();
    const query = (dto.q || '').trim();
    const exact = Boolean(dto.exact);
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 20;

    const userContext = PermissionFilter.extractUserSearchContext(currentUser, workspaceContext);
    const targetWorkspaceId = dto.workspaceId || userContext.activeWorkspaceId;

    // Filter requested entities to only those user is authorized to read
    const allowedEntities = PermissionFilter.filterAllowedEntities(dto.entities, userContext);

    // Run parallel entity searches
    const entitySearchPromises: Promise<{ entity: SearchEntityType; items: SearchResultItem[] }>[] = [];

    for (const entity of allowedEntities) {
      switch (entity) {
        case 'LEADS':
          entitySearchPromises.push(
            this.searchLeads(query, exact, targetWorkspaceId, userContext).then((items) => ({
              entity: 'LEADS',
              items,
            })),
          );
          break;

        case 'CONTACTS':
          entitySearchPromises.push(
            this.searchContacts(query, exact, targetWorkspaceId, userContext).then((items) => ({
              entity: 'CONTACTS',
              items,
            })),
          );
          break;

        case 'COMPANIES':
          entitySearchPromises.push(
            this.searchCompanies(query, exact, targetWorkspaceId, userContext).then((items) => ({
              entity: 'COMPANIES',
              items,
            })),
          );
          break;

        case 'DEALS':
          entitySearchPromises.push(
            this.searchDeals(query, exact, targetWorkspaceId, userContext).then((items) => ({
              entity: 'DEALS',
              items,
            })),
          );
          break;

        case 'ACTIVITIES':
          entitySearchPromises.push(
            this.searchActivities(query, exact, targetWorkspaceId, userContext).then((items) => ({
              entity: 'ACTIVITIES',
              items,
            })),
          );
          break;

        case 'DOCUMENTS':
          entitySearchPromises.push(
            this.searchDocuments(query, exact, targetWorkspaceId, userContext).then((items) => ({
              entity: 'DOCUMENTS',
              items,
            })),
          );
          break;

        case 'NOTES':
          entitySearchPromises.push(
            this.searchNotes(query, exact, targetWorkspaceId, userContext).then((items) => ({
              entity: 'NOTES',
              items,
            })),
          );
          break;

        case 'USERS':
          entitySearchPromises.push(
            this.searchUsers(query, exact, targetWorkspaceId, userContext).then((items) => ({
              entity: 'USERS',
              items,
            })),
          );
          break;
      }
    }

    const searchResults = await Promise.all(entitySearchPromises);

    const grouped: GroupedSearchResults = {};
    const counts: Record<string, number> = {};
    let allItems: SearchResultItem[] = [];

    for (const res of searchResults) {
      grouped[res.entity] = res.items;
      counts[res.entity] = res.items.length;
      allItems.push(...res.items);
    }

    // Sort all combined results by relevance score descending
    allItems = RelevanceScorer.sortResults(allItems);

    const total = allItems.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const paginatedResults = allItems.slice(skip, skip + limit);
    const executionTimeMs = Date.now() - startTime;

    // Log query asynchronously to search history
    this.searchHistoryService
      .recordSearch({
        userId: currentUser?.id,
        query,
        entityType: dto.entities && dto.entities.length === 1 ? dto.entities[0] : 'ALL',
        resultsCount: total,
        workspaceId: targetWorkspaceId,
      })
      .catch((err) => this.logger.warn(`Failed to record search history: ${err.message}`));

    return {
      query,
      exact,
      total,
      counts,
      results: paginatedResults,
      grouped,
      meta: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        executionTimeMs,
      },
    };
  }

  /**
   * Search within a single specific entity type with entity-specific filters.
   */
  async searchSingleEntity(
    entityName: string,
    dto: EntitySearchDto,
    currentUser: any,
    workspaceContext?: any,
  ) {
    const normalizedEntity = entityName.toUpperCase().trim() as SearchEntityType;
    const userContext = PermissionFilter.extractUserSearchContext(currentUser, workspaceContext);

    // Permission check
    if (!PermissionFilter.canAccessEntity(normalizedEntity, userContext)) {
      throw new ForbiddenException(
        `User is not authorized to access or search '${entityName}'`,
      );
    }

    const query = (dto.q || '').trim();
    const exact = Boolean(dto.exact);
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 20;
    const targetWorkspaceId = dto.workspaceId || userContext.activeWorkspaceId;

    let items: SearchResultItem[] = [];

    switch (normalizedEntity) {
      case 'LEADS':
        items = await this.searchLeads(query, exact, targetWorkspaceId, userContext, dto);
        break;

      case 'CONTACTS':
        items = await this.searchContacts(query, exact, targetWorkspaceId, userContext, dto);
        break;

      case 'COMPANIES':
        items = await this.searchCompanies(query, exact, targetWorkspaceId, userContext, dto);
        break;

      case 'DEALS':
        items = await this.searchDeals(query, exact, targetWorkspaceId, userContext, dto);
        break;

      case 'ACTIVITIES':
        items = await this.searchActivities(query, exact, targetWorkspaceId, userContext, dto);
        break;

      case 'DOCUMENTS':
        items = await this.searchDocuments(query, exact, targetWorkspaceId, userContext, dto);
        break;

      case 'NOTES':
        items = await this.searchNotes(query, exact, targetWorkspaceId, userContext, dto);
        break;

      case 'USERS':
        items = await this.searchUsers(query, exact, targetWorkspaceId, userContext, dto);
        break;

      default:
        throw new NotFoundException(
          `Entity '${entityName}' is not supported for global search. Valid entities: LEADS, CONTACTS, COMPANIES, DEALS, ACTIVITIES, DOCUMENTS, NOTES, USERS`,
        );
    }

    // Sort by relevance
    items = RelevanceScorer.sortResults(items);

    const total = items.length;
    const skip = (page - 1) * limit;
    const paginatedItems = items.slice(skip, skip + limit);

    return createPaginatedResponse(paginatedItems, total, page, limit);
  }

  /**
   * Search suggestions / autocomplete for instant UI dropdown as user types.
   */
  async getSuggestions(
    dto: SearchSuggestionsDto,
    currentUser: any,
    workspaceContext?: any,
  ): Promise<SearchSuggestion[]> {
    const query = (dto.q || '').trim();
    if (!query) return [];

    const limit = Number(dto.limit) || 8;
    const userContext = PermissionFilter.extractUserSearchContext(currentUser, workspaceContext);
    const targetWorkspaceId = dto.workspaceId || userContext.activeWorkspaceId;

    const allowedEntities = PermissionFilter.filterAllowedEntities(dto.entities, userContext);
    const suggestions: SearchSuggestion[] = [];

    // Query lightweight items per allowed entity
    const fetchLimitPerEntity = Math.max(2, Math.ceil(limit / allowedEntities.length));

    for (const entity of allowedEntities) {
      if (suggestions.length >= limit) break;

      let items: SearchResultItem[] = [];
      switch (entity) {
        case 'LEADS':
          items = await this.searchLeads(query, false, targetWorkspaceId, userContext, undefined, fetchLimitPerEntity);
          break;
        case 'CONTACTS':
          items = await this.searchContacts(query, false, targetWorkspaceId, userContext, undefined, fetchLimitPerEntity);
          break;
        case 'COMPANIES':
          items = await this.searchCompanies(query, false, targetWorkspaceId, userContext, undefined, fetchLimitPerEntity);
          break;
        case 'DEALS':
          items = await this.searchDeals(query, false, targetWorkspaceId, userContext, undefined, fetchLimitPerEntity);
          break;
        case 'DOCUMENTS':
          items = await this.searchDocuments(query, false, targetWorkspaceId, userContext, undefined, fetchLimitPerEntity);
          break;
        case 'USERS':
          items = await this.searchUsers(query, false, targetWorkspaceId, userContext, undefined, fetchLimitPerEntity);
          break;
        default:
          break;
      }

      for (const item of items) {
        suggestions.push({
          id: item.id,
          text: item.title,
          entityType: item.entityType,
          subtitle: item.subtitle,
          entityId: item.id,
          url: item.url,
          icon: this.getEntityIcon(item.entityType),
        });
        if (suggestions.length >= limit) break;
      }
    }

    return suggestions;
  }

  // ==========================================
  // Entity Search Implementations
  // ==========================================

  private async searchLeads(
    query: string,
    exact: boolean,
    workspaceId: string | null | undefined,
    userContext: UserSearchContext,
    filters?: EntitySearchDto,
    fetchLimit: number = 50,
  ): Promise<SearchResultItem[]> {
    const mode = 'insensitive';
    const operator = exact ? 'equals' : 'contains';

    const where: any = {
      OR: [
        { title: { [operator]: query, mode } },
        { firstName: { [operator]: query, mode } },
        { lastName: { [operator]: query, mode } },
        { email: { [operator]: query, mode } },
        { phone: { [operator]: query, mode } },
        { companyName: { [operator]: query, mode } },
      ],
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const leads = await this.prisma.lead.findMany({
      where,
      take: fetchLimit,
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return leads.map((lead) => {
      const scoring = RelevanceScorer.scoreRecord(
        {
          title: lead.title,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          companyName: lead.companyName,
          status: lead.status,
          source: lead.source,
        },
        query,
        {
          title: 2.0,
          companyName: 1.8,
          email: 1.5,
          firstName: 1.3,
          lastName: 1.3,
          phone: 1.2,
        },
        exact,
        lead.updatedAt,
      );

      const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
      return {
        id: lead.id,
        entityType: 'LEADS',
        title: lead.title || fullName || 'Untitled Lead',
        subtitle: lead.companyName ? `${lead.companyName} • ${lead.email}` : lead.email,
        description: `Lead Score: ${lead.leadScore} | Status: ${lead.status}`,
        relevanceScore: scoring.score,
        matchedFields: scoring.matchedFields,
        snippet: scoring.bestSnippet,
        url: `/leads/${lead.id}`,
        metadata: {
          status: lead.status,
          score: lead.leadScore,
          company: lead.companyName,
          owner: lead.owner?.name,
        },
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      };
    });
  }

  private async searchContacts(
    query: string,
    exact: boolean,
    workspaceId: string | null | undefined,
    userContext: UserSearchContext,
    filters?: EntitySearchDto,
    fetchLimit: number = 50,
  ): Promise<SearchResultItem[]> {
    const mode = 'insensitive';
    const operator = exact ? 'equals' : 'contains';

    const where: any = {
      OR: [
        { firstName: { [operator]: query, mode } },
        { lastName: { [operator]: query, mode } },
        { email: { [operator]: query, mode } },
        { phone: { [operator]: query, mode } },
        { jobTitle: { [operator]: query, mode } },
        { department: { [operator]: query, mode } },
        { organization: { name: { [operator]: query, mode } } },
      ],
    };

    if (userContext.organizationId && !userContext.isSystemAdmin) {
      where.organizationId = userContext.organizationId;
    }

    if (filters?.status) {
      where.stage = filters.status;
    }

    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const contacts = await this.prisma.contact.findMany({
      where,
      take: fetchLimit,
      orderBy: { updatedAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return contacts.map((contact) => {
      const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      const scoring = RelevanceScorer.scoreRecord(
        {
          firstName: contact.firstName,
          lastName: contact.lastName,
          fullName,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle,
          department: contact.department,
          companyName: contact.organization?.name,
        },
        query,
        {
          fullName: 2.0,
          email: 1.8,
          firstName: 1.4,
          lastName: 1.4,
          companyName: 1.2,
          phone: 1.2,
        },
        exact,
        contact.updatedAt,
      );

      return {
        id: contact.id,
        entityType: 'CONTACTS',
        title: fullName || contact.email,
        subtitle: `${contact.jobTitle ? contact.jobTitle + ' • ' : ''}${contact.organization?.name || contact.email}`,
        description: `Department: ${contact.department || 'N/A'} | Stage: ${contact.stage}`,
        relevanceScore: scoring.score,
        matchedFields: scoring.matchedFields,
        snippet: scoring.bestSnippet,
        url: `/contacts/${contact.id}`,
        metadata: {
          email: contact.email,
          phone: contact.phone,
          stage: contact.stage,
          company: contact.organization?.name,
        },
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      };
    });
  }

  private async searchCompanies(
    query: string,
    exact: boolean,
    workspaceId: string | null | undefined,
    userContext: UserSearchContext,
    filters?: EntitySearchDto,
    fetchLimit: number = 50,
  ): Promise<SearchResultItem[]> {
    const mode = 'insensitive';
    const operator = exact ? 'equals' : 'contains';

    const where: any = {
      OR: [
        { name: { [operator]: query, mode } },
        { domain: { [operator]: query, mode } },
        { industry: { [operator]: query, mode } },
        { website: { [operator]: query, mode } },
        { phone: { [operator]: query, mode } },
        { city: { [operator]: query, mode } },
        { country: { [operator]: query, mode } },
      ],
    };

    if (userContext.organizationId && !userContext.isSystemAdmin) {
      where.id = userContext.organizationId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const organizations = await this.prisma.organization.findMany({
      where,
      take: fetchLimit,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { contacts: true, deals: true, users: true } },
      },
    });

    return organizations.map((org) => {
      const scoring = RelevanceScorer.scoreRecord(
        {
          name: org.name,
          domain: org.domain,
          industry: org.industry,
          website: org.website,
          phone: org.phone,
          city: org.city,
          country: org.country,
        },
        query,
        {
          name: 2.2,
          domain: 1.7,
          industry: 1.2,
        },
        exact,
        org.updatedAt,
      );

      return {
        id: org.id,
        entityType: 'COMPANIES',
        title: org.name,
        subtitle: `${org.industry || ''} ${org.city ? '• ' + org.city : ''}`.trim() || org.domain || 'Company',
        description: `${org._count.contacts} Contacts • ${org._count.deals} Deals • Domain: ${org.domain || 'N/A'}`,
        relevanceScore: scoring.score,
        matchedFields: scoring.matchedFields,
        snippet: scoring.bestSnippet,
        url: `/organizations/${org.id}`,
        metadata: {
          domain: org.domain,
          industry: org.industry,
          contactsCount: org._count.contacts,
          dealsCount: org._count.deals,
        },
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      };
    });
  }

  private async searchDeals(
    query: string,
    exact: boolean,
    workspaceId: string | null | undefined,
    userContext: UserSearchContext,
    filters?: EntitySearchDto,
    fetchLimit: number = 50,
  ): Promise<SearchResultItem[]> {
    const mode = 'insensitive';
    const operator = exact ? 'equals' : 'contains';

    const where: any = {
      OR: [
        { title: { [operator]: query, mode } },
        { organization: { name: { [operator]: query, mode } } },
        { contact: { firstName: { [operator]: query, mode } } },
        { contact: { lastName: { [operator]: query, mode } } },
        { contact: { email: { [operator]: query, mode } } },
      ],
    };

    if (userContext.organizationId && !userContext.isSystemAdmin) {
      where.organizationId = userContext.organizationId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.stage) {
      where.stageId = filters.stage;
    }

    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }

    const deals = await this.prisma.deal.findMany({
      where,
      take: fetchLimit,
      orderBy: { updatedAt: 'desc' },
      include: {
        stage: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    return deals.map((deal) => {
      const scoring = RelevanceScorer.scoreRecord(
        {
          title: deal.title,
          companyName: deal.organization?.name,
          contactName: `${deal.contact?.firstName || ''} ${deal.contact?.lastName || ''}`.trim(),
          status: deal.status,
          currency: deal.currency,
        },
        query,
        {
          title: 2.2,
          companyName: 1.5,
          contactName: 1.3,
        },
        exact,
        deal.updatedAt,
      );

      const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: deal.currency || 'USD',
      }).format(deal.value || 0);

      return {
        id: deal.id,
        entityType: 'DEALS',
        title: deal.title,
        subtitle: `${formattedValue} • ${deal.organization?.name || deal.stage?.name || deal.status}`,
        description: `Stage: ${deal.stage?.name || 'N/A'} | Status: ${deal.status} | Probability: ${deal.probability}%`,
        relevanceScore: scoring.score,
        matchedFields: scoring.matchedFields,
        snippet: scoring.bestSnippet,
        url: `/deals/${deal.id}`,
        metadata: {
          value: deal.value,
          currency: deal.currency,
          status: deal.status,
          stage: deal.stage?.name,
          company: deal.organization?.name,
        },
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
      };
    });
  }

  private async searchActivities(
    query: string,
    exact: boolean,
    workspaceId: string | null | undefined,
    userContext: UserSearchContext,
    filters?: EntitySearchDto,
    fetchLimit: number = 50,
  ): Promise<SearchResultItem[]> {
    const mode = 'insensitive';
    const operator = exact ? 'equals' : 'contains';

    const where: any = {
      OR: [
        { subject: { [operator]: query, mode } },
        { description: { [operator]: query, mode } },
        { contact: { firstName: { [operator]: query, mode } } },
        { contact: { lastName: { [operator]: query, mode } } },
        { lead: { title: { [operator]: query, mode } } },
        { deal: { title: { [operator]: query, mode } } },
      ],
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.ownerId) {
      where.assignedToId = filters.ownerId;
    }

    const activities = await this.prisma.activity.findMany({
      where,
      take: fetchLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    return activities.map((act) => {
      const scoring = RelevanceScorer.scoreRecord(
        {
          subject: act.subject,
          description: act.description,
          type: act.type,
          contactName: `${act.contact?.firstName || ''} ${act.contact?.lastName || ''}`.trim(),
          leadTitle: act.lead?.title,
          dealTitle: act.deal?.title,
        },
        query,
        {
          subject: 2.0,
          description: 1.0,
          type: 1.2,
        },
        exact,
        act.updatedAt,
      );

      const relatedTitle =
        act.deal?.title ||
        act.lead?.title ||
        (act.contact ? `${act.contact.firstName} ${act.contact.lastName}` : '');

      return {
        id: act.id,
        entityType: 'ACTIVITIES',
        title: act.subject,
        subtitle: `${act.type} • ${act.status} ${relatedTitle ? '• ' + relatedTitle : ''}`,
        description: act.description || `Activity scheduled: ${act.scheduledAt ? new Date(act.scheduledAt).toLocaleDateString() : 'N/A'}`,
        relevanceScore: scoring.score,
        matchedFields: scoring.matchedFields,
        snippet: scoring.bestSnippet,
        url: `/activities/${act.id}`,
        metadata: {
          type: act.type,
          status: act.status,
          priority: act.priority,
          assignedTo: act.assignedTo?.name,
        },
        createdAt: act.createdAt,
        updatedAt: act.updatedAt,
      };
    });
  }

  private async searchDocuments(
    query: string,
    exact: boolean,
    workspaceId: string | null | undefined,
    userContext: UserSearchContext,
    filters?: EntitySearchDto,
    fetchLimit: number = 50,
  ): Promise<SearchResultItem[]> {
    const mode = 'insensitive';
    const operator = exact ? 'equals' : 'contains';

    const where: any = {
      OR: [
        { originalName: { [operator]: query, mode } },
        { fileName: { [operator]: query, mode } },
        { mimeType: { [operator]: query, mode } },
      ],
    };

    const files = await this.prisma.fileRecord.findMany({
      where,
      take: fetchLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return files.map((file) => {
      const scoring = RelevanceScorer.scoreRecord(
        {
          originalName: file.originalName,
          fileName: file.fileName,
          mimeType: file.mimeType,
        },
        query,
        {
          originalName: 2.2,
          fileName: 1.8,
        },
        exact,
        file.createdAt,
      );

      const kb = Math.round(file.size / 1024);
      return {
        id: file.id,
        entityType: 'DOCUMENTS',
        title: file.originalName,
        subtitle: `${file.mimeType} • ${kb} KB`,
        description: `Uploaded by ${file.uploadedBy?.name || 'User'} on ${new Date(file.createdAt).toLocaleDateString()}`,
        relevanceScore: scoring.score,
        matchedFields: scoring.matchedFields,
        snippet: scoring.bestSnippet,
        url: `/files/${file.id}`,
        metadata: {
          mimeType: file.mimeType,
          size: file.size,
          path: file.path,
        },
        createdAt: file.createdAt,
      };
    });
  }

  private async searchNotes(
    query: string,
    exact: boolean,
    workspaceId: string | null | undefined,
    userContext: UserSearchContext,
    filters?: EntitySearchDto,
    fetchLimit: number = 50,
  ): Promise<SearchResultItem[]> {
    const mode = 'insensitive';
    const operator = exact ? 'equals' : 'contains';

    const where: any = {
      OR: [
        { title: { [operator]: query, mode } },
        { content: { [operator]: query, mode } },
        { contact: { firstName: { [operator]: query, mode } } },
        { contact: { lastName: { [operator]: query, mode } } },
        { lead: { title: { [operator]: query, mode } } },
        { deal: { title: { [operator]: query, mode } } },
      ],
    };

    const notes = await this.prisma.note.findMany({
      where,
      take: fetchLimit,
      orderBy: { updatedAt: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    return notes.map((note) => {
      const scoring = RelevanceScorer.scoreRecord(
        {
          title: note.title,
          content: note.content,
        },
        query,
        {
          title: 2.0,
          content: 1.0,
        },
        exact,
        note.updatedAt,
      );

      const relatedTitle =
        note.deal?.title ||
        note.lead?.title ||
        (note.contact ? `${note.contact.firstName} ${note.contact.lastName}` : '');

      return {
        id: note.id,
        entityType: 'NOTES',
        title: note.title || 'Note',
        subtitle: `By ${note.author?.name || 'User'} ${relatedTitle ? '• ' + relatedTitle : ''}`,
        description: note.content.slice(0, 150),
        relevanceScore: scoring.score,
        matchedFields: scoring.matchedFields,
        snippet: scoring.bestSnippet,
        url: `/notes/${note.id}`,
        metadata: {
          author: note.author?.name,
        },
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
    });
  }

  private async searchUsers(
    query: string,
    exact: boolean,
    workspaceId: string | null | undefined,
    userContext: UserSearchContext,
    filters?: EntitySearchDto,
    fetchLimit: number = 50,
  ): Promise<SearchResultItem[]> {
    const mode = 'insensitive';
    const operator = exact ? 'equals' : 'contains';

    const where: any = {
      OR: [
        { name: { [operator]: query, mode } },
        { email: { [operator]: query, mode } },
        { phone: { [operator]: query, mode } },
        { role: { name: { [operator]: query, mode } } },
      ],
    };

    if (userContext.organizationId && !userContext.isSystemAdmin) {
      where.organizationId = userContext.organizationId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const users = await this.prisma.user.findMany({
      where,
      take: fetchLimit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        avatar: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    return users.map((user) => {
      const scoring = RelevanceScorer.scoreRecord(
        {
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role?.name,
        },
        query,
        {
          name: 2.0,
          email: 1.8,
          phone: 1.2,
        },
        exact,
        user.updatedAt,
      );

      return {
        id: user.id,
        entityType: 'USERS',
        title: user.name,
        subtitle: `${user.role?.name || 'User'} • ${user.email}`,
        description: `Status: ${user.status} | Phone: ${user.phone || 'N/A'}`,
        relevanceScore: scoring.score,
        matchedFields: scoring.matchedFields,
        snippet: scoring.bestSnippet,
        url: `/users/${user.id}`,
        metadata: {
          email: user.email,
          phone: user.phone,
          status: user.status,
          role: user.role?.name,
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });
  }

  private getEntityIcon(type: SearchEntityType): string {
    switch (type) {
      case 'LEADS':
        return 'user-plus';
      case 'CONTACTS':
        return 'users';
      case 'COMPANIES':
        return 'building';
      case 'DEALS':
        return 'briefcase';
      case 'ACTIVITIES':
        return 'calendar';
      case 'DOCUMENTS':
        return 'file-text';
      case 'NOTES':
        return 'file';
      case 'USERS':
        return 'user';
      default:
        return 'search';
    }
  }
}
