import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EmailAttachmentDto } from './compose-email.dto';

export class ReplyEmailDto {
  @ApiProperty({ description: 'Reply body message', example: 'Thank you, let us proceed.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Reply to all (includes original CC)' })
  @IsOptional()
  replyAll?: boolean;

  @ApiPropertyOptional({ description: 'Additional CC recipients' })
  @IsOptional()
  @IsArray()
  cc?: string[];

  @ApiPropertyOptional({ description: 'Additional BCC recipients' })
  @IsOptional()
  @IsArray()
  bcc?: string[];

  @ApiPropertyOptional({ description: 'Attachments list', type: [EmailAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];
}

export class ForwardEmailDto {
  @ApiProperty({
    description: 'Recipients to forward this email to',
    example: ['partner@external.com'],
  })
  @IsArray()
  @IsNotEmpty()
  recipients: string[];

  @ApiPropertyOptional({ description: 'Forward message commentary/intro' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'CC recipients' })
  @IsOptional()
  @IsArray()
  cc?: string[];

  @ApiPropertyOptional({ description: 'BCC recipients' })
  @IsOptional()
  @IsArray()
  bcc?: string[];

  @ApiPropertyOptional({ description: 'Additional attachments to include', type: [EmailAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];
}
