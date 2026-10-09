import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'SUPPORT_SENIOR_LEAD' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description for this role' })
  @IsOptional()
  @IsString()
  description?: string;
}
