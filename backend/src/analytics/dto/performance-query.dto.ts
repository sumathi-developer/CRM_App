import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
