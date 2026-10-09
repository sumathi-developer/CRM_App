import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateContactDto {
  @ApiPropertyOptional({ example: 'Bruce' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Wayne' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'bruce@wayne.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-0199' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Chairman & CEO' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Executive Board' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'CUSTOMER', enum: ['LEAD', 'OPPORTUNITY', 'CUSTOMER', 'CHURNED'] })
  @IsOptional()
  @IsIn(['LEAD', 'OPPORTUNITY', 'CUSTOMER', 'CHURNED'])
  stage?: string;

  @ApiPropertyOptional({ example: 'org-uuid-here' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'user-uuid-here' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
