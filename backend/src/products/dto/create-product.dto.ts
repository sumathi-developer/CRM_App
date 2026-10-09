import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Enterprise Cloud License' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'SKU-CLOUD-ENT' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({ example: 'Annual enterprise subscription tier' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 4999.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 100, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;
}
