import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ description: 'FAQ Question', example: 'How do I invite team members to my workspace?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  question: string;

  @ApiProperty({ description: 'Detailed Answer (supports markdown or rich text)' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ description: 'Category grouping', example: 'ACCOUNT', default: 'GENERAL' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: 'Publish status', default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
