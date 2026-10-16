import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ChannelLeadQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search query across name, email, company, and title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by campaign name' })
  @IsOptional()
  @IsString()
  campaign?: string;

  @ApiPropertyOptional({ description: 'Filter by medium (e.g. cpc, organic, email, social)' })
  @IsOptional()
  @IsString()
  medium?: string;

  @ApiPropertyOptional({ description: 'Filter by specific source ID or name' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Filter by lead status (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned owner user ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Minimum lead score threshold' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Filter by workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
