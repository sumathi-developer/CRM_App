import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, Matches } from 'class-validator';

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'Acme Global Operations' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'acme-global-ops',
    description: 'Unique workspace URL slug',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'Updated workspace description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/new-avatar.png' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'https://acme.org' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'PRO', enum: ['FREE', 'PRO', 'ENTERPRISE'] })
  @IsOptional()
  @IsIn(['FREE', 'PRO', 'ENTERPRISE'])
  plan?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
  status?: string;
}
