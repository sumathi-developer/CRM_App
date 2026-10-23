import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AnalyticsTimeframeEnum {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  THIS_QUARTER = 'THIS_QUARTER',
  THIS_YEAR = 'THIS_YEAR',
  CUSTOM = 'CUSTOM',
}

export enum AnalyticsIntervalEnum {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    enum: AnalyticsTimeframeEnum,
    default: AnalyticsTimeframeEnum.LAST_30_DAYS,
    description: 'Timeframe preset for analytics aggregation',
  })
  @IsOptional()
  @IsEnum(AnalyticsTimeframeEnum)
  timeframe?: AnalyticsTimeframeEnum = AnalyticsTimeframeEnum.LAST_30_DAYS;

  @ApiPropertyOptional({
    enum: AnalyticsIntervalEnum,
    description: 'Aggregation interval for time-series charts (DAILY, WEEKLY, MONTHLY, QUARTERLY)',
  })
  @IsOptional()
  @IsEnum(AnalyticsIntervalEnum)
  interval?: AnalyticsIntervalEnum;

  @ApiPropertyOptional({
    description: 'Start date for custom timeframe (ISO 8601)',
    example: '2026-09-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date for custom timeframe (ISO 8601)',
    example: '2026-10-23T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Workspace UUID to isolate analytics' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Filter analytics to a specific Team UUID' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({ description: 'Filter analytics to a specific User / Sales Rep UUID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter analytics to a specific Pipeline UUID' })
  @IsOptional()
  @IsString()
  pipelineId?: string;
}
