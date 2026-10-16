import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export enum RoutingStrategy {
  ROUND_ROBIN = 'ROUND_ROBIN',
  SPECIFIC_USER = 'SPECIFIC_USER',
  LOAD_BALANCED = 'LOAD_BALANCED',
  SOURCE_BASED = 'SOURCE_BASED',
}

export class CreateAssignmentRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'Enterprise Inbound Round Robin' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Rule description', example: 'Rotates inbound website demo requests between senior account execs' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: RoutingStrategy,
    default: RoutingStrategy.ROUND_ROBIN,
    description: 'Routing assignment strategy',
  })
  @IsNotEmpty()
  @IsEnum(RoutingStrategy)
  routingStrategy: RoutingStrategy;

  @ApiProperty({
    description: 'List of User UUIDs eligible to receive leads under this rule',
    example: ['user-uuid-1', 'user-uuid-2'],
  })
  @IsNotEmpty()
  @IsArray()
  targetUserIds: string[];

  @ApiPropertyOptional({
    description: 'Conditions that lead must meet to trigger this rule (e.g. channel, source, estimatedValue)',
    example: [{ field: 'channel', operator: 'EQUALS', value: 'WEBSITE' }],
  })
  @IsOptional()
  conditions?: any;

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
