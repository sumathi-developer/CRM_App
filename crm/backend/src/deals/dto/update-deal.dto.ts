import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsDateString, IsIn } from 'class-validator';

export class UpdateDealDto {
  @ApiPropertyOptional({ example: 'Enterprise Security Agreement - Revised' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 85000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'pipeline-uuid' })
  @IsOptional()
  @IsString()
  pipelineId?: string;

  @ApiPropertyOptional({ example: 'stage-uuid' })
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiPropertyOptional({ example: 'OPEN', enum: ['OPEN', 'WON', 'LOST'] })
  @IsOptional()
  @IsIn(['OPEN', 'WON', 'LOST'])
  status?: string;

  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional({ example: 'org-uuid' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
