import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsUUID,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';
import { TagEntityType } from '../enums/tag-entity-type.enum';

export class BulkTagAssignDto {
  @ApiProperty({
    description: 'Target CRM entity type (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY, DOCUMENT)',
    enum: TagEntityType,
  })
  @IsEnum(TagEntityType)
  entityType: TagEntityType;

  @ApiProperty({
    description: 'Array of entity UUIDs to attach tags to',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'entityIds must contain at least one entity UUID' })
  @IsUUID('4', { each: true })
  entityIds: string[];

  @ApiProperty({
    description: 'Array of tag UUIDs to attach to all specified entities',
    example: ['234e5678-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'tagIds must contain at least one tag UUID' })
  @IsUUID('4', { each: true })
  tagIds: string[];

  @ApiPropertyOptional({
    description: 'Optional workspace isolation context',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
