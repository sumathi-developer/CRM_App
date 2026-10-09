import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class ConvertLeadDto {
  @ApiPropertyOptional({ example: 'Create new organization if company name specified' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'New Enterprise Deal from Lead' })
  @IsOptional()
  @IsString()
  dealTitle?: string;

  @ApiPropertyOptional({ example: 45000 })
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
