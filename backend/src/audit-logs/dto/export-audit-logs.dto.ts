import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { AuditLogQueryDto } from './audit-log-query.dto';

export class ExportAuditLogsDto extends AuditLogQueryDto {
  @ApiPropertyOptional({
    description: 'Export format: JSON or CSV',
    default: 'JSON',
    enum: ['JSON', 'CSV'],
  })
  @IsOptional()
  @IsIn(['JSON', 'CSV'])
  format?: 'JSON' | 'CSV' = 'JSON';
}
