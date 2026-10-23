import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RenderTemplateDto {
  @ApiPropertyOptional({ description: 'Contact UUID to populate contact tokens' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Lead UUID to populate lead tokens' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Deal UUID to populate deal tokens' })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiPropertyOptional({ description: 'Organization / Company UUID to populate company tokens' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Custom key-value pairs to override or supplement template tokens',
    example: { 'deal.customDiscount': '15%' },
  })
  @IsOptional()
  variables?: Record<string, any>;
}
