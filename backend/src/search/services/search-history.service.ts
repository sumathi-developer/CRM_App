import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { SearchHistoryQueryDto } from '../dto/search-history.dto';
import { createPaginatedResponse } from '../../common/utils/response.util';

export interface SearchHistoryRecord {
  id: string;
  userId: string;
  query: string;
  entityType: string;
  resultsCount: number;
  workspaceId: string | null;
  createdAt: Date;
}

@Injectable()
export class SearchHistoryService {
  private readonly logger = new Logger(SearchHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a user search query into the search history table.
   */
  async recordSearch(params: {
    userId: string;
    query: string;
    entityType?: string;
    resultsCount: number;
    workspaceId?: string | null;
  }): Promise<void> {
    const trimmed = (params.query || '').trim();
    if (!trimmed || !params.userId) return;

    try {
      // Check if identical recent query exists in the last 10 minutes to avoid spamming duplicates
      const existing: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT "id" FROM "SearchHistory" 
         WHERE "userId" = $1 AND LOWER("query") = LOWER($2) AND "createdAt" > NOW() - INTERVAL '10 minutes'
         LIMIT 1`,
        params.userId,
        trimmed,
      );

      if (existing && existing.length > 0) {
        // Update timestamp of the recent query
        await this.prisma.$executeRawUnsafe(
          `UPDATE "SearchHistory" 
           SET "createdAt" = NOW(), "resultsCount" = $1 
           WHERE "id" = $2`,
          params.resultsCount,
          existing[0].id,
        );
      } else {
        const id = crypto.randomUUID();
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "SearchHistory" ("id", "userId", "query", "entityType", "resultsCount", "workspaceId", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          id,
          params.userId,
          trimmed,
          params.entityType || 'ALL',
          params.resultsCount,
          params.workspaceId || null,
        );
      }
    } catch (err: any) {
      this.logger.warn(`Could not log search history: ${err.message}`);
    }
  }

  /**
   * Retrieve paginated search history for a user.
   */
  async getHistory(userId: string, query: SearchHistoryQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
      const workspaceParam = query.workspaceId || null;

      const countPromise = this.prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*)::int AS count FROM "SearchHistory" 
         WHERE "userId" = $1 AND ($2::text IS NULL OR "workspaceId" = $2::text)`,
        userId,
        workspaceParam,
      );

      const rowsPromise = this.prisma.$queryRawUnsafe<SearchHistoryRecord[]>(
        `SELECT "id", "userId", "query", "entityType", "resultsCount", "workspaceId", "createdAt" 
         FROM "SearchHistory" 
         WHERE "userId" = $1 AND ($2::text IS NULL OR "workspaceId" = $2::text)
         ORDER BY "createdAt" DESC 
         LIMIT $3 OFFSET $4`,
        userId,
        workspaceParam,
        limit,
        offset,
      );

      const [countResult, rows] = await Promise.all([countPromise, rowsPromise]);

      const total = Number(countResult?.[0]?.count || 0);
      return createPaginatedResponse(rows || [], total, page, limit);
    } catch (err: any) {
      this.logger.error(`Error querying search history: ${err.message}`);
      return createPaginatedResponse([], 0, page, limit);
    }
  }

  /**
   * Delete a single search history item for a user.
   */
  async deleteItem(id: string, userId: string) {
    try {
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM "SearchHistory" WHERE "id" = $1 AND "userId" = $2`,
        id,
        userId,
      );
      return { success: true, message: 'Search history entry deleted' };
    } catch (err: any) {
      this.logger.error(`Error deleting search history entry: ${err.message}`);
      return { success: false, message: err.message };
    }
  }

  /**
   * Clear all search history for a user.
   */
  async clearAll(userId: string, workspaceId?: string) {
    try {
      if (workspaceId) {
        await this.prisma.$executeRawUnsafe(
          `DELETE FROM "SearchHistory" WHERE "userId" = $1 AND "workspaceId" = $2`,
          userId,
          workspaceId,
        );
      } else {
        await this.prisma.$executeRawUnsafe(
          `DELETE FROM "SearchHistory" WHERE "userId" = $1`,
          userId,
        );
      }
      return { success: true, message: 'Search history cleared' };
    } catch (err: any) {
      this.logger.error(`Error clearing search history: ${err.message}`);
      return { success: false, message: err.message };
    }
  }
}
