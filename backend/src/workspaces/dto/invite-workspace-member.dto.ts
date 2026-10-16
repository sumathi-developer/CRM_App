import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsEmail, IsString } from 'class-validator';

export class InviteWorkspaceMemberDto {
  @ApiProperty({ example: 'colleague@company.com', description: 'Email address of invitee' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    example: 'MEMBER',
    default: 'MEMBER',
    description: 'Assigned role name (e.g. ADMIN, MEMBER, VIEWER, or custom role name)',
  })
  @IsOptional()
  @IsString()
  role?: string = 'MEMBER';

  @ApiPropertyOptional({
    example: 'role-uuid-1234',
    description: 'Specific WorkspaceRole UUID (optional)',
  })
  @IsOptional()
  @IsString()
  roleId?: string;
}
