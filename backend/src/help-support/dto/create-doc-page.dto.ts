import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDocPageDto {
  @ApiProperty({ description: 'Category UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Documentation page title', example: 'Authentication & JWT Tokens' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug (auto-generated if omitted)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Full page markdown or HTML documentation' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Documentation version', default: '1.0.0' })
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
