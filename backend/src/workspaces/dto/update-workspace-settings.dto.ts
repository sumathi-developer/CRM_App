import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';
import { UpdateBrandingSettingsDto } from './update-branding-settings.dto';
import { UpdateLocalizationSettingsDto } from './update-localization-settings.dto';
import { UpdatePreferencesSettingsDto } from './update-preferences-settings.dto';
import { UpdateSecuritySettingsDto } from './update-security-settings.dto';

export class UpdateWorkspaceSettingsDto {
  @ApiPropertyOptional({ type: Object, example: { companyName: 'Acme Corp', industry: 'SaaS' } })
  @IsOptional()
  @IsObject()
  general?: Record<string, any>;

  @ApiPropertyOptional({ type: UpdateBrandingSettingsDto })
  @IsOptional()
  @IsObject()
  branding?: UpdateBrandingSettingsDto;

  @ApiPropertyOptional({ type: UpdateLocalizationSettingsDto })
  @IsOptional()
  @IsObject()
  localization?: UpdateLocalizationSettingsDto;

  @ApiPropertyOptional({ type: UpdatePreferencesSettingsDto })
  @IsOptional()
  @IsObject()
  preferences?: UpdatePreferencesSettingsDto;

  @ApiPropertyOptional({ type: UpdateSecuritySettingsDto })
  @IsOptional()
  @IsObject()
  security?: UpdateSecuritySettingsDto;
}
