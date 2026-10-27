import { IsOptional, IsEnum, IsString, IsBoolean, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomFieldEntityType } from '../enums/custom-field-entity-type.enum';
import { CustomFieldType } from '../enums/custom-field-type.enum';

export class CustomFieldQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by CRM entity type',
    enum: CustomFieldEntityType,
  })
  @IsOptional()
  @IsEnum(CustomFieldEntityType)
  entityType?: CustomFieldEntityType;

  @ApiPropertyOptional({
    description: 'Filter by field data type',
    enum: CustomFieldType,
  })
  @IsOptional()
  @IsEnum(CustomFieldType)
  fieldType?: CustomFieldType;

  @ApiPropertyOptional({ description: 'Search term across name, key, and description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by section name' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ description: 'Filter by visibility' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Filter by searchable flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSearchable?: boolean;

  @ApiPropertyOptional({ description: 'Filter by filterable flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active status', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Workspace isolation ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limit per page', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 50;
}
