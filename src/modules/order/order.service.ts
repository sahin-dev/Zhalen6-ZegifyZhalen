import { Injectable } from '@nestjs/common';
import { CreateOrderDto, CreateOrderItemDto, UpdateOrderStatusDto, ApproveOrderDto, RejectOrderDto } from './dto/create-order.dto';
import { OrderResponseDto, OrderLogResponseDto, OrderStatsDto } from './dto/order-response.dto';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderService {

  constructor(
    private readonly prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Unknown error occurred';
  }

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    try {
      let total = 0;
      createOrderDto.items.forEach((item) => {
        total += item.item_unit_price * item.item_quantity;
      });

      const order = await this.prisma.order.create({
        data: {
          user_id: createOrderDto.user_id,
          status: 'pending',
          total,
          items: {
            create: createOrderDto.items.map((item) => ({
              item_title: '', // Should be fetched from product
              item_image_urls: [],
              item_category_name: '',
              item_available_sizes: '',
              item_unit_price: item.item_unit_price,
              item_quantity: item.item_quantity.toString(),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Log the order creation
      await this.createOrderLog(order.id, 'Order created - waiting for admin approval');

      return this.mapOrderToDto(order);
    } catch (error) {
      throw new Error(`Failed to create order: ${this.getErrorMessage(error)}`);
    }
  }

  async getOrderById(id: string): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });
      if (!order) {
        throw new Error('Order not found');
      }
      return this.mapOrderToDto(order);
    } catch (error) {
      throw new Error(`Failed to fetch order: ${this.getErrorMessage(error)}`);
    }
  }

  async getOrdersByUserId(
    user_id: string,
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    try {
      const { page, limit } = this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where: { user_id },
          include: {
            items: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.order.count({
          where: { user_id },
        }),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      const orderDtos = orders.map((order) => this.mapOrderToDto(order));

      return new PaginatedResponseDto(orderDtos, meta);
    } catch (error) {
      throw new Error(`Failed to fetch user orders: ${this.getErrorMessage(error)}`);
    }
  }

  async getOrdersByStatus(
    status: string,
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    try {
      const { page, limit } = this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where: { status: status as any },
          include: {
            items: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.order.count({
          where: { status: status as any },
        }),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      const orderDtos = orders.map((order) => this.mapOrderToDto(order));

      return new PaginatedResponseDto(orderDtos, meta);
    } catch (error) {
      throw new Error(`Failed to fetch orders by status: ${this.getErrorMessage(error)}`);
    }
  }

  async getAllOrders(
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    try {
      const { page, limit } = this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          include: {
            items: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.order.count(),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      const orderDtos = orders.map((order) => this.mapOrderToDto(order));

      return new PaginatedResponseDto(orderDtos, meta);
    } catch (error) {
      throw new Error(`Failed to fetch all orders: ${this.getErrorMessage(error)}`);
    }
  }

  async getPendingOrders(
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    try {
      const { page, limit } = this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where: { status: 'pending' },
          include: {
            items: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.order.count({
          where: { status: 'pending' },
        }),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      const orderDtos = orders.map((order) => this.mapOrderToDto(order));

      return new PaginatedResponseDto(orderDtos, meta);
    } catch (error) {
      throw new Error(`Failed to fetch pending orders: ${this.getErrorMessage(error)}`);
    }
  }

  async approveOrder(id: string, approveOrderDto: ApproveOrderDto): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { status: 'approved' },
        include: {
          items: true,
        },
      });

      // Log the approval
      await this.createOrderLog(id, `Order approved by admin ${approveOrderDto.admin_id}`);

      return this.mapOrderToDto(order);
    } catch (error) {
      throw new Error(`Failed to approve order: ${this.getErrorMessage(error)}`);
    }
  }

  async rejectOrder(id: string, rejectOrderDto: RejectOrderDto): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { status: 'rejected' },
        include: {
          items: true,
        },
      });

      // Log the rejection
      const reason = rejectOrderDto.reason ? ` - Reason: ${rejectOrderDto.reason}` : '';
      await this.createOrderLog(id, `Order rejected by admin ${rejectOrderDto.admin_id}${reason}`);

      return this.mapOrderToDto(order);
    } catch (error) {
      throw new Error(`Failed to reject order: ${this.getErrorMessage(error)}`);
    }
  }

  async updateOrderStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { status: updateOrderStatusDto.status as any },
        include: {
          items: true,
        },
      });

      // Log the status update
      await this.createOrderLog(id, `Order status updated to ${updateOrderStatusDto.status}`);

      return this.mapOrderToDto(order);
    } catch (error) {
      throw new Error(`Failed to update order status: ${this.getErrorMessage(error)}`);
    }
  }

  async completeOrder(id: string): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { status: 'completed' },
        include: {
          items: true,
        },
      });

      // Log the completion
      await this.createOrderLog(id, 'Order completed');

      return this.mapOrderToDto(order);
    } catch (error) {
      throw new Error(`Failed to complete order: ${this.getErrorMessage(error)}`);
    }
  }

  async cancelOrder(id: string): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { status: 'cancelled' },
        include: {
          items: true,
        },
      });

      // Log the cancellation
      await this.createOrderLog(id, 'Order cancelled');

      return this.mapOrderToDto(order);
    } catch (error) {
      throw new Error(`Failed to cancel order: ${this.getErrorMessage(error)}`);
    }
  }

  async getOrderLogs(
    order_id: string,
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderLogResponseDto>> {
    try {
      const { page, limit } = this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [logs, total] = await Promise.all([
        this.prisma.orderLog.findMany({
          where: { order_id },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.orderLog.count({
          where: { order_id },
        }),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      const logDtos = logs.map((log) => this.mapOrderLogToDto(log));

      return new PaginatedResponseDto(logDtos, meta);
    } catch (error) {
      throw new Error(`Failed to fetch order logs: ${this.getErrorMessage(error)}`);
    }
  }

  async getOrderStats(): Promise<OrderStatsDto> {
    try {
      const orders = await this.prisma.order.findMany();
      const stats = {
        pending_count: orders.filter((o) => o.status === 'pending').length,
        approved_count: orders.filter((o) => o.status === 'approved').length,
        rejected_count: orders.filter((o) => o.status === 'rejected').length,
        completed_count: orders.filter((o) => o.status === 'completed').length,
        total_count: orders.length,
      };
      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch order stats: ${this.getErrorMessage(error)}`);
    }
  }

  private async createOrderLog(order_id: string, title: string): Promise<void> {
    try {
      await this.prisma.orderLog.create({
        data: {
          order_id,
          title,
        },
      });
    } catch (error) {
      console.error(`Failed to create order log: ${this.getErrorMessage(error)}`);
    }
  }

  private mapOrderToDto(order: any): OrderResponseDto {
    return {
      id: order.id,
      user_id: order.user_id,
      status: order.status,
      total: order.total,
      items: order.items.map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        item_image_urls: item.item_image_urls,
        item_title: item.item_title,
        item_category_name: item.item_category_name,
        item_available_sizes: item.item_available_sizes,
        item_unit_price: item.item_unit_price,
        item_quantity: item.item_quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private mapOrderLogToDto(log: any): OrderLogResponseDto {
    return {
      id: log.id,
      order_id: log.order_id,
      title: log.title,
      createdAt: log.createdAt,
    };
  }
}
