import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreateHelpArticleDto {
  @ApiProperty({ description: 'Category UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Article title', example: 'How to import leads from CSV' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug (auto-generated if omitted)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Short summary' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiProperty({ description: 'Full article body (markdown or HTML)' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Whether the article is public/published', default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Keyword tags for search indexing', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Explicit related article UUIDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedArticleIds?: string[];

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
