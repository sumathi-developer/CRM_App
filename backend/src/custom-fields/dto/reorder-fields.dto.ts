import { IsArray, ValidateNested, IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldOrderItemDto {
  @ApiProperty({ description: 'Custom field ID', example: 'field-uuid-1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'New order index', example: 0 })
  @IsInt()
  order: number;

  @ApiPropertyOptional({ description: 'Optional new section name to move field to', example: 'Financials' })
  @IsOptional()
  @IsString()
  section?: string;
}

export class ReorderFieldsDto {
  @ApiProperty({
    description: 'Array of fields with their updated order indexes and optional sections',
    type: [FieldOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldOrderItemDto)
  items: FieldOrderItemDto[];
}
