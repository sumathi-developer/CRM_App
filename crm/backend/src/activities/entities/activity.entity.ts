import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityEntity {
  @ApiProperty({ example: 'activity-uuid-1' })
  id: string;

  @ApiProperty({ example: 'CALL', enum: ['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'] })
  type: string;

  @ApiProperty({ example: 'Initial Discovery Call' })
  subject: string;

  @ApiPropertyOptional({ example: 'Discuss Q4 cloud roadmap and budget' })
  description?: string;

  @ApiPropertyOptional({ example: '2026-10-09T14:00:00.000Z' })
  scheduledAt?: Date;

  @ApiPropertyOptional({ example: null })
  completedAt?: Date;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] })
  status: string;

  @ApiProperty({ example: 'MEDIUM', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  priority: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  contactId?: string;

  @ApiPropertyOptional({ example: 'lead-uuid' })
  leadId?: string;

  @ApiPropertyOptional({ example: 'deal-uuid' })
  dealId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  createdById?: string;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
