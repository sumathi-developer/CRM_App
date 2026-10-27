import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FeedbackStatus } from '../enums/feedback-status.enum';

export class UpdateFeedbackDto {
  @ApiPropertyOptional({
    description: 'Updated feedback status',
    enum: FeedbackStatus,
  })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiPropertyOptional({
    description: 'Internal admin notes (visible only to support/admin)',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
