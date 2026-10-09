import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'sarah.updated@crm.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Sarah Connor Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+1987654320' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: string;

  @ApiPropertyOptional({ example: 'role-uuid' })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({ example: 'org-uuid' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}
