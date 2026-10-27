import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditLogCleanupDto {
  @ApiPropertyOptional({
    description: 'Delete audit logs older than this number of days (minimum 7 days)',
    default: 90,
    minimum: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  olderThanDays?: number = 90;

  @ApiPropertyOptional({
    description: 'Optional workspace isolation filter for cleanup',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
