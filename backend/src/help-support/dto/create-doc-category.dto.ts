import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDocCategoryDto {
  @ApiProperty({ description: 'Documentation category name', example: 'API Reference' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug (auto-generated if omitted)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Version label', default: '1.0.0', example: '2.0.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Status (DRAFT, PUBLISHED, ARCHIVED)', default: 'PUBLISHED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
