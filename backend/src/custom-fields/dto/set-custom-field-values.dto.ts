import { IsOptional, IsObject, IsArray, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CustomFieldValueItemDto {
  @ApiPropertyOptional({ description: 'Custom field ID', example: 'field-uuid-1' })
  @IsOptional()
  @IsString()
  fieldId?: string;

  @ApiPropertyOptional({ description: 'Custom field unique key', example: 'budget_estimate' })
  @IsOptional()
  @IsString()
  fieldKey?: string;

  @ApiPropertyOptional({ description: 'Value to set (type validated against field definition)', example: 75000 })
  value: any;
}

export class SetCustomFieldValuesDto {
  @ApiPropertyOptional({
    description: 'Dictionary of fieldKey: value pairs',
    example: {
      budget_estimate: 75000,
      client_tier: 'enterprise',
      is_partner_referred: true,
    },
  })
  @IsOptional()
  @IsObject()
  values?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Alternative array format for setting values',
    type: [CustomFieldValueItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldValueItemDto)
  items?: CustomFieldValueItemDto[];
}
