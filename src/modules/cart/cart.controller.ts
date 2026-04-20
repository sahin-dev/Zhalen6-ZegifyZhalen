import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/add-to-cart.dto';
import { CartResponseDto, CartItemResponseDto } from './dto/cart-response.dto';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { Public } from '../../common/decorators';

@Controller('carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async createCart(@Body() body: { user_id: string }): Promise<CartResponseDto> {
    return this.cartService.createCart(body.user_id);
  }

  @Get(':user_id')
  async getCartByUserId(@Param('user_id') user_id: string): Promise<CartResponseDto> {
    return this.cartService.getCartByUserId(user_id);
  }

  @Post('items/add')
  async addToCart(@Body() addToCartDto: AddToCartDto): Promise<CartItemResponseDto> {
    return this.cartService.addToCart(addToCartDto);
  }

  @Public()
  @Get('items/:cart_id')
  async getCartItems(
    @Param('cart_id') cart_id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CartItemResponseDto>> {
    return this.cartService.getCartItems(cart_id, paginationQuery);
  }

  @Put('items/:id')
  async updateCartItem(
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartItemResponseDto> {
    return this.cartService.updateCartItem(id, updateCartItemDto);
  }

  @Delete('items/:id')
  async removeFromCart(@Param('id') id: string): Promise<{ message: string }> {
    return this.cartService.removeFromCart(id);
  }

  @Delete(':cart_id/clear')
  async clearCart(@Param('cart_id') cart_id: string): Promise<{ message: string }> {
    return this.cartService.clearCart(cart_id);
  }
}
