import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { LeadSourceType } from './create-lead-source.dto';

export class LeadSourceQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term by name, code, or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LeadSourceType, description: 'Filter by source type/channel' })
  @IsOptional()
  @IsEnum(LeadSourceType)
  type?: LeadSourceType;

  @ApiPropertyOptional({ description: 'Filter by status (ACTIVE, INACTIVE)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
