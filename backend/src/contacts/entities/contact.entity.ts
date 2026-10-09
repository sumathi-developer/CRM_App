import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactEntity {
  @ApiProperty({ example: 'contact-uuid-1' })
  id: string;

  @ApiProperty({ example: 'Bruce' })
  firstName: string;

  @ApiProperty({ example: 'Wayne' })
  lastName: string;

  @ApiProperty({ example: 'bruce@wayneenterprises.com' })
  email: string;

  @ApiPropertyOptional({ example: '+1-555-0199' })
  phone?: string;

  @ApiPropertyOptional({ example: 'CEO' })
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Executive Management' })
  department?: string;

  @ApiProperty({ example: 'CUSTOMER', enum: ['LEAD', 'OPPORTUNITY', 'CUSTOMER', 'CHURNED'] })
  stage: string;

  @ApiPropertyOptional({ example: 'org-uuid-1' })
  organizationId?: string;

  @ApiPropertyOptional({ example: 'user-uuid-1' })
  ownerId?: string;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
