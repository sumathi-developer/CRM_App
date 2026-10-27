import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FeedbackType } from '../enums/feedback-type.enum';
import { FeedbackStatus } from '../enums/feedback-status.enum';

export class FeedbackQueryDto {
  @ApiPropertyOptional({ description: 'Search in feedback description or module' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by feedback type', enum: FeedbackType })
  @IsOptional()
  @IsEnum(FeedbackType)
  type?: FeedbackType;

  @ApiPropertyOptional({ description: 'Filter by feedback status', enum: FeedbackStatus })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiPropertyOptional({ description: 'Filter by module', example: 'LEADS' })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ description: 'Filter by workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
