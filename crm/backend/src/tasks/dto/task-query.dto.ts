import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TaskQueryDto {
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

  @ApiPropertyOptional({ example: 'Contract' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'PENDING', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'HIGH', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ example: 'lead-uuid' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ example: 'deal-uuid' })
  @IsOptional()
  @IsString()
  dealId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  assignedToId?: string;
}
