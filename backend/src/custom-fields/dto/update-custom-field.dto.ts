import {
  IsString,
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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOptionItemDto } from './create-custom-field.dto';

export class UpdateCustomFieldDto {
  @ApiPropertyOptional({ description: 'Human readable field label', example: 'Lead Rating Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Field description or admin notes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Input placeholder text' })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Tooltip help text shown on hover in UI' })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiPropertyOptional({ description: 'Default value for this field' })
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional({ description: 'Whether field is mandatory' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Whether value must be unique across entity records' })
  @IsOptional()
  @IsBoolean()
  isUnique?: boolean;

  @ApiPropertyOptional({ description: 'Whether field is visible in standard forms & views' })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Whether field values are searchable' })
  @IsOptional()
  @IsBoolean()
  isSearchable?: boolean;

  @ApiPropertyOptional({ description: 'Whether field can be used in filters' })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({ description: 'Whether field is user-editable' })
  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;

  @ApiPropertyOptional({ description: 'Display order index within its section' })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: 'Form section / tab grouping name' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ description: 'Grid column width (1 to 12)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  gridWidth?: number;

  @ApiPropertyOptional({ description: 'Validation rules configuration object' })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Role names allowed to view this field' })
  @IsOptional()
  @IsArray()
  readRoles?: string[];

  @ApiPropertyOptional({ description: 'Role names allowed to edit this field' })
  @IsOptional()
  @IsArray()
  editRoles?: string[];

  @ApiPropertyOptional({ description: 'Active status of the field' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Archived status of the field' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({
    description: 'Updated options list (replaces existing options if provided)',
    type: [CreateOptionItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionItemDto)
  options?: CreateOptionItemDto[];
}
