import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TeamPerformanceQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01', description: 'Start date for performance metrics (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'End date for performance metrics (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'pipeline-uuid-1', description: 'Filter performance metrics by specific sales pipeline' })
  @IsOptional()
  @IsString()
  pipelineId?: string;
}
