import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { FormStatus, FormType } from './create-web-form.dto';

export class WebFormQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by form name, title, or slug' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: FormStatus })
  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @ApiPropertyOptional({ enum: FormType })
  @IsOptional()
  @IsEnum(FormType)
  formType?: FormType;

  @ApiPropertyOptional({ description: 'Filter by workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
