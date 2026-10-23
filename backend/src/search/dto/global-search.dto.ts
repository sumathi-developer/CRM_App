import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class GlobalSearchDto {
  @ApiProperty({
    description: 'Search query string (matches across names, emails, companies, deals, notes, etc.)',
    example: 'Acme',
  })
  @IsString()
  @IsNotEmpty({ message: 'Search query "q" cannot be empty' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q: string;

  @ApiPropertyOptional({
    description: 'Filter specific entities (comma-separated or array, e.g. "leads,contacts,deals")',
    example: 'leads,contacts,deals,companies',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((v) => String(v).toUpperCase().trim());
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
    }
    return value;
  })
  entities?: string[];

  @ApiPropertyOptional({
    description: 'Perform exact phrase/word matching instead of partial fuzzy substring match',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  exact?: boolean;

  @ApiPropertyOptional({
    description: 'Target workspace UUID override (defaults to current active workspace)',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Page number for combined results', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of results to return', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
