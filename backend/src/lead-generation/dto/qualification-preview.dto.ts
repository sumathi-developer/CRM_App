import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class QualificationPreviewDto {
  @ApiProperty({
    description: 'Sample lead object to evaluate against qualification rules',
    example: {
      leadScore: 65,
      estimatedValue: 12000,
      phone: '+1 555-0199',
      companyName: 'Acme Corp',
      status: 'NEW',
    },
  })
  @IsNotEmpty()
  @IsObject()
  lead: Record<string, any>;

  @ApiPropertyOptional({ description: 'Optional workspace ID to scope rules' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
