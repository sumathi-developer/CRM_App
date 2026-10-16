import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class QualificationConditionDto {
  @ApiProperty({ example: 'estimatedValue' })
  @IsNotEmpty()
  @IsString()
  field: string;

  @ApiProperty({ example: 'GREATER_THAN', enum: ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN', 'NOT_EMPTY'] })
  @IsNotEmpty()
  @IsString()
  operator: string;

  @ApiProperty({ example: '5000' })
  @IsNotEmpty()
  value: any;
}

export class CreateQualificationRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'Enterprise High-Potential Qualification' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Rule description', example: 'Qualifies leads with estimated value > $5,000 and score >= 40' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Target status to assign when qualified',
    default: 'QUALIFIED',
    enum: ['QUALIFIED', 'UNQUALIFIED', 'CONTACTED', 'REVIEW_REQUIRED'],
  })
  @IsOptional()
  @IsString()
  targetStatus?: string = 'QUALIFIED';

  @ApiPropertyOptional({ description: 'Minimum lead score required to qualify', example: 40 })
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional({
    description: 'List of conditional criteria that must be satisfied',
    example: [
      { field: 'estimatedValue', operator: 'GREATER_THAN', value: 5000 },
      { field: 'companyName', operator: 'NOT_EMPTY', value: '' },
      { field: 'phone', operator: 'NOT_EMPTY', value: '' },
    ],
  })
  @IsOptional()
  @IsArray()
  conditions?: QualificationConditionDto[];

  @ApiPropertyOptional({ description: 'Whether to automatically update the lead status to targetStatus upon passing', default: false })
  @IsOptional()
  @IsBoolean()
  autoQualify?: boolean = false;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Priority evaluation order', default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number = 0;

  @ApiPropertyOptional({ description: 'Optional workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
