import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  IsDateString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EmailAttachmentDto {
  @ApiProperty({ description: 'File name with extension', example: 'proposal.pdf' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiPropertyOptional({ description: 'MIME type of attachment', example: 'application/pdf' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 1048576 })
  @IsOptional()
  size?: number;

  @ApiPropertyOptional({ description: 'File storage path or URL' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: 'Direct download or public URL' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'Associated FileRecord UUID from CRM Files module' })
  @IsOptional()
  @IsUUID()
  fileRecordId?: string;
}

export class ComposeEmailDto {
  @ApiProperty({
    description: 'Array of recipient email addresses',
    example: ['client@example.com'],
  })
  @IsArray()
  @IsNotEmpty({ message: 'At least one recipient is required' })
  recipients: string[];

  @ApiPropertyOptional({
    description: 'CC recipients',
    example: ['colleague@example.com'],
  })
  @IsOptional()
  @IsArray()
  cc?: string[];

  @ApiPropertyOptional({
    description: 'BCC recipients',
    example: ['archive@example.com'],
  })
  @IsOptional()
  @IsArray()
  bcc?: string[];

  @ApiProperty({
    description: 'Email subject line',
    example: 'Follow-up on product demonstration',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Email body content (HTML or rich text)',
    example: '<p>Hi Alice, thank you for your time today.</p>',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({
    description: 'Plain text fallback version of body',
    example: 'Hi Alice, thank you for your time today.',
  })
  @IsOptional()
  @IsString()
  bodyText?: string;

  @ApiPropertyOptional({ description: 'Custom sender email address' })
  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @ApiPropertyOptional({ description: 'Custom sender display name', example: 'Alex Sales' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ description: 'Reply-To email address' })
  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @ApiPropertyOptional({ description: 'Existing thread UUID if replying or following up' })
  @IsOptional()
  @IsString()
  threadId?: string;

  @ApiPropertyOptional({ description: 'Parent EmailMessage UUID if in reply to an existing email' })
  @IsOptional()
  @IsUUID()
  inReplyToId?: string;

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

  @ApiPropertyOptional({ description: 'Save as draft without sending', default: false })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @ApiPropertyOptional({
    description: 'ISO datetime to schedule sending for future',
    example: '2026-10-25T09:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'EmailTemplate UUID to apply' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Variables key-value map for template interpolation',
    example: { 'contact.firstName': 'Alice', 'deal.title': 'Enterprise Plan' },
  })
  @IsOptional()
  templateVariables?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'File attachments list',
    type: [EmailAttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];

  @ApiPropertyOptional({ description: 'Specific email integration provider ID to send through' })
  @IsOptional()
  @IsUUID()
  integrationId?: string;
}
