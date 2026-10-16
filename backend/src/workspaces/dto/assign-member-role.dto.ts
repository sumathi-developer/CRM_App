import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignMemberRoleDto {
  @ApiProperty({
    example: 'ADMIN',
    description: 'Workspace role name (e.g. OWNER, ADMIN, MEMBER, VIEWER, or custom role name)',
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({
    example: 'a0b1c2d3-e4f5-4a5b-8c9d-0e1f2a3b4c5d',
    description: 'WorkspaceRole UUID (optional, if assigning custom role)',
  })
  @IsOptional()
  @IsString()
  roleId?: string;
}
