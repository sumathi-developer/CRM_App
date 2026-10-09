import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DealQueryDto {
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

  @ApiPropertyOptional({ example: 'Security' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'OPEN', enum: ['OPEN', 'WON', 'LOST'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'stage-uuid' })
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiPropertyOptional({ example: 'pipeline-uuid' })
  @IsOptional()
  @IsString()
  pipelineId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
