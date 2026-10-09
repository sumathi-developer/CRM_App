import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PipelineEntity {
  @ApiProperty({ example: 'pipeline-uuid-1' })
  id: string;

  @ApiProperty({ example: 'Standard Sales Pipeline' })
  name: string;

  @ApiPropertyOptional({ example: 'Main B2B enterprise pipeline' })
  description?: string;

  @ApiProperty({ example: true })
  isDefault: boolean;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
