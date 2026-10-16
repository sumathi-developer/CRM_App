import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateWorkspaceRoleDto {
  @ApiProperty({ example: 'Sales Manager', description: 'Workspace role name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Can manage pipeline, deals, contacts and invite reps' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: [
      'workspace:read',
      'members:read',
      'members:invite',
      'contacts:read',
      'contacts:write',
      'deals:read',
      'deals:write',
      'reports:read',
    ],
    description: 'Array of granular permission keys',
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
