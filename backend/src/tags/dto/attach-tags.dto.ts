import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsUUID,
  IsOptional,
  ArrayNotEmpty,
  ValidateIf,
} from 'class-validator';

export class AttachTagsDto {
  @ApiPropertyOptional({
    description: 'Array of existing tag UUIDs to attach to the entity',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @ValidateIf((o) => !o.tagNames || o.tagNames.length === 0)
  @IsArray()
  @ArrayNotEmpty({ message: 'Either tagIds or tagNames must be provided' })
  @IsUUID('4', { each: true, message: 'Each tagId must be a valid UUID' })
  tagIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of tag names to attach (automatically creates new tags if they do not exist)',
    example: ['VIP', 'Hot Deal'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];

  @ApiPropertyOptional({
    description: 'Workspace context for the tag attachment',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
