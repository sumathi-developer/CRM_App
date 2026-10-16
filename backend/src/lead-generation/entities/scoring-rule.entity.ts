import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScoringRuleEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  conditionField: string;

  @ApiProperty()
  operator: string;

  @ApiProperty()
  conditionValue: string;

  @ApiProperty()
  scoreChange: number;

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
