import { IsOptional, IsString, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum EmailFolder {
  INBOX = 'INBOX',
  SENT = 'SENT',
  DRAFTS = 'DRAFTS',
  TRASH = 'TRASH',
  ARCHIVE = 'ARCHIVE',
  SPAM = 'SPAM',
  ALL = 'ALL',
}

export enum EmailStatus {
  DRAFT = 'DRAFT',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  BOUNCED = 'BOUNCED',
  FAILED = 'FAILED',
  RECEIVED = 'RECEIVED',
}

export enum EmailDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export class EmailQueryDto {
  @ApiPropertyOptional({ description: 'Search in subject, body, snippet, sender, recipients' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: EmailFolder, default: EmailFolder.INBOX })
  @IsOptional()
  @IsEnum(EmailFolder)
  folder?: EmailFolder;

  @ApiPropertyOptional({ enum: EmailStatus })
  @IsOptional()
  @IsEnum(EmailStatus)
  status?: EmailStatus;

  @ApiPropertyOptional({ enum: EmailDirection })
  @IsOptional()
  @IsEnum(EmailDirection)
  direction?: EmailDirection;

  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Filter by starred flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isStarred?: boolean;

  @ApiPropertyOptional({ description: 'Filter by thread ID' })
  @IsOptional()
  @IsString()
  threadId?: string;

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

  @ApiPropertyOptional({ description: 'Associated Organization / Company UUID' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Filter by sender user ID' })
  @IsOptional()
  @IsUUID()
  senderUserId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort direction (asc/desc)', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
