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
import { CategoryService } from './category.service';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { Public, Roles } from '../../common/decorators';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Public()
  @Get()
  async getAllCategories(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CategoryResponseDto>> {
    return this.categoryService.getAllCategories(paginationQuery);
  }

  @Public()
  @Get(':id')
  async getCategoryById(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoryService.getCategoryById(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  async deleteCategory(@Param('id') id: string): Promise<{ message: string }> {
    return this.categoryService.deleteCategory(id);
  }
}
