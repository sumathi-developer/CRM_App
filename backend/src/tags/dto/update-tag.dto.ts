import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import { TagStatus } from '../enums/tag-status.enum';

export class UpdateTagDto {
  @ApiPropertyOptional({
    description: 'Updated tag name (must remain unique in workspace)',
    example: 'Enterprise Priority',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated hex color code',
    example: '#10b981',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'Color must be a valid hex color code (e.g. #3b82f6 or #fff)',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Updated description',
    example: 'Updated tag guidelines',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated tag status',
    enum: TagStatus,
  })
  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;

  @ApiPropertyOptional({
    description: 'Toggle protection status to lock or unlock tag deletion',
  })
  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;

  @ApiPropertyOptional({
    description: 'Reassign to a different workspace (or null for global)',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
