import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto, ApproveOrderDto, RejectOrderDto } from './dto/create-order.dto';
import { OrderResponseDto, OrderLogResponseDto, OrderStatsDto } from './dto/order-response.dto';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { Public, Roles } from '../../common/decorators';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllOrders(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    return this.orderService.getAllOrders(paginationQuery);
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getOrderStats(): Promise<OrderStatsDto> {
    return this.orderService.getOrderStats();
  }

  @Get('pending')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getPendingOrders(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    return this.orderService.getPendingOrders(paginationQuery);
  }

  @Get('status/:status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getOrdersByStatus(
    @Param('status') status: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    return this.orderService.getOrdersByStatus(status, paginationQuery);
  }

  @Get('user/:user_id')
  async getOrdersByUserId(
    @Param('user_id') user_id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    return this.orderService.getOrdersByUserId(user_id, paginationQuery);
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.orderService.getOrderById(id);
  }

  @Get(':id/logs')
  async getOrderLogs(
    @Param('id') id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderLogResponseDto>> {
    return this.orderService.getOrderLogs(id, paginationQuery);
  }

  @Post(':id/approve')
  async approveOrder(@Param('id') id: string, @Body() approveOrderDto: ApproveOrderDto): Promise<OrderResponseDto> {
    return this.orderService.approveOrder(id, approveOrderDto);
  }

  @Post(':id/reject')
  async rejectOrder(@Param('id') id: string, @Body() rejectOrderDto: RejectOrderDto): Promise<OrderResponseDto> {
    return this.orderService.rejectOrder(id, rejectOrderDto);
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.orderService.updateOrderStatus(id, updateOrderStatusDto);
  }

  @Post(':id/complete')
  async completeOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.orderService.completeOrder(id);
  }

  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.orderService.cancelOrder(id);
  }
}
