import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, IsArray, IsString } from 'class-validator';

export class UpdateSecuritySettingsDto {
  @ApiPropertyOptional({ example: false, description: 'Enforce two-factor authentication for workspace' })
  @IsOptional()
  @IsBoolean()
  enforceTwoFactor?: boolean;

  @ApiPropertyOptional({ example: 1440, description: 'Session timeout in minutes' })
  @IsOptional()
  @IsNumber()
  sessionTimeoutMinutes?: number;

  @ApiPropertyOptional({ example: ['acme.com', 'acmepartners.com'], description: 'Allowed email domains for members' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedEmailDomains?: string[];

  @ApiPropertyOptional({ example: ['192.168.1.0/24'], description: 'Allowed IP address ranges' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipAllowlist?: string[];
}
