import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import type { Prisma } from '../../../generated/prisma/client';

type CartWithProducts = Prisma.CartGetPayload<{
  include: { cart_items: { include: { product: true } } };
}>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: {},
      include: {
        cart_items: {
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return this.mapCart(cart);
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.product_id, verified: true },
    });
    if (!product)
      throw new NotFoundException('Product not found or not available');
    if (product.stock < dto.quantity)
      throw new BadRequestException('Requested quantity is not available');

    const cart = await this.prisma.cart.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: {},
    });
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cart_id_product_id: { cart_id: cart.id, product_id: dto.product_id },
      },
    });
    const nextQuantity = (existing?.quantity ?? 0) + dto.quantity;
    if (nextQuantity > product.stock)
      throw new BadRequestException('Requested quantity is not available');

    await this.prisma.cartItem.upsert({
      where: {
        cart_id_product_id: { cart_id: cart.id, product_id: dto.product_id },
      },
      create: {
        cart_id: cart.id,
        product_id: dto.product_id,
        quantity: dto.quantity,
      },
      update: { quantity: nextQuantity },
    });
    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const item = await this.getOwnedItem(userId, itemId);
    if (quantity > item.product.stock)
      throw new BadRequestException('Requested quantity is not available');
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    await this.getOwnedItem(userId, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { user_id: userId },
    });
    if (cart)
      await this.prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });
    return { message: 'Cart cleared successfully' };
  }

  private async getOwnedItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { user_id: userId } },
      include: { product: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    return item;
  }

  private mapCart(cart: CartWithProducts) {
    const items = cart.cart_items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      product: item.product,
      line_total: Number((item.quantity * item.product.price).toFixed(2)),
    }));
    return {
      id: cart.id,
      items,
      total_items: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Number(
        items.reduce((sum, item) => sum + item.line_total, 0).toFixed(2),
      ),
      updatedAt: cart.updatedAt,
    };
  }
}
