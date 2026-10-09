import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max, IsDateString, IsIn } from 'class-validator';

export class CreateDealDto {
  @ApiProperty({ example: 'Enterprise Security Agreement' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 75000 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'pipeline-uuid' })
  @IsOptional()
  @IsString()
  pipelineId?: string;

  @ApiPropertyOptional({ example: 'stage-uuid' })
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiPropertyOptional({ example: 40, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({ example: '2026-12-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional({ example: 'org-uuid' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
