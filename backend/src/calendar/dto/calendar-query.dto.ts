import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CalendarQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z', description: 'Range start date' })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z', description: 'Range end date' })
  @IsOptional()
  @IsDateString()
  end?: string;

  @ApiPropertyOptional({ example: 'MEETING', description: 'Filter by event type (CALL, MEETING, EMAIL, FOLLOW_UP, TASK, DEAL_CLOSING)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'PENDING', description: 'Filter by status (PENDING, COMPLETED, CANCELLED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'user-uuid', description: 'Filter by assigned user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'contact-uuid', description: 'Filter by linked contact ID' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ example: 'deal-uuid', description: 'Filter by linked deal ID' })
  @IsOptional()
  @IsString()
  dealId?: string;

  @ApiPropertyOptional({ example: 'lead-uuid', description: 'Filter by linked lead ID' })
  @IsOptional()
  @IsString()
  leadId?: string;
}

export class MonthViewQueryDto {
  @ApiPropertyOptional({ example: 2026, description: '4-digit year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 10, description: 'Month (1-12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ example: 'user-uuid', description: 'Filter by assigned user ID' })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class DayViewQueryDto {
  @ApiPropertyOptional({ example: '2026-10-09', description: 'Date in YYYY-MM-DD or ISO string' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'user-uuid', description: 'Filter by assigned user ID' })
  @IsOptional()
  @IsString()
  userId?: string;
}
