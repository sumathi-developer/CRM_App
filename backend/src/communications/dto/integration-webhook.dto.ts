import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmailWebhookEventType {
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  BOUNCED = 'BOUNCED',
  DROPPED = 'DROPPED',
  SPAM_REPORT = 'SPAM_REPORT',
}

export class IntegrationWebhookDto {
  @ApiProperty({ description: 'Provider message ID or CRM email message ID' })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({ enum: EmailWebhookEventType, description: 'Event type' })
  @IsEnum(EmailWebhookEventType)
  event: EmailWebhookEventType;

  @ApiPropertyOptional({ description: 'Recipient email address associated with the event' })
  @IsOptional()
  @IsString()
  recipient?: string;

  @ApiPropertyOptional({ description: 'Timestamp of the event (ISO 8601 or UNIX seconds)' })
  @IsOptional()
  timestamp?: string | number;

  @ApiPropertyOptional({ description: 'Failure / bounce reason if applicable' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Raw event payload from provider' })
  @IsOptional()
  metadata?: Record<string, any>;
}
