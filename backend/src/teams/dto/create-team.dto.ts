import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn, IsNumber, Min, IsArray, IsUUID } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 'Enterprise Sales Alpha', description: 'Name of the sales or operations team' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'enterprise-sales-alpha', description: 'URL-friendly slug (auto-generated if omitted)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Team handling Fortune 500 accounts and tier 1 enterprise software deals' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/team-avatar.png', description: 'Team icon or avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: '#3b82f6', default: '#3b82f6', description: 'Hex color code for team branding' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'], default: 'ACTIVE' })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
  status?: string;

  @ApiPropertyOptional({ example: 250000, default: 0, description: 'Quarterly or annual revenue target' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetRevenue?: number;

  @ApiPropertyOptional({ example: 'b0e008ff-7ad7-4e6e-a226-f7a3f5a11111', description: 'User UUID of team leader (defaults to creator if omitted)' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ example: 'ws-uuid-1234', description: 'Workspace UUID to which the team belongs' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ example: 'org-uuid-1234', description: 'Organization UUID to which the team belongs' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({
    example: ['user-uuid-1', 'user-uuid-2'],
    description: 'Initial member User UUIDs to enroll into the team',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberUserIds?: string[];
}
