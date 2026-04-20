export class AddToCartDto {
  cart_id: string;
  product_id: string;
  quantity: number;
}

export class UpdateCartItemDto {
  id: string;
  quantity: number;
}
