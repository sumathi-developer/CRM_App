import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TagStatus } from '../enums/tag-status.enum';
import { TagEntityType } from '../enums/tag-entity-type.enum';

export class TagQueryDto {
  @ApiPropertyOptional({
    description: 'Search substring within tag name or description',
    example: 'Enterprise',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Alternative search alias for quick query parameter',
    example: 'lead',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by tag status',
    enum: TagStatus,
  })
  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;

  @ApiPropertyOptional({
    description: 'Filter by workspace ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({
    description: 'Filter tags attached to a specific CRM entity type',
    enum: TagEntityType,
  })
  @IsOptional()
  @IsEnum(TagEntityType)
  entityType?: TagEntityType;

  @ApiPropertyOptional({
    description: 'Filter by protected status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isProtected?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    default: 'createdAt',
    enum: ['name', 'createdAt', 'updatedAt', 'usageCount'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'createdAt', 'updatedAt', 'usageCount'])
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    default: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
