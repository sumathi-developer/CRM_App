import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class DetachTagsDto {
  @ApiProperty({
    description: 'Array of tag UUIDs to detach from the entity',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'tagIds must contain at least one tag UUID to detach' })
  @IsUUID('4', { each: true, message: 'Each tagId must be a valid UUID' })
  tagIds: string[];
}
