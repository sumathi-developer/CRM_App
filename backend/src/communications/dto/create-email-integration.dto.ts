import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsInt,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmailIntegrationProvider {
  SMTP = 'SMTP',
  SENDGRID = 'SENDGRID',
  RESEND = 'RESEND',
  GMAIL = 'GMAIL',
  OUTLOOK = 'OUTLOOK',
  SYSTEM = 'SYSTEM',
  MOCK = 'MOCK',
}

export class CreateEmailIntegrationDto {
  @ApiProperty({
    enum: EmailIntegrationProvider,
    description: 'Email provider type (Module 25 integration)',
    example: EmailIntegrationProvider.SMTP,
  })
  @IsEnum(EmailIntegrationProvider)
  provider: EmailIntegrationProvider;

  @ApiProperty({
    description: 'Human-friendly configuration name',
    example: 'Primary Corporate SMTP',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Default sender email address',
    example: 'notifications@company.com',
  })
  @IsEmail()
  @IsNotEmpty()
  fromEmail: string;

  @ApiPropertyOptional({
    description: 'Default sender display name',
    example: 'Acme CRM Notifications',
  })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({
    description: 'SMTP host (e.g. smtp.mailgun.org, smtp.office365.com)',
    example: 'smtp.gmail.com',
  })
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional({
    description: 'SMTP port (587, 465, 25)',
    example: 587,
  })
  @IsOptional()
  @IsInt()
  port?: number;

  @ApiPropertyOptional({
    description: 'Use TLS/SSL secure connection',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  secure?: boolean;

  @ApiPropertyOptional({
    description: 'SMTP or service username',
    example: 'user@company.com',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'SMTP password or App Password. Will be encrypted and NEVER returned in API responses.',
    example: 'SuperSecretPass123!',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: 'API Key for providers like SendGrid / Resend. Will be encrypted and NEVER returned in API responses.',
    example: 'SG.abcdef123456...',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({
    description: 'Set as default provider for sending emails in this workspace',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this provider integration is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Additional provider-specific configuration settings' })
  @IsOptional()
  settings?: Record<string, any>;
}
