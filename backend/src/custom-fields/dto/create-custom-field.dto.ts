import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CustomFieldEntityType } from '../enums/custom-field-entity-type.enum';

export class CreateOptionItemDto {
  @ApiProperty({ description: 'Option display label', example: 'High Priority' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Option stored value', example: 'high' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: 'Hex or CSS color code', example: '#ef4444' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Display order sequence', example: 1 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: 'Whether this is the default selected option', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateCustomFieldDto {
  @ApiProperty({ description: 'Human readable field label', example: 'Lead Qualification Rating' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Unique field key (identifier). Auto-generated from name if omitted',
    example: 'lead_qualification_rating',
  })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({
    description: 'Target CRM entity type',
    enum: CustomFieldEntityType,
    example: CustomFieldEntityType.LEAD,
  })
  @IsEnum(CustomFieldEntityType)
  @IsNotEmpty()
  entityType: CustomFieldEntityType;

  @ApiProperty({
    description: 'Field data type',
    enum: CustomFieldType,
    example: CustomFieldType.DROPDOWN,
  })
  @IsEnum(CustomFieldType)
  @IsNotEmpty()
  fieldType: CustomFieldType;

  @ApiPropertyOptional({ description: 'Field description or admin notes', example: 'Internal sales qualification score' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Input placeholder text', example: 'Select qualification score...' })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Tooltip help text shown on hover in UI', example: 'Evaluated by SDR after first call' })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiPropertyOptional({ description: 'Default value for this field', example: 'standard' })
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional({ description: 'Whether field is mandatory', default: false, example: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Whether value must be unique across entity records', default: false, example: false })
  @IsOptional()
  @IsBoolean()
  isUnique?: boolean;

  @ApiPropertyOptional({ description: 'Whether field is visible in standard forms & views', default: true, example: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Whether field values are searchable', default: true, example: true })
  @IsOptional()
  @IsBoolean()
  isSearchable?: boolean;

  @ApiPropertyOptional({ description: 'Whether field can be used in filters', default: true, example: true })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({ description: 'Whether field is user-editable (false makes it read-only)', default: true, example: true })
  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;

  @ApiPropertyOptional({ description: 'Display order index within its section', default: 0, example: 1 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: 'Form section / tab grouping name', default: 'General Information', example: 'Qualification' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ description: 'Grid column width (1 to 12)', default: 12, example: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  gridWidth?: number;

  @ApiPropertyOptional({
    description: 'Validation rules (min, max, minLength, maxLength, regex, errorMessage, currencyCode, etc.)',
    example: { min: 0, max: 100, errorMessage: 'Rating must be between 0 and 100' },
  })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'List of role names allowed to view this field (empty or ["*"] for all)',
    example: ['ADMIN', 'MANAGER'],
  })
  @IsOptional()
  @IsArray()
  readRoles?: string[];

  @ApiPropertyOptional({
    description: 'List of role names allowed to edit this field (empty or ["*"] for all)',
    example: ['ADMIN'],
  })
  @IsOptional()
  @IsArray()
  editRoles?: string[];

  @ApiPropertyOptional({ description: 'Workspace isolation ID', example: 'uuid-workspace-123' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({
    description: 'Options list for DROPDOWN, MULTI_SELECT, or RADIO field types',
    type: [CreateOptionItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionItemDto)
  options?: CreateOptionItemDto[];
}
