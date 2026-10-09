import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskEntity {
  @ApiProperty({ example: 'task-uuid-1' })
  id: string;

  @ApiProperty({ example: 'Follow up on NDA signature' })
  title: string;

  @ApiPropertyOptional({ example: 'Check in with legal and send reminder' })
  description?: string;

  @ApiPropertyOptional({ example: '2026-10-15T18:00:00.000Z' })
  dueDate?: Date;

  @ApiPropertyOptional({ example: null })
  completedAt?: Date;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  status: string;

  @ApiProperty({ example: 'HIGH', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  priority: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  contactId?: string;

  @ApiPropertyOptional({ example: 'lead-uuid' })
  leadId?: string;

  @ApiPropertyOptional({ example: 'deal-uuid' })
  dealId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  assignedToId?: string;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
