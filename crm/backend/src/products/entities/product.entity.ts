import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductEntity {
  @ApiProperty({ example: 'product-uuid-1' })
  id: string;

  @ApiProperty({ example: 'Enterprise Cloud License' })
  name: string;

  @ApiProperty({ example: 'SKU-CLOUD-ENT' })
  sku: string;

  @ApiPropertyOptional({ example: 'Annual enterprise subscription tier' })
  description?: string;

  @ApiProperty({ example: 4999.0 })
  price: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 100 })
  stockQuantity: number;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
