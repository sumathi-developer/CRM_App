import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export enum ScoringCategory {
  DEMOGRAPHIC = 'DEMOGRAPHIC',
  FIRMOGRAPHIC = 'FIRMOGRAPHIC',
  BEHAVIORAL = 'BEHAVIORAL',
  SOURCE = 'SOURCE',
}

export enum RuleOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  IN = 'IN',
  NOT_EMPTY = 'NOT_EMPTY',
  REGEX = 'REGEX',
}

export class CreateScoringRuleDto {
  @ApiProperty({ description: 'Descriptive rule name', example: 'Executive / Decision Maker Job Title' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Rule description', example: 'Awards +25 points if the lead has a C-level or Director title' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ScoringCategory, default: ScoringCategory.DEMOGRAPHIC })
  @IsNotEmpty()
  @IsEnum(ScoringCategory)
  category: ScoringCategory;

  @ApiProperty({
    description: 'Lead field to inspect',
    example: 'jobTitle',
    enum: ['jobTitle', 'companyName', 'email', 'estimatedValue', 'channel', 'source', 'phone', 'country'],
  })
  @IsNotEmpty()
  @IsString()
  conditionField: string;

  @ApiProperty({ enum: RuleOperator, default: RuleOperator.CONTAINS })
  @IsNotEmpty()
  @IsEnum(RuleOperator)
  operator: RuleOperator;

  @ApiProperty({ description: 'Value or comma-separated list of values to match against', example: 'CEO,CTO,VP,Director,Founder' })
  @IsNotEmpty()
  @IsString()
  conditionValue: string;

  @ApiProperty({ description: 'Points to add (or subtract if negative)', example: 25 })
  @IsNotEmpty()
  @IsNumber()
  scoreChange: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Evaluation priority order (higher priority evaluated first)', default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number = 0;

  @ApiPropertyOptional({ description: 'Optional workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
