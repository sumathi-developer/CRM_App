import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { createPaginatedResponse } from '../common/utils/response.util';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { sku: { contains: query.search } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { deals: true } },
        },
      }),
    ]);

    return createPaginatedResponse(products, total, page, limit);
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) {
      throw new ConflictException(`Product with SKU '${dto.sku}' already exists`);
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || 'USD',
        isActive: dto.isActive ?? true,
        stockQuantity: dto.stockQuantity ?? 0,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        deals: {
          include: { deal: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`SKU '${dto.sku}' is already in use`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { message: `Product with ID ${id} successfully deleted` };
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive },
    });
  }

  async getDeals(id: string) {
    await this.findOne(id);
    const dealProducts = await this.prisma.dealProduct.findMany({
      where: { productId: id },
      include: {
        deal: {
          include: {
            stage: true,
            contact: true,
            organization: true,
          },
        },
      },
    });

    return dealProducts.map((dp) => ({
      ...dp.deal,
      quantity: dp.quantity,
      unitPrice: dp.unitPrice,
    }));
  }

  async getStats(id: string) {
    const product = await this.findOne(id);
    const dealProducts = await this.prisma.dealProduct.findMany({
      where: { productId: id },
      include: { deal: true },
    });

    const totalDeals = dealProducts.length;
    const totalRevenue = dealProducts
      .filter((dp) => dp.deal.status === 'WON')
      .reduce((sum, dp) => sum + dp.quantity * dp.unitPrice, 0);

    const totalUnitsSold = dealProducts
      .filter((dp) => dp.deal.status === 'WON')
      .reduce((sum, dp) => sum + dp.quantity, 0);

    return {
      product: { id: product.id, name: product.name, sku: product.sku, price: product.price },
      totalDeals,
      totalUnitsSold,
      totalRevenue,
    };
  }
}
