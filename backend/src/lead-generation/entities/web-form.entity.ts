import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebFormEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  formType: string;

  @ApiProperty()
  fields: any;

  @ApiProperty()
  styling: any;

  @ApiProperty()
  settings: any;

  @ApiPropertyOptional()
  defaultSourceId?: string;

  @ApiPropertyOptional()
  defaultOwnerId?: string;

  @ApiPropertyOptional()
  campaignName?: string;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty()
  submissionsCount: number;

  @ApiProperty()
  conversionRate: number;

  @ApiProperty()
  isPublished: boolean;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiPropertyOptional()
  workspaceId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
