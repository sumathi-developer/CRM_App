import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn, Matches } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Sales Team', description: 'Workspace name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'acme-sales-team',
    description: 'Unique workspace URL slug (auto-generated from name if omitted)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'Primary sales workspace for North America region' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/workspace-logo.png' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'UTC', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    example: 'FREE',
    enum: ['FREE', 'PRO', 'ENTERPRISE'],
    default: 'FREE',
  })
  @IsOptional()
  @IsIn(['FREE', 'PRO', 'ENTERPRISE'])
  plan?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
    default: 'ACTIVE',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
  status?: string;
}
