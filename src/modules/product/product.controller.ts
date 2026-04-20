import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { Public } from '../../common/decorators';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    console.log(createProductDto)
    return this.productService.createProduct(createProductDto);
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
    return this.productService.getProductsByCategory(category_id, paginationQuery);
  }

  @Public()
  @Get(':id')
  async getProductById(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productService.getProductById(id);
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Post(':id/approve')
  async approveProduct(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productService.approveProduct(id);
  }

  @Post(':id/reject')
  async rejectProduct(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productService.rejectProduct(id);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string): Promise<{ message: string }> {
    return this.productService.deleteProduct(id);
  }
}
