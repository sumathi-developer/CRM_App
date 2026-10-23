import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template title name', example: 'Sales Follow-up #1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Brief description of template purpose' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category group (SALES, MARKETING, FOLLOW_UP, ONBOARDING, SUPPORT, GENERAL)',
    example: 'SALES',
    default: 'GENERAL',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Subject line with optional dynamic tokens like {{contact.firstName}}',
    example: 'Follow-up regarding {{deal.title}}',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'HTML body template with tokens',
    example: '<p>Hi {{contact.firstName}},</p><p>Great speaking with you about {{deal.title}}. Best, {{user.name}}</p>',
  })
  @IsString()
  @IsNotEmpty()
  bodyHtml: string;

  @ApiPropertyOptional({
    description: 'Plain text fallback template with tokens',
    example: 'Hi {{contact.firstName}}, Great speaking with you about {{deal.title}}. Best, {{user.name}}',
  })
  @IsOptional()
  @IsString()
  bodyText?: string;

  @ApiPropertyOptional({
    description: 'Supported variable token placeholders list',
    example: ['contact.firstName', 'deal.title', 'user.name'],
  })
  @IsOptional()
  @IsArray()
  variables?: string[];

  @ApiPropertyOptional({ description: 'Whether template is shared with all workspace members', default: true })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
