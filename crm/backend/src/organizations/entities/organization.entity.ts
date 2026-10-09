import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationEntity {
  @ApiProperty({ example: 'org-uuid-1234' })
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  name: string;

  @ApiPropertyOptional({ example: 'acme.com' })
  domain?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  industry?: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  website?: string;

  @ApiPropertyOptional({ example: '+1 800-555-0100' })
  phone?: string;

  @ApiPropertyOptional({ example: '100 Main St' })
  address?: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
  city?: string;

  @ApiPropertyOptional({ example: 'USA' })
  country?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status: string;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
