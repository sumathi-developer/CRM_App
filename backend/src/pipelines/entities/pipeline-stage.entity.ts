import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PipelineStageEntity {
  @ApiProperty({ example: 'stage-uuid-1' })
  id: string;

  @ApiProperty({ example: 'pipeline-uuid-1' })
  pipelineId: string;

  @ApiProperty({ example: 'Qualified Prospect' })
  name: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 25 })
  winProbability: number;

  @ApiPropertyOptional({ example: '#3b82f6' })
  color?: string;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
