import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderOptionsDto {
  @ApiProperty({
    description: 'Array of option IDs in the desired display order',
    example: ['opt-uuid-1', 'opt-uuid-2', 'opt-uuid-3'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  orderedOptionIds: string[];
}
