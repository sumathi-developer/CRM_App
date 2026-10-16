import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeadSourceEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  cost?: number;

  @ApiPropertyOptional()
  utmSource?: string;

  @ApiPropertyOptional()
  utmMedium?: string;

  @ApiPropertyOptional()
  utmCampaign?: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiPropertyOptional()
  metadata?: any;

  @ApiPropertyOptional()
  workspaceId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
