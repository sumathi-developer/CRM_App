import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateHelpCategoryDto {
  @ApiProperty({ description: 'Category title', example: 'Getting Started' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug (auto-generated if omitted)', example: 'getting-started' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Category summary', example: 'Essential guides for new CRM users' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Icon identifier', example: 'rocket', default: 'help-circle' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: 'Publish status', default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
