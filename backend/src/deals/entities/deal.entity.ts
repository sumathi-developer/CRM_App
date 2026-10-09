import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DealEntity {
  @ApiProperty({ example: 'deal-uuid-1' })
  id: string;

  @ApiProperty({ example: 'Global Cloud Infrastructure Expansion' })
  title: string;

  @ApiProperty({ example: 125000 })
  value: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiPropertyOptional({ example: 'stage-uuid' })
  stageId?: string;

  @ApiPropertyOptional({ example: 'pipeline-uuid' })
  pipelineId?: string;

  @ApiProperty({ example: 'OPEN', enum: ['OPEN', 'WON', 'LOST'] })
  status: string;

  @ApiProperty({ example: 65 })
  probability: number;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  expectedCloseDate?: Date;

  @ApiPropertyOptional({ example: null })
  closedAt?: Date;

  @ApiPropertyOptional({ example: 'org-uuid' })
  organizationId?: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  contactId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  ownerId?: string;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
