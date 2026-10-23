import { IsOptional, IsString, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum CommunicationEntityType {
  CONTACT = 'CONTACT',
  LEAD = 'LEAD',
  DEAL = 'DEAL',
  ORGANIZATION = 'ORGANIZATION',
  WORKSPACE = 'WORKSPACE',
}

export enum CommunicationChannel {
  ALL = 'ALL',
  EMAIL = 'EMAIL',
  CALL = 'CALL',
  MEETING = 'MEETING',
  WHATSAPP = 'WHATSAPP',
  NOTE = 'NOTE',
  COMMENT = 'COMMENT',
}

export class CommunicationHistoryQueryDto {
  @ApiPropertyOptional({ enum: CommunicationEntityType, description: 'Target entity type' })
  @IsOptional()
  @IsEnum(CommunicationEntityType)
  entityType?: CommunicationEntityType;

  @ApiPropertyOptional({ description: 'Target entity UUID (Contact ID, Lead ID, Deal ID, Organization ID)' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Associated Contact UUID' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Associated Lead UUID' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Associated Deal UUID' })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiPropertyOptional({ description: 'Associated Organization UUID' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Associated Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({ enum: CommunicationChannel, default: CommunicationChannel.ALL })
  @IsOptional()
  @IsEnum(CommunicationChannel)
  channel?: CommunicationChannel;

  @ApiPropertyOptional({ description: 'Filter by direction: INBOUND, OUTBOUND, INTERNAL' })
  @IsOptional()
  @IsString()
  direction?: string;

  @ApiPropertyOptional({ description: 'Filter by search term across subjects, bodies, notes' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date filter (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;
}
