import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class ConvertContactDto {
  @ApiPropertyOptional({ example: 'Enterprise Cloud Deal' })
  @IsOptional()
  @IsString()
  dealTitle?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  dealValue?: number;

  @ApiPropertyOptional({ example: 'pipeline-uuid' })
  @IsOptional()
  @IsString()
  pipelineId?: string;

  @ApiPropertyOptional({ example: 'stage-uuid' })
  @IsOptional()
  @IsString()
  stageId?: string;
}
