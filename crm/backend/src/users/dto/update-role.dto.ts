import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'role-uuid-here', description: 'Role ID to assign to the user' })
  @IsString()
  @IsNotEmpty()
  roleId: string;
}
