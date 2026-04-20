import { Injectable } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/add-to-cart.dto';
import { CartResponseDto, CartItemResponseDto } from './dto/cart-response.dto';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartService {

  constructor(
    private readonly prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  async createCart(user_id: string): Promise<CartResponseDto> {
    try {
      const cart = await this.prisma.cart.create({
        data: {
          user_id,
        },
        include: {
          cart_items: true,
        },
      });
      return this.mapCartToDto(cart);
    } catch (error:any) {
      throw new Error(`Failed to create cart: ${error.message}`);
    }
  }

  async getCartByUserId(user_id: string): Promise<CartResponseDto> {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { user_id },
        include: {
          cart_items: true,
        },
      });
      if (!cart) {
        throw new Error('Cart not found');
      }
      return this.mapCartToDto(cart);
    } catch (error:any) {
      throw new Error(`Failed to fetch cart: ${error.message}`);
    }
  }

  async addToCart(addToCartDto: AddToCartDto): Promise<CartItemResponseDto> {
    try {
      // Check if product already exists in cart
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cart_id: addToCartDto.cart_id,
          product_id: addToCartDto.product_id,
        },
      });

      let cartItem;
      if (existingItem) {
        // Update quantity if item exists
        cartItem = await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + addToCartDto.quantity,
          },
        });
      } else {
        // Create new cart item
        cartItem = await this.prisma.cartItem.create({
          data: {
            cart_id: addToCartDto.cart_id,
            product_id: addToCartDto.product_id,
            quantity: addToCartDto.quantity,
          },
        });
      }
      return this.mapCartItemToDto(cartItem);
    } catch (error:any) {
      throw new Error(`Failed to add to cart: ${error.message}`);
    }
  }

  async updateCartItem(id: string, updateCartItemDto: UpdateCartItemDto): Promise<CartItemResponseDto> {
    try {
      const cartItem = await this.prisma.cartItem.update({
        where: { id },
        data: {
          quantity: updateCartItemDto.quantity,
        },
      });
      return this.mapCartItemToDto(cartItem);
    } catch (error:any) {
      throw new Error(`Failed to update cart item: ${error.message}`);
    }
  }

  async removeFromCart(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.cartItem.delete({
        where: { id },
      });
      return { message: 'Item removed from cart' };
    } catch (error:any) {
      throw new Error(`Failed to remove cart item: ${error.message}`);
    }
  }

  async clearCart(cart_id: string): Promise<{ message: string }> {
    try {
      await this.prisma.cartItem.deleteMany({
        where: { cart_id },
      });
      return { message: 'Cart cleared successfully' };
    } catch (error:any) {
      throw new Error(`Failed to clear cart: ${error.message}`);
    }
  }

  async getCartItems(
    cart_id: string,
    paginationQuery?: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CartItemResponseDto>> {
    try {
      const { page, limit } = this.paginationService.getValidPaginationParams(paginationQuery);
      const skip = this.paginationService.calculateSkip(page, limit);

      const [cartItems, total] = await Promise.all([
        this.prisma.cartItem.findMany({
          where: { cart_id },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.cartItem.count({
          where: { cart_id },
        }),
      ]);

      const meta = this.paginationService.generateMeta(total, page, limit);
      const itemDtos = cartItems.map((item) => this.mapCartItemToDto(item));

      return new PaginatedResponseDto(itemDtos, meta);
    } catch (error: any) {
      throw new Error(`Failed to fetch cart items: ${error.message}`);
    }
  }

  private mapCartToDto(cart: any): CartResponseDto {
    return {
      id: cart.id,
      user_id: cart.user_id,
      cart_items: cart.cart_items.map((item: any) => this.mapCartItemToDto(item)),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private mapCartItemToDto(cartItem: any): CartItemResponseDto {
    return {
      id: cartItem.id,
      cart_id: cartItem.cart_id,
      product_id: cartItem.product_id,
      quantity: cartItem.quantity,
      createdAt: cartItem.createdAt,
      updatedAt: cartItem.updatedAt,
    };
  }
}
