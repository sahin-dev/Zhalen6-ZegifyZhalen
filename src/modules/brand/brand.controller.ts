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
import { BrandService } from './brand.service';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { Public, Roles } from '../../common/decorators';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandResponseDto } from './dto/brand-response.dto';

@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createBrand(@Body() createBrandDto: CreateBrandDto): Promise<BrandResponseDto> {

    return this.brandService.createBrand(createBrandDto);
  }

  @Public()
  @Get()
  async getAllBrands(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<BrandResponseDto>> {
    return this.brandService.getAllBrands(paginationQuery);
  }

  @Public()
  @Get(':id')
  async getBrandById(@Param('id') id: string): Promise<BrandResponseDto> {
    return this.brandService.getBrandById(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Put(':id')
  async updateBrand(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ): Promise<BrandResponseDto> {
    return this.brandService.updateBrand(id, updateBrandDto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  async deleteBrand(@Param('id') id: string): Promise<{ message: string }> {
    return this.brandService.deleteBrand(id);
  }
}
