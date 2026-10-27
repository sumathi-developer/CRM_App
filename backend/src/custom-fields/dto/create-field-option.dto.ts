import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFieldOptionDto {
  @ApiProperty({ description: 'Option display label', example: 'Enterprise' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Option stored value', example: 'enterprise' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: 'Hex or CSS color code', example: '#8b5cf6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: 'Whether this option is selected by default', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
