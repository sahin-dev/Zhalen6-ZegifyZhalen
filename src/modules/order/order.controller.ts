import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dtos';
import {
  CreateOrderDto,
  CreateRefundDto,
  ReviewRefundDto,
  UpdateOrderStatusDto,
} from './dto/create-order.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  @Roles('BUYER')
  checkout(@CurrentUser('sub') userId: string, @Body() dto: CreateOrderDto) {
    return this.orderService.checkout(userId, dto);
  }

  @Post()
  @Roles('BUYER')
  checkoutCompatibility(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.checkout(userId, dto);
  }

  @Get('mine')
  @Roles('BUYER', 'SELLER')
  listMine(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: PaginationQueryDto,
    @Query('status') status?: string,
  ) {
    return this.orderService.listForUser(userId, role, query, status);
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  stats() {
    return this.orderService.getStats();
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  listAll(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: string,
  ) {
    return this.orderService.listAll(query, status);
  }

  @Get(':id')
  getOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.orderService.getOne(id, userId, role);
  }

  @Patch(':id/status')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  setStatus(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.setStatus(id, dto, userId, role);
  }

  @Post(':id/cancel')
  @Roles('BUYER')
  cancel(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.orderService.cancel(id, userId);
  }

  @Post(':id/refund')
  @Roles('BUYER')
  refund(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateRefundDto,
  ) {
    return this.orderService.requestRefund(id, userId, dto);
  }

  @Patch('refunds/:refundId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  reviewRefund(
    @Param('refundId') refundId: string,
    @Body() dto: ReviewRefundDto,
  ) {
    return this.orderService.reviewRefund(refundId, dto);
  }
}
