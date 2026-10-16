import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsObject,
} from 'class-validator';

export class PublicFormSubmitDto {
  @ApiProperty({ description: 'First Name', example: 'Alex' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ description: 'Last Name', example: 'Morgan' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Email address', example: 'alex.morgan@enterprise.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1 555-0199' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company / Organization name', example: 'Apex Technologies' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Title or subject of inquiry', example: 'Enterprise Demo Request' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Job Title / Designation', example: 'VP of Engineering' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Estimated deal value', example: 15000 })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiPropertyOptional({ description: 'Message or inquiry details', example: 'Interested in a live demo of the enterprise plan' })
  @IsOptional()
  @IsString()
  message?: string;

  // UTM attribution
  @ApiPropertyOptional({ example: 'google' })
  @IsOptional()
  @IsString()
  utmSource?: string;

  @ApiPropertyOptional({ example: 'cpc' })
  @IsOptional()
  @IsString()
  utmMedium?: string;

  @ApiPropertyOptional({ example: 'enterprise_q4' })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @ApiPropertyOptional({ example: 'banner_ad' })
  @IsOptional()
  @IsString()
  utmContent?: string;

  @ApiPropertyOptional({ example: 'crm software' })
  @IsOptional()
  @IsString()
  utmTerm?: string;

  @ApiPropertyOptional({ example: 'https://google.com' })
  @IsOptional()
  @IsString()
  referrer?: string;

  // Honeypot spam trap: Bots usually fill every field. Legitimate browsers hide this field via CSS.
  @ApiPropertyOptional({ description: 'Spam trap honeypot field (must be left empty by legitimate users)' })
  @IsOptional()
  @IsString()
  _hp_trap?: string;

  // Custom form field answers
  @ApiPropertyOptional({ description: 'Key-value map of any additional dynamic form fields' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
