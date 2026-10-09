import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class CreateCalendarEventDto {
  @ApiProperty({ example: 'MEETING', enum: ['MEETING', 'CALL', 'EMAIL', 'FOLLOW_UP', 'TASK'] })
  @IsNotEmpty()
  @IsIn(['MEETING', 'CALL', 'EMAIL', 'FOLLOW_UP', 'TASK'])
  type: string;

  @ApiProperty({ example: 'Client Demo & Architecture Walkthrough' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Detailed demonstration of product features and answering security queries' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-10-10T14:00:00.000Z', description: 'Scheduled start date and time' })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ example: '2026-10-10T15:00:00.000Z', description: 'Optional end date and time' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

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

  @ApiPropertyOptional({ example: 'user-uuid', description: 'Assigned user ID, defaults to current user' })
  @IsOptional()
  @IsString()
  assignedToId?: string;
}
