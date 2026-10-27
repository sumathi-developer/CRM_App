import {
  IsEnum,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomFieldEntityType } from '../enums/custom-field-entity-type.enum';

export enum CustomFieldFilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  BETWEEN = 'BETWEEN',
  IN = 'IN',
  IS_EMPTY = 'IS_EMPTY',
  IS_NOT_EMPTY = 'IS_NOT_EMPTY',
}

export class CustomFieldFilterConditionDto {
  @ApiProperty({ description: 'Custom field key to filter on', example: 'budget_estimate' })
  @IsString()
  @IsNotEmpty()
  fieldKey: string;

  @ApiProperty({
    description: 'Filter operator',
    enum: CustomFieldFilterOperator,
    example: CustomFieldFilterOperator.GREATER_THAN,
  })
  @IsEnum(CustomFieldFilterOperator)
  @IsNotEmpty()
  operator: CustomFieldFilterOperator;

  @ApiPropertyOptional({ description: 'Value to match', example: 50000 })
  @IsOptional()
  value?: any;

  @ApiPropertyOptional({ description: 'Upper bound value for BETWEEN operator', example: 100000 })
  @IsOptional()
  valueTo?: any;
}

export class FilterEntitiesByCustomFieldsDto {
  @ApiProperty({
    description: 'Target CRM entity type to filter',
    enum: CustomFieldEntityType,
    example: CustomFieldEntityType.LEAD,
  })
  @IsEnum(CustomFieldEntityType)
  @IsNotEmpty()
  entityType: CustomFieldEntityType;

  @ApiProperty({
    description: 'List of custom field filter conditions',
    type: [CustomFieldFilterConditionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldFilterConditionDto)
  conditions: CustomFieldFilterConditionDto[];

  @ApiPropertyOptional({
    description: 'Match mode: all conditions (AND) or any condition (OR)',
    enum: ['AND', 'OR'],
    default: 'AND',
  })
  @IsOptional()
  @IsEnum(['AND', 'OR'])
  matchType?: 'AND' | 'OR' = 'AND';

  @ApiPropertyOptional({ description: 'Workspace isolation ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limit per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;
}
