import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeadEntity {
  @ApiProperty({ example: 'lead-uuid-1' })
  id: string;

  @ApiProperty({ example: 'Enterprise Cloud Migration' })
  title: string;

  @ApiProperty({ example: 'Clark' })
  firstName: string;

  @ApiProperty({ example: 'Kent' })
  lastName: string;

  @ApiProperty({ example: 'clark@dailyplanet.com' })
  email: string;

  @ApiPropertyOptional({ example: '+1-555-0144' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Daily Planet News' })
  companyName?: string;

  @ApiProperty({ example: 'NEW', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'] })
  status: string;

  @ApiProperty({ example: 'WEBSITE', enum: ['WEBSITE', 'REFERRAL', 'COLD_OUTREACH', 'ADVERTISING', 'EVENT', 'OTHER'] })
  source: string;

  @ApiProperty({ example: 85 })
  leadScore: number;

  @ApiPropertyOptional({ example: 25000 })
  estimatedValue?: number;

  @ApiPropertyOptional({ example: 'user-uuid' })
  ownerId?: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  convertedContactId?: string;

  @ApiPropertyOptional({ example: 'deal-uuid' })
  convertedDealId?: string;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
