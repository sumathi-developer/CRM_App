import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsInt,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmailIntegrationProvider } from './create-email-integration.dto';

export class UpdateEmailIntegrationDto {
  @ApiPropertyOptional({ enum: EmailIntegrationProvider })
  @IsOptional()
  @IsEnum(EmailIntegrationProvider)
  provider?: EmailIntegrationProvider;

  @ApiPropertyOptional({ description: 'Human-friendly configuration name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Default sender email address' })
  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @ApiPropertyOptional({ description: 'Default sender display name' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ description: 'SMTP host' })
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional({ description: 'SMTP port' })
  @IsOptional()
  @IsInt()
  port?: number;

  @ApiPropertyOptional({ description: 'Use TLS/SSL secure connection' })
  @IsOptional()
  @IsBoolean()
  secure?: boolean;

  @ApiPropertyOptional({ description: 'SMTP or service username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'New password to update. Encrypted and NEVER exposed in API responses.',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: 'New API Key to update. Encrypted and NEVER exposed in API responses.',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Set as default provider' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Additional settings' })
  @IsOptional()
  settings?: Record<string, any>;
}
