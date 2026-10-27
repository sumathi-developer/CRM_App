import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import { TagStatus } from '../enums/tag-status.enum';

export class CreateTagDto {
  @ApiProperty({
    description: 'Tag name (unique per workspace)',
    example: 'High Priority',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Hex color code for the tag badge',
    example: '#3b82f6',
    default: '#3b82f6',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'Color must be a valid hex color code (e.g. #3b82f6 or #fff)',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Optional tag description or guidelines for use',
    example: 'Applied to enterprise prospects with deal size > $50,000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Tag status',
    enum: TagStatus,
    default: TagStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;

  @ApiPropertyOptional({
    description: 'If protected, deletion is blocked to prevent breaking core workflows',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;

  @ApiPropertyOptional({
    description: 'Workspace ID to scope this tag to a specific workspace',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
