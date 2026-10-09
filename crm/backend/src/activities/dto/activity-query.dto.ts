import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ActivityQueryDto {
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

  @ApiPropertyOptional({ example: 'MEETING', enum: ['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'FOLLOW_UP'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'PENDING', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

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
