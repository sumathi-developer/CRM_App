import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LeadQueryDto {
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

  @ApiPropertyOptional({ example: 'Clark' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'NEW', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'WEBSITE', enum: ['WEBSITE', 'REFERRAL', 'COLD_OUTREACH', 'ADVERTISING', 'EVENT', 'OTHER'] })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'user-uuid-here' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
