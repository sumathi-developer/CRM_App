import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RouteLeadDto {
  @ApiPropertyOptional({ description: 'Optional specific AssignmentRule ID to execute (if omitted, best matching rule is chosen)' })
  @IsOptional()
  @IsString()
  ruleId?: string;

  @ApiPropertyOptional({ description: 'Direct user assignment override' })
  @IsOptional()
  @IsString()
  targetUserId?: string;
}
