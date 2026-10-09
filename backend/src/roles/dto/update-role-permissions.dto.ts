import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateRolePermissionsDto {
  @ApiProperty({ example: ['perm-uuid-1', 'perm-uuid-2'], type: [String] })
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  permissionIds: string[];
}
