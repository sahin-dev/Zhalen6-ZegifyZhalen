import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionService } from './promotion.service';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotions: PromotionService) {}

  @Public()
  @Get('plans')
  plans() {
    return this.promotions.plans();
  }

  @Public()
  @Get('active')
  active() {
    return this.promotions.promoted();
  }

  @Post()
  @Roles('SELLER')
  create(
    @CurrentUser('sub') sellerId: string,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.promotions.create(sellerId, dto);
  }

  @Get('mine')
  @Roles('SELLER')
  mine(@CurrentUser('sub') sellerId: string) {
    return this.promotions.mine(sellerId);
  }

  @Patch(':id/activate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  activate(@Param('id') id: string) {
    return this.promotions.activate(id);
  }
}
