import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class CreatePipelineStageDto {
  @ApiProperty({ example: 'Demo Completed' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  winProbability?: number;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsString()
  color?: string;
}
