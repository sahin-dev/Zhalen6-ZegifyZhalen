export class OrderItemResponseDto {
  id: string;
  order_id: string;
  item_image_urls: string[];
  item_title: string;
  item_category_name: string;
  item_available_sizes: string;
  item_unit_price: number;
  item_quantity: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderResponseDto {
  id: string;
  user_id: string;
  status: string;
  total: number;
  items: OrderItemResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class OrderLogResponseDto {
  id: string;
  order_id: string;
  title: string;
  createdAt: Date;
}

export class OrderStatsDto {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  completed_count: number;
  total_count: number;
}
