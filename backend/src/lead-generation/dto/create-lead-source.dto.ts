import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';

export enum LeadSourceType {
  WEBSITE = 'WEBSITE',
  LANDING_PAGE = 'LANDING_PAGE',
  CAMPAIGN = 'CAMPAIGN',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EMAIL = 'EMAIL',
  REFERRAL = 'REFERRAL',
  MANUAL = 'MANUAL',
  PAID_SEARCH = 'PAID_SEARCH',
  EVENT = 'EVENT',
  OTHER = 'OTHER',
}

export class CreateLeadSourceDto {
  @ApiProperty({ description: 'Name of the lead source', example: 'Google Ads - Summer Campaign 2026' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Unique slug/code identifier', example: 'GOOGLE_ADS_SUMMER_2026' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ enum: LeadSourceType, default: LeadSourceType.WEBSITE, description: 'Type/channel of the lead source' })
  @IsNotEmpty()
  @IsEnum(LeadSourceType)
  type: LeadSourceType;

  @ApiPropertyOptional({ description: 'Detailed description of the source', example: 'Inbound leads from summer Google PPC search ads' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Status of the source', default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';

  @ApiPropertyOptional({ description: 'Total cost invested in this source (for CPL and CAC analytics)', default: 0.0, example: 1200.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number = 0.0;

  @ApiPropertyOptional({ description: 'Default UTM Source parameter', example: 'google' })
  @IsOptional()
  @IsString()
  utmSource?: string;

  @ApiPropertyOptional({ description: 'Default UTM Medium parameter', example: 'cpc' })
  @IsOptional()
  @IsString()
  utmMedium?: string;

  @ApiPropertyOptional({ description: 'Default UTM Campaign parameter', example: 'summer_promo' })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @ApiPropertyOptional({ description: 'Optional workspace ID association', example: 'uuid-string' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Custom metadata payload', example: { targetAudience: 'B2B SaaS', adGroup: 'Enterprise' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
