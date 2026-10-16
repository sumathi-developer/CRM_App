import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QualificationRuleEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  targetStatus: string;

  @ApiPropertyOptional()
  minScore?: number;

  @ApiProperty()
  conditions: any;

  @ApiProperty()
  autoQualify: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  priority: number;

  @ApiPropertyOptional()
  workspaceId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
