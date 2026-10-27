import { IsEnum, IsNotEmpty, IsOptional, IsBoolean, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CreateOptionItemDto } from './create-custom-field.dto';

export enum TypeMigrationStrategy {
  PRESERVE = 'PRESERVE',
  CLEAR_INCOMPATIBLE = 'CLEAR_INCOMPATIBLE',
  STRINGIFY = 'STRINGIFY',
}

export class ChangeFieldTypeDto {
  @ApiProperty({
    description: 'Target custom field type to convert to',
    enum: CustomFieldType,
    example: CustomFieldType.LONG_TEXT,
  })
  @IsEnum(CustomFieldType)
  @IsNotEmpty()
  targetType: CustomFieldType;

  @ApiPropertyOptional({
    description: 'Strategy for handling values that cannot be cleanly parsed in new type',
    enum: TypeMigrationStrategy,
    default: TypeMigrationStrategy.PRESERVE,
  })
  @IsOptional()
  @IsEnum(TypeMigrationStrategy)
  strategy?: TypeMigrationStrategy = TypeMigrationStrategy.PRESERVE;

  @ApiPropertyOptional({
    description: 'If true, proceeds with migration even if some values fail conversion',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean = false;

  @ApiPropertyOptional({
    description: 'If true, only returns conversion preview simulation without writing database changes',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;

  @ApiPropertyOptional({
    description: 'New options required if migrating to DROPDOWN, MULTI_SELECT, or RADIO',
    type: [CreateOptionItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionItemDto)
  newOptions?: CreateOptionItemDto[];
}
