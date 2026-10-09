import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({ example: 'b5c5e8b4-52d3-4a14-8f2c-e0cb201639c0' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  avatar?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  status: string;

  @ApiPropertyOptional({ example: 'role-uuid' })
  roleId?: string;

  @ApiPropertyOptional({ example: 'org-uuid' })
  organizationId?: string;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
