import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { AnalyticsTimeframeEnum } from './analytics-query.dto';

export enum PerformanceSortByEnum {
  REVENUE = 'revenue',
  DEALS_WON = 'dealsWon',
  WIN_RATE = 'winRate',
  ACTIVITIES = 'activities',
  DEALS_CREATED = 'dealsCreated',
}

export class PerformanceQueryDto {
  @ApiPropertyOptional({
    enum: AnalyticsTimeframeEnum,
    default: AnalyticsTimeframeEnum.LAST_30_DAYS,
  })
  @IsOptional()
  @IsEnum(AnalyticsTimeframeEnum)
  timeframe?: AnalyticsTimeframeEnum = AnalyticsTimeframeEnum.LAST_30_DAYS;

  @ApiPropertyOptional({ description: 'Start date for custom timeframe (ISO 8601)' })
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date for custom timeframe (ISO 8601)' })
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Filter by Team UUID' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({
    enum: PerformanceSortByEnum,
    default: PerformanceSortByEnum.REVENUE,
    description: 'Field to rank/sort representatives by',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return PerformanceSortByEnum.REVENUE;
    const s = String(value).trim();
    const map: Record<string, PerformanceSortByEnum> = {
      revenue: PerformanceSortByEnum.REVENUE,
      REVENUE: PerformanceSortByEnum.REVENUE,
      dealswon: PerformanceSortByEnum.DEALS_WON,
      dealsWon: PerformanceSortByEnum.DEALS_WON,
      DEALS_WON: PerformanceSortByEnum.DEALS_WON,
      winrate: PerformanceSortByEnum.WIN_RATE,
      winRate: PerformanceSortByEnum.WIN_RATE,
      WIN_RATE: PerformanceSortByEnum.WIN_RATE,
      activities: PerformanceSortByEnum.ACTIVITIES,
      ACTIVITIES: PerformanceSortByEnum.ACTIVITIES,
      dealscreated: PerformanceSortByEnum.DEALS_CREATED,
      dealsCreated: PerformanceSortByEnum.DEALS_CREATED,
      DEALS_CREATED: PerformanceSortByEnum.DEALS_CREATED,
    };
    return map[s] || map[s.toLowerCase()] || value;
  })
  @IsEnum(PerformanceSortByEnum)
  sortBy?: PerformanceSortByEnum = PerformanceSortByEnum.REVENUE;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort order',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
