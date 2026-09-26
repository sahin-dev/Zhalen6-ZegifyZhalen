import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import { AddToCartDto, UpdateCartItemDto } from './dto/add-to-cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
@Roles('BUYER')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser('sub') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  addItem(@CurrentUser('sub') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser('sub') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(userId, itemId, dto.quantity);
  }

  @Delete('items/:itemId')
  removeItem(
    @CurrentUser('sub') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  clear(@CurrentUser('sub') userId: string) {
    return this.cartService.clear(userId);
  }
}
