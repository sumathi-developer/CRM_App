import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignmentRuleEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  routingStrategy: string;

  @ApiProperty()
  targetUserIds: any;

  @ApiPropertyOptional()
  lastAssignedUserId?: string;

  @ApiProperty()
  conditions: any;

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
