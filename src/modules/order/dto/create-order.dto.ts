export class CreateOrderDto {
  user_id: string;
  items: CreateOrderItemDto[];
}

export class CreateOrderItemDto {
  product_id: string;
  item_quantity: number;
  item_unit_price: number;
}

export class UpdateOrderStatusDto {
  status: 'pending' | 'accepted' | 'cancelled' | 'waiting_for_admin_approval' | 'approved' | 'rejected' | 'completed';
}

export class ApproveOrderDto {
  admin_id: string;
}

export class RejectOrderDto {
  admin_id: string;
  reason?: string;
}
