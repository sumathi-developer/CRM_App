import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Updated internal comment content',
    example: 'Updated: @alex contract has been approved.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Updated list of mentioned user UUIDs',
  })
  @IsOptional()
  @IsArray()
  mentionedUserIds?: string[];
}
