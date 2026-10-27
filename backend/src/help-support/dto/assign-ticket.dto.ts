import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignTicketDto {
  @ApiProperty({ description: 'User UUID of the support agent or admin assigned to the ticket' })
  @IsUUID()
  assignedToId: string;
}
