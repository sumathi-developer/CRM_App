import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ContactQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'Wayne' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'CUSTOMER', enum: ['LEAD', 'OPPORTUNITY', 'CUSTOMER', 'CHURNED'] })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional({ example: 'org-uuid-here' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'user-uuid-here' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
