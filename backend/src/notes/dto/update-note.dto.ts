import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Initial Discovery Call Notes - Updated' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated note content with additional stakeholder details.' })
  @IsOptional()
  @IsString()
  content?: string;
}
