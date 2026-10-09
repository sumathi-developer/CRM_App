import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class UpdateActivityDto {
  @ApiPropertyOptional({ example: 'MEETING', enum: ['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'] })
  @IsOptional()
  @IsIn(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'])
  type?: string;

  @ApiPropertyOptional({ example: 'Updated discovery call' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: 'Notes from follow up meeting' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-10-12T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: '2026-10-12T11:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({ example: 'COMPLETED', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsIn(['PENDING', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ example: 'HIGH', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  assignedToId?: string;
}
