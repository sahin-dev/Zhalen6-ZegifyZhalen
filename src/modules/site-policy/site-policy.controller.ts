import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
} from '@nestjs/common';
import { SitePolicyService } from './site-policy.service';
import { Public, Roles } from '../../common/decorators';
import {
  CreateSitePolicyDto,
  UpdateSitePolicyDto,
  SitePolicyResponseDto,
} from './dto';

@Controller('site-policies')
export class SitePolicyController {
  constructor(private readonly sitePolicyService: SitePolicyService) {}

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  @HttpCode(201)
  async createPolicy(
    @Body() createSitePolicyDto: CreateSitePolicyDto,
  ): Promise<SitePolicyResponseDto> {
    return this.sitePolicyService.createPolicy(createSitePolicyDto);
  }

  @Public()
  @Get()
  @HttpCode(200)
  async getAllPolicies(): Promise<SitePolicyResponseDto[]> {
    return this.sitePolicyService.getAllPolicies();
  }

  @Public()
  @Get('type/:type')
  @HttpCode(200)
  async getPolicyByType(
    @Param('type') type: string,
  ): Promise<SitePolicyResponseDto> {
    return this.sitePolicyService.getPolicyByType(type);
  }

  @Public()
  @Get(':id')
  @HttpCode(200)
  async getPolicyById(
    @Param('id') id: string,
  ): Promise<SitePolicyResponseDto> {
    return this.sitePolicyService.getPolicyById(id);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  @HttpCode(200)
  async updatePolicy(
    @Param('id') id: string,
    @Body() updateSitePolicyDto: UpdateSitePolicyDto,
  ): Promise<SitePolicyResponseDto> {
    return this.sitePolicyService.updatePolicy(id, updateSitePolicyDto);
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  @HttpCode(200)
  async deletePolicy(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.sitePolicyService.deletePolicy(id);
  }
}
