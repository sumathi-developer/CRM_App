import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsIn, IsNumber, Min } from 'class-validator';

export class UpdateLeadDto {
  @ApiPropertyOptional({ example: 'Enterprise Security Solution Updated' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Clark' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Kent' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'clark@dailyplanet.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-0144' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Daily Planet Media Group' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'QUALIFIED', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'] })
  @IsOptional()
  @IsIn(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'])
  status?: string;

  @ApiPropertyOptional({ example: 'REFERRAL', enum: ['WEBSITE', 'REFERRAL', 'COLD_OUTREACH', 'ADVERTISING', 'EVENT', 'OTHER'] })
  @IsOptional()
  @IsIn(['WEBSITE', 'REFERRAL', 'COLD_OUTREACH', 'ADVERTISING', 'EVENT', 'OTHER'])
  source?: string;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadScore?: number;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
