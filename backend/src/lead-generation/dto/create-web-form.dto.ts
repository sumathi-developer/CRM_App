import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsBoolean,
} from 'class-validator';

export enum FormType {
  WEB_FORM = 'WEB_FORM',
  LANDING_PAGE = 'LANDING_PAGE',
  POPUP = 'POPUP',
  EMBEDDED = 'EMBEDDED',
}

export enum FormStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class FormFieldDto {
  @ApiProperty({ example: 'email' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Work Email Address' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: 'email', enum: ['text', 'email', 'phone', 'textarea', 'select', 'number', 'checkbox'] })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean = true;

  @ApiPropertyOptional({ example: 'name@company.com' })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional({ example: ['Option 1', 'Option 2'] })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  defaultValue?: any;
}

export class CreateWebFormDto {
  @ApiProperty({ description: 'Internal name of the form', example: 'Contact Us - Enterprise' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Public URL slug identifier', example: 'contact-enterprise' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Public heading / display title of the form', example: 'Get in Touch with Our Enterprise Sales Team' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Subheading or instructions', example: 'Fill out this form and we will get back to you within 24 hours.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: FormStatus, default: FormStatus.DRAFT })
  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus = FormStatus.DRAFT;

  @ApiPropertyOptional({ enum: FormType, default: FormType.WEB_FORM })
  @IsOptional()
  @IsEnum(FormType)
  formType?: FormType = FormType.WEB_FORM;

  @ApiPropertyOptional({
    description: 'Array of form fields definitions',
    example: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Work Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'phone', required: false },
      { name: 'companyName', label: 'Company Name', type: 'text', required: false },
      { name: 'message', label: 'How can we help you?', type: 'textarea', required: false },
    ],
  })
  @IsOptional()
  @IsArray()
  fields?: FormFieldDto[];

  @ApiPropertyOptional({
    description: 'Visual styling settings',
    example: {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      buttonText: 'Submit Inquiry',
      darkMode: false,
    },
  })
  @IsOptional()
  @IsObject()
  styling?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Form behavior settings',
    example: {
      successMessage: 'Thank you! A representative will reach out shortly.',
      redirectUrl: 'https://example.com/thank-you',
      notifyEmails: ['sales@example.com'],
      emailNotification: true,
      duplicateHandling: 'UPDATE', // MERGE, UPDATE, ALLOW, REJECT
      autoScore: true,
      autoQualify: true,
      autoRoute: true,
    },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Associated default LeadSource ID' })
  @IsOptional()
  @IsString()
  defaultSourceId?: string;

  @ApiPropertyOptional({ description: 'Default sales owner User ID for direct assignment fallback' })
  @IsOptional()
  @IsString()
  defaultOwnerId?: string;

  @ApiPropertyOptional({ description: 'Campaign name associated with this form', example: 'Q4 Enterprise Inbound' })
  @IsOptional()
  @IsString()
  campaignName?: string;

  @ApiPropertyOptional({ description: 'Optional workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
