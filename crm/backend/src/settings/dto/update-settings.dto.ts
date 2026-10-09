import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ example: 'company_name' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Acme Enterprise CRM' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ example: 'GENERAL' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
