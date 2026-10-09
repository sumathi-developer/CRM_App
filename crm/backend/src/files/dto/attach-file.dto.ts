import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class AttachFileDto {
  @ApiProperty({ example: 'DEAL', enum: ['CONTACT', 'LEAD', 'DEAL', 'ORGANIZATION'] })
  @IsNotEmpty()
  @IsIn(['CONTACT', 'LEAD', 'DEAL', 'ORGANIZATION'])
  entityType: string;

  @ApiProperty({ example: 'entity-uuid-here' })
  @IsNotEmpty()
  @IsString()
  entityId: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ example: 'lead-uuid' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ example: 'deal-uuid' })
  @IsOptional()
  @IsString()
  dealId?: string;
}
