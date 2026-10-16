import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class ScorePreviewDto {
  @ApiProperty({
    description: 'Sample lead payload to calculate score for',
    example: {
      email: 'alex@enterprise.com',
      jobTitle: 'VP of Product',
      companyName: 'Acme Corp',
      estimatedValue: 20000,
      channel: 'WEBSITE',
      source: 'Google Ads',
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
