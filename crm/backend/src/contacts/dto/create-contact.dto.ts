import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'Bruce' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Wayne' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'bruce@wayne.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1-555-0199' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'CEO' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Executive' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'LEAD', enum: ['LEAD', 'OPPORTUNITY', 'CUSTOMER', 'CHURNED'] })
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
