import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsIn, IsNumber, Min } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'Enterprise Security Solution Inquiry' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Clark' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Kent' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'clark@dailyplanet.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1-555-0144' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Daily Planet' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'NEW', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'] })
  @IsOptional()
  @IsIn(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'])
  status?: string;

  @ApiPropertyOptional({ example: 'WEBSITE', enum: ['WEBSITE', 'REFERRAL', 'COLD_OUTREACH', 'ADVERTISING', 'EVENT', 'OTHER'] })
  @IsOptional()
  @IsIn(['WEBSITE', 'REFERRAL', 'COLD_OUTREACH', 'ADVERTISING', 'EVENT', 'OTHER'])
  source?: string;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadScore?: number;

  @ApiPropertyOptional({ example: 35000 })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
