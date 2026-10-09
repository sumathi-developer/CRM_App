import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ example: 'CALL', enum: ['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'] })
  @IsNotEmpty()
  @IsIn(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'])
  type: string;

  @ApiProperty({ example: 'Discovery Demo Meeting' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({ example: 'Discuss platform features and architecture' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-10-10T15:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'PENDING', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsIn(['PENDING', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ example: 'MEDIUM', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ example: 'lead-uuid' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ example: 'deal-uuid' })
  @IsOptional()
  @IsString()
  dealId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  assignedToId?: string;
}
