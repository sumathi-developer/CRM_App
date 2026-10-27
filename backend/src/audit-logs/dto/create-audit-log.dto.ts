import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  MaxLength,
} from 'class-validator';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntityType } from '../enums/audit-entity-type.enum';
import { AuditStatus } from '../enums/audit-status.enum';

export class CreateAuditLogDto {
  @ApiProperty({
    description: 'The type of action performed',
    enum: AuditAction,
    example: AuditAction.CREATE,
  })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty({
    description: 'The target CRM entity category',
    enum: AuditEntityType,
    example: AuditEntityType.LEAD,
  })
  @IsEnum(AuditEntityType)
  entityType: AuditEntityType;

  @ApiPropertyOptional({
    description: 'UUID of the target entity if applicable',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Human-readable label or title of the target entity',
    example: 'Acme Corporation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  entityName?: string;

  @ApiPropertyOptional({
    description: 'Additional structured context, field diffs (previous vs new values), or reason',
    example: { diff: { status: { old: 'NEW', new: 'QUALIFIED' } } },
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Action execution status',
    enum: AuditStatus,
    default: AuditStatus.SUCCESS,
  })
  @IsOptional()
  @IsEnum(AuditStatus)
  status?: AuditStatus;

  @ApiPropertyOptional({
    description: 'Explicit workspace context if different from active user workspace',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({
    description: 'IP address of the client triggering the action',
    example: '192.168.1.10',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User Agent string of the client',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
