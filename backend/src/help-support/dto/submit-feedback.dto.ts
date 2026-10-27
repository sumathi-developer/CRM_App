import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { FeedbackType } from '../enums/feedback-type.enum';

export class SubmitFeedbackDto {
  @ApiPropertyOptional({
    description: 'Type of feedback',
    enum: FeedbackType,
    default: FeedbackType.GENERAL,
  })
  @IsOptional()
  @IsEnum(FeedbackType)
  type?: FeedbackType;

  @ApiPropertyOptional({
    description: 'Rating from 1 (poor) to 5 (excellent)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ description: 'Feedback details, description, or suggestion' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Related CRM module or feature',
    example: 'LEADS',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  module?: string;

  @ApiPropertyOptional({
    description: 'URL of the page where feedback was submitted',
    example: '/leads/pipeline',
  })
  @IsOptional()
  @IsString()
  pageUrl?: string;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
