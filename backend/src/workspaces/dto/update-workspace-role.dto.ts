import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateWorkspaceRoleDto {
  @ApiPropertyOptional({ example: 'Senior Sales Lead' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description for the role' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: ['workspace:read', 'contacts:read', 'deals:read', 'deals:write'],
    description: 'Updated array of permission keys',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
