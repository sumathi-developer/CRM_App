import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InviteUserDto {
  @ApiProperty({ example: 'colleague@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: 'role-uuid' })
  @IsOptional()
  @IsString()
  roleId?: string;
}
