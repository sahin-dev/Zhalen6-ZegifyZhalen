export class CartItemResponseDto {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CartResponseDto {
  id: string;
  user_id: string;
  cart_items: CartItemResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class CartSummaryDto {
  id: string;
  user_id: string;
  total_items: number;
  total_price: number;
}
