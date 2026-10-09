import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdatePipelineStageDto {
  @ApiPropertyOptional({ example: 'Demo Completed & Follow-up' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  winProbability?: number;

  @ApiPropertyOptional({ example: '#10b981' })
  @IsOptional()
  @IsString()
  color?: string;
}
