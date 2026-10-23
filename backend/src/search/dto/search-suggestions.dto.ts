import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class SearchSuggestionsDto {
  @ApiProperty({
    description: 'Partial query string to fetch suggestions/autocomplete for',
    example: 'ac',
  })
  @IsString()
  @IsNotEmpty({ message: 'Prefix query "q" cannot be empty' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q: string;

  @ApiPropertyOptional({
    description: 'Optional comma-separated entity filter (e.g. "leads,contacts,deals")',
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

  @ApiPropertyOptional({ description: 'Target workspace UUID override' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Maximum suggestions to return', default: 8, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 8;
}
