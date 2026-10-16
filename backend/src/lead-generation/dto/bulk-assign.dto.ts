import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class BulkAssignDto {
  @ApiProperty({ description: 'Array of Lead UUIDs to assign', example: ['lead-uuid-1', 'lead-uuid-2'] })
  @IsNotEmpty()
  @IsArray()
  leadIds: string[];

  @ApiPropertyOptional({ description: 'Specific target User ID (if omitted, automated routing rules will evaluate each lead)' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Specific AssignmentRule ID to use' })
  @IsOptional()
  @IsString()
  ruleId?: string;
}
