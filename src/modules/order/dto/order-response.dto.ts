export class OrderResponseDto {
  id: string;
  user_id: string;
  status: string;
  total: number;
  delivery_fee: number;
  delivery_address?: string | null;
  items: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

export class OrderStatsDto {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  completed_count: number;
  cancelled_count: number;
  total_count: number;
}
