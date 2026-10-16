import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsNumber, Min, IsUUID } from 'class-validator';

export class UpdateTeamDto {
  @ApiPropertyOptional({ example: 'Enterprise Strategic Accounts' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'enterprise-strategic-accounts' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Updated team description and scope' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/updated-team.png' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: '#10b981' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
  status?: string;

  @ApiPropertyOptional({ example: 500000, description: 'Updated revenue quota target' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetRevenue?: number;

  @ApiPropertyOptional({ example: 'user-uuid-new-leader', description: 'Reassign team leader' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ example: 'ws-uuid-1234' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ example: 'org-uuid-1234' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}
