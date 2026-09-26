import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import {
  ReviewSellerDto,
  UpsertBusinessProfileDto,
} from './dto/upsert-business-profile.dto';
import { SellerService } from './seller.service';

@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('me/business-profile')
  @Roles('SELLER')
  getMine(@CurrentUser('sub') sellerId: string) {
    return this.sellerService.getBusinessProfile(sellerId);
  }

  @Put('me/business-profile')
  @Roles('SELLER')
  upsertMine(
    @CurrentUser('sub') sellerId: string,
    @Body() dto: UpsertBusinessProfileDto,
  ) {
    return this.sellerService.upsertBusinessProfile(sellerId, dto);
  }

  @Get('pending')
  @Roles('CHECKER', 'ADMIN', 'SUPER_ADMIN')
  listPending() {
    return this.sellerService.listPending();
  }

  @Put(':sellerId/review')
  @Roles('CHECKER', 'ADMIN', 'SUPER_ADMIN')
  review(@Param('sellerId') sellerId: string, @Body() dto: ReviewSellerDto) {
    return this.sellerService.review(sellerId, dto);
  }
}
