import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import type { Product } from '../../../generated/prisma/client';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  async createProduct(
    sellerId: string,
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.create({
        data: {
          title: createProductDto.title,
          description: createProductDto.description,
          image_urls: createProductDto.image_urls,
          price: createProductDto.price,
          sizes: createProductDto.sizes,
          stock: createProductDto.stock,
          verification_document_url: createProductDto.verification_document_url,
          brand_id: createProductDto.brand_id,
          category_id: createProductDto.category_id,
          seller_id: sellerId,
        },
      });
      return this.mapProductToDto(product);
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create product: ${message}`);
    }
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    role: string,
  ): Promise<ProductResponseDto> {
    try {
      await this.assertCanManage(id, userId, role);
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          title: updateProductDto.title,
          description: updateProductDto.description,
          image_urls: updateProductDto.image_urls,
          price: updateProductDto.price,
          sizes: updateProductDto.sizes,
          stock: updateProductDto.stock,
          verification_document_url: updateProductDto.verification_document_url,
          brand_id: updateProductDto.brand_id,
          category_id: updateProductDto.category_id,
        },
      });
      return this.mapProductToDto(product);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update product: ${message}`);
    }
  }

  async getProductById(id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new Error('Product not found');
      }
      return this.mapProductToDto(product);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch product: ${message}`);
    }
  }

  async getProductsBySeller(
    seller_id: string,
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    try {
      const { page, limit } =
        this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: { seller_id },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.count({ where: { seller_id } }),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      return new PaginatedResponseDto(
        products.map((product) => this.mapProductToDto(product)),
        meta,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch seller products: ${message}`);
    }
  }

  async getProductsByCategory(
    category_id: string,
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    try {
      const { page, limit } =
        this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: { category_id },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.count({ where: { category_id } }),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      return new PaginatedResponseDto(
        products.map((product) => this.mapProductToDto(product)),
        meta,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch category products: ${message}`);
    }
  }

  async getAllProducts(
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    try {
      const { page, limit } =
        this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.count(),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      return new PaginatedResponseDto(
        products.map((product) => this.mapProductToDto(product)),
        meta,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch products: ${message}`);
    }
  }

  async getVerifiedProducts(
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    try {
      const { page, limit } =
        this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: { verified: true },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.count({ where: { verified: true } }),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      return new PaginatedResponseDto(
        products.map((product) => this.mapProductToDto(product)),
        meta,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch verified products: ${message}`);
    }
  }

  async approveProduct(id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: { verified: true },
      });
      return this.mapProductToDto(product);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to approve product: ${message}`);
    }
  }

  async rejectProduct(id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: { verified: false },
      });
      return this.mapProductToDto(product);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to reject product: ${message}`);
    }
  }

  async deleteProduct(
    id: string,
    userId: string,
    role: string,
  ): Promise<{ message: string }> {
    try {
      await this.assertCanManage(id, userId, role);
      await this.prisma.product.delete({
        where: { id },
      });
      return { message: 'Product deleted successfully' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete product: ${message}`);
    }
  }

  private mapProductToDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      image_urls: product.image_urls,
      price: product.price,
      sizes: product.sizes,
      verified: product.verified,
      verification_document_url: product.verification_document_url,
      stock: product.stock,
      brand_id: product.brand_id,
      category_id: product.category_id,
      seller_id: product.seller_id,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private async assertCanManage(id: string, userId: string, role: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (role === 'SELLER' && product.seller_id !== userId) {
      throw new ForbiddenException('You can only manage your own products');
    }
  }
}
