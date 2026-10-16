import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubmissionQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter submissions by WebForm ID' })
  @IsOptional()
  @IsString()
  formId?: string;

  @ApiPropertyOptional({ description: 'Filter by submission status (PROCESSED, SPAM, DUPLICATE, FAILED, PENDING)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by spam flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSpam?: boolean;

  @ApiPropertyOptional({ description: 'Search inside submission payload (email, name, company)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
