import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandResponseDto } from './dto/brand-response.dto';

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);

  constructor(
    private prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  async createBrand(createBrandDto: CreateBrandDto): Promise<BrandResponseDto> {
    try {
      const brand = await this.prisma.brand.create({
        data: {
          title: createBrandDto.title,
         
        },
      });
      return this.mapBrandToDto(brand);
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create brand: ${message}`);
    }
  }

  async getAllBrands(
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<BrandResponseDto>> {
    try {
      const { page, limit } = this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [brands, total] = await Promise.all([
        this.prisma.brand.findMany({
          include: {
            _count: {
              select: { products: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.brand.count(),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      const brandDtos = brands.map((brand) => ({
        id: brand.id,
        title: brand.title,
        image_url: brand.image_url,
        productCount: brand._count.products,
      }));

      return new PaginatedResponseDto(brandDtos, meta);
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get all brands: ${message}`);
    }
  }

  async getBrandById(id: string): Promise<BrandResponseDto> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      if (!brand) {
        throw new Error(`Brand with id ${id} not found`);
      }

      return {
        id: brand.id,
        title: brand.title,
        image_url: brand.image_url,
        productCount: brand._count.products,
      };
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get brand: ${message}`);
    }
  }

  async updateBrand(
    id: string,
    updateBrandDto: UpdateBrandDto,
  ): Promise<BrandResponseDto> {
    try {
      const brand = await this.prisma.brand.update({
        where: { id },
        data: {
          title: updateBrandDto.title,
          image_url: updateBrandDto.image_url,
        },
      });
      return this.mapBrandToDto(brand);
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update brand: ${message}`);
    }
  }

  async deleteBrand(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.brand.delete({
        where: { id },
      });
      return { message: `Brand with id ${id} deleted successfully` };
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete brand: ${message}`);
    }
  }

  private mapBrandToDto(brand: any): BrandResponseDto {
    return {
      id: brand.id,
      title: brand.title,
      image_url: brand.image_url,
    };
  }
}
