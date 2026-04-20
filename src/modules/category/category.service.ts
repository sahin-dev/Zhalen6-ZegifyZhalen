import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    try {
      const category = await this.prisma.productCategory.create({
        data: {
          title: createCategoryDto.title,
          icon: createCategoryDto.icon,
        },
      });
      return this.mapCategoryToDto(category);
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create category: ${message}`);
    }
  }

  async getAllCategories(
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CategoryResponseDto>> {
    try {
      const { page, limit } = this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [categories, total] = await Promise.all([
        this.prisma.productCategory.findMany({
          include: {
            _count: {
              select: { products: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.productCategory.count(),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      const categoryDtos = categories.map((category) => ({
        id: category.id,
        title: category.title,
        icon: category.icon,
        productCount: category._count.products,
      }));

      return new PaginatedResponseDto(categoryDtos, meta);
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get all categories: ${message}`);
    }
  }

  async getCategoryById(id: string): Promise<CategoryResponseDto> {
    try {
      const category = await this.prisma.productCategory.findUnique({
        where: { id },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      if (!category) {
        throw new Error(`Category with id ${id} not found`);
      }

      return {
        id: category.id,
        title: category.title,
        icon: category.icon,
        productCount: category._count.products,
      };
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get category: ${message}`);
    }
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    try {
      const category = await this.prisma.productCategory.update({
        where: { id },
        data: {
          title: updateCategoryDto.title,
          icon: updateCategoryDto.icon,
        },
      });
      return this.mapCategoryToDto(category);
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update category: ${message}`);
    }
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.productCategory.delete({
        where: { id },
      });
      return { message: `Category with id ${id} deleted successfully` };
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete category: ${message}`);
    }
  }

  private mapCategoryToDto(category: any): CategoryResponseDto {
    return {
      id: category.id,
      title: category.title,
      icon: category.icon,
    };
  }
}
