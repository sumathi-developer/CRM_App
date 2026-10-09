import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'SUPPORT_LEAD' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Customer support lead with read access to contacts' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['perm-uuid-1', 'perm-uuid-2'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}
