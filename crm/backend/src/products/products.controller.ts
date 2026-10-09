import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products in catalog with pagination and status filter' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Add a new product to catalog' })
  @ApiResponse({ status: 201, description: 'Product added' })
  async create(@Body() createDto: CreateProductDto) {
    return this.productsService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update product information' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Toggle product active/inactive status' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiBody({ schema: { properties: { isActive: { type: 'boolean', example: false } } } })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.productsService.updateStatus(id, isActive);
  }

  @Get(':id/deals')
  @ApiOperation({ summary: 'Get all sales deals featuring this product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'List of deals featuring product' })
  async getDeals(@Param('id') id: string) {
    return this.productsService.getDeals(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get product performance statistics (sales count, total revenue)' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product stats' })
  async getStats(@Param('id') id: string) {
    return this.productsService.getStats(id);
  }
}
