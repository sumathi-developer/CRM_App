import { IsOptional, IsString, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmailFolder, EmailStatus } from './email-query.dto';

export class UpdateEmailDto {
  @ApiPropertyOptional({ description: 'Mark as read or unread' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Toggle star / favorite' })
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

  @ApiPropertyOptional({ description: 'Move to folder', enum: EmailFolder })
  @IsOptional()
  @IsEnum(EmailFolder)
  folder?: EmailFolder;

  @ApiPropertyOptional({ description: 'Toggle archive' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ description: 'Update status', enum: EmailStatus })
  @IsOptional()
  @IsEnum(EmailStatus)
  status?: EmailStatus;

  @ApiPropertyOptional({ description: 'Updated subject line (for drafts)' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Updated body HTML (for drafts)' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Updated plain body text (for drafts)' })
  @IsOptional()
  @IsString()
  bodyText?: string;

  @ApiPropertyOptional({ description: 'Updated recipient list (for drafts)' })
  @IsOptional()
  @IsArray()
  recipients?: string[];
}
