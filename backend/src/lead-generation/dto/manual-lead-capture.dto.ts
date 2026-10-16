import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsObject,
  Min,
} from 'class-validator';

export class ManualLeadCaptureDto {
  @ApiProperty({ description: 'Lead Title / Subject', example: 'Enterprise Deal Inquiry - Trade Show' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'First name', example: 'Sarah' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Connor' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Work Email address', example: 'sarah.connor@cyberdyne.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1 800-555-0144' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company name', example: 'Cyberdyne Systems' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Estimated deal value', default: 0.0, example: 50000.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number = 0.0;

  @ApiPropertyOptional({
    description: 'Lead generation channel',
    default: 'MANUAL',
    enum: ['MANUAL', 'WEBSITE', 'LANDING_PAGE', 'CAMPAIGN', 'SOCIAL_MEDIA', 'EMAIL', 'REFERRAL', 'EVENT', 'OTHER'],
  })
  @IsOptional()
  @IsString()
  channel?: string = 'MANUAL';

  @ApiPropertyOptional({ description: 'Specific LeadSource ID if mapped' })
  @IsOptional()
  @IsString()
  leadSourceId?: string;

  @ApiPropertyOptional({ description: 'Campaign name', example: 'TechExpo 2026' })
  @IsOptional()
  @IsString()
  campaign?: string;

  @ApiPropertyOptional({ description: 'Medium/Sub-channel', example: 'booth_inquiry' })
  @IsOptional()
  @IsString()
  medium?: string;

  @ApiPropertyOptional({ description: 'Assigned sales owner User ID (if manually assigned)' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Notes on lead qualification or conversation details' })
  @IsOptional()
  @IsString()
  qualificationNotes?: string;

  @ApiPropertyOptional({ description: 'Custom attribution / UTM payload' })
  @IsOptional()
  @IsObject()
  attribution?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Optional workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
