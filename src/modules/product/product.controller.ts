import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles('SELLER')
  async createProduct(
    @CurrentUser('sub') sellerId: string,
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.createProduct(sellerId, createProductDto);
  }

  @Get('mine')
  @Roles('SELLER')
  getMine(
    @CurrentUser('sub') sellerId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.productService.getProductsBySeller(sellerId, paginationQuery);
  }

  @Public()
  @Get()
  async getAllProducts(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productService.getAllProducts(paginationQuery);
  }

  @Public()
  @Get('verified')
  async getVerifiedProducts(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productService.getVerifiedProducts(paginationQuery);
  }

  @Public()
  @Get('seller/:seller_id')
  async getProductsBySeller(
    @Param('seller_id') seller_id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productService.getProductsBySeller(seller_id, paginationQuery);
  }

  @Public()
  @Get('category/:category_id')
  async getProductsByCategory(
    @Param('category_id') category_id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productService.getProductsByCategory(
      category_id,
      paginationQuery,
    );
  }

  @Public()
  @Get(':id')
  async getProductById(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productService.getProductById(id);
  }

  @Put(':id')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async updateProduct(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.updateProduct(
      id,
      updateProductDto,
      userId,
      role,
    );
  }

  @Post(':id/approve')
  @Roles('CHECKER', 'ADMIN', 'SUPER_ADMIN')
  async approveProduct(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productService.approveProduct(id);
  }

  @Post(':id/reject')
  @Roles('CHECKER', 'ADMIN', 'SUPER_ADMIN')
  async rejectProduct(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productService.rejectProduct(id);
  }

  @Delete(':id')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ): Promise<{ message: string }> {
    return this.productService.deleteProduct(id, userId, role);
  }
}
