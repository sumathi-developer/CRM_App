import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileSettingsDto {
  @ApiPropertyOptional({ example: 'dark', enum: ['dark', 'light', 'system'] })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'America/Los_Angeles' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
