import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, Prisma } from '../../../generated/prisma/client';
import {
  CreateOrderDto,
  CreateRefundDto,
  ReviewRefundDto,
  UpdateOrderStatusDto,
} from './dto/create-order.dto';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationService,
    private readonly payments: PaymentService,
  ) {}

  async checkout(userId: string, dto: CreateOrderDto) {
    const deliveryFee = Number(process.env.DELIVERY_FEE ?? 0);
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { user_id: userId },
        include: {
          cart_items: { include: { product: { include: { category: true } } } },
        },
      });
      if (!cart?.cart_items.length)
        throw new BadRequestException('Cart is empty');
      const sellerIds = new Set(
        cart.cart_items.map((item) => item.product.seller_id),
      );
      if (sellerIds.size > 1) {
        throw new BadRequestException(
          'Checkout currently supports products from one seller at a time',
        );
      }

      for (const item of cart.cart_items) {
        if (!item.product.verified || item.product.stock < item.quantity) {
          throw new BadRequestException(
            `${item.product.title} is unavailable in the requested quantity`,
          );
        }
      }

      const subtotal = cart.cart_items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      const order = await tx.order.create({
        data: {
          user_id: userId,
          total: Number((subtotal + deliveryFee).toFixed(2)),
          delivery_fee: deliveryFee,
          delivery_address: dto.delivery_address,
          items: {
            create: cart.cart_items.map((item) => ({
              product_id: item.product_id,
              seller_id: item.product.seller_id,
              item_title: item.product.title,
              item_image_urls: item.product.image_urls,
              item_category_name: item.product.category.title,
              item_available_sizes: item.product.sizes,
              item_unit_price: item.product.price,
              item_quantity: item.quantity.toString(),
            })),
          },
          logs: { create: { title: 'Order created' } },
        },
        include: { items: true, logs: true },
      });

      for (const item of cart.cart_items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await tx.cartItem.deleteMany({ where: { cart_id: cart.id } });
      return order;
    });
  }

  async listForUser(
    userId: string,
    role: string,
    query: PaginationQueryDto,
    status?: string,
  ) {
    const { page, limit } = this.pagination.getValidPaginationParams(query);
    const where: Prisma.OrderWhereInput =
      role === 'SELLER'
        ? { items: { some: { seller_id: userId } } }
        : { user_id: userId };
    if (status) {
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        throw new BadRequestException('Invalid order status');
      }
      where.status = status as OrderStatus;
    }
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true, refund: true, payment: true },
        orderBy: { createdAt: 'desc' },
        skip: this.pagination.calculateSkip(page, limit),
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return new PaginatedResponseDto(
      orders,
      this.pagination.generateMeta(total, page, limit),
    );
  }

  async listAll(query: PaginationQueryDto, status?: string) {
    const { page, limit } = this.pagination.getValidPaginationParams(query);
    if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException('Invalid order status');
    }
    const where: Prisma.OrderWhereInput = status
      ? { status: status as OrderStatus }
      : {};
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true, refund: true, payment: true },
        orderBy: { createdAt: 'desc' },
        skip: this.pagination.calculateSkip(page, limit),
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return new PaginatedResponseDto(
      orders,
      this.pagination.generateMeta(total, page, limit),
    );
  }

  async getOne(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        logs: { orderBy: { createdAt: 'asc' } },
        refund: true,
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'CHECKER'].includes(role);
    const isSeller =
      role === 'SELLER' &&
      order.items.some((item) => item.seller_id === userId);
    if (!isAdmin && order.user_id !== userId && !isSeller)
      throw new ForbiddenException('Order access denied');
    return order;
  }

  async setStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    actorId: string,
    role: string,
  ) {
    const order = await this.getOne(orderId, actorId, role);
    if (
      role === 'SELLER' &&
      !['accepted', 'waiting_for_admin_approval', 'completed'].includes(
        dto.status,
      )
    ) {
      throw new ForbiddenException('Sellers cannot set this order status');
    }
    if (!['SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(role))
      throw new ForbiddenException();
    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: dto.status,
        logs: {
          create: { title: `Status changed to ${dto.status} by ${actorId}` },
        },
      },
      include: { items: true, logs: true },
    });
  }

  async cancel(orderId: string, userId: string) {
    const order = await this.getOne(orderId, userId, 'BUYER');
    if (!['pending', 'accepted'].includes(order.status)) {
      throw new BadRequestException('This order can no longer be cancelled');
    }
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.product_id) {
          await tx.product.update({
            where: { id: item.product_id },
            data: { stock: { increment: Number(item.item_quantity) } },
          });
        }
      }
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          logs: { create: { title: 'Order cancelled by buyer' } },
        },
        include: { items: true },
      });
    });
  }

  async requestRefund(orderId: string, userId: string, dto: CreateRefundDto) {
    const order = await this.getOne(orderId, userId, 'BUYER');
    if (order.status !== 'completed')
      throw new BadRequestException('Only completed orders can be refunded');
    return this.prisma.refundRequest.create({
      data: { order_id: orderId, user_id: userId, reason: dto.reason },
    });
  }

  async reviewRefund(refundId: string, dto: ReviewRefundDto) {
    const refund = await this.prisma.refundRequest.findUnique({
      where: { id: refundId },
    });
    if (!refund) throw new NotFoundException('Refund request not found');
    if (dto.status === 'APPROVED' || dto.status === 'COMPLETED') {
      await this.payments.refundOrder(refund.order_id);
      return this.prisma.refundRequest.update({
        where: { id: refundId },
        data: { status: 'COMPLETED', admin_note: dto.admin_note },
      });
    }
    return this.prisma.refundRequest.update({
      where: { id: refundId },
      data: dto,
    });
  }

  async getStats() {
    const grouped = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });
    const count = (status: string) =>
      grouped.find((item) => item.status === status)?._count ?? 0;
    return {
      pending_count: count('pending'),
      approved_count: count('approved'),
      rejected_count: count('rejected'),
      completed_count: count('completed'),
      cancelled_count: count('cancelled'),
      total_count: grouped.reduce((sum, item) => sum + item._count, 0),
    };
  }
}
