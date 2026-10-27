import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from '../enums/ticket-status.enum';

export class UpdateTicketStatusDto {
  @ApiProperty({ description: 'New status for the ticket', enum: TicketStatus })
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @ApiPropertyOptional({ description: 'Optional explanation for status transition' })
  @IsOptional()
  @IsString()
  reason?: string;
}
