import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class TeamActivitiesQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'MEETING',
    enum: ['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'],
    description: 'Filter by activity type',
  })
  @IsOptional()
  @IsIn(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'])
  type?: string;

  @ApiPropertyOptional({
    example: 'COMPLETED',
    enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
    description: 'Filter by activity status',
  })
  @IsOptional()
  @IsIn(['PENDING', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ example: 'user-uuid-1', description: 'Filter activities by specific team member' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Filter activities scheduled on or after this ISO date' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Filter activities scheduled on or before this ISO date' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
