import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  delivery_address: string;
}

export class UpdateOrderStatusDto {
  @IsIn([
    'pending',
    'accepted',
    'cancelled',
    'waiting_for_admin_approval',
    'approved',
    'rejected',
    'completed',
  ])
  status:
    | 'pending'
    | 'accepted'
    | 'cancelled'
    | 'waiting_for_admin_approval'
    | 'approved'
    | 'rejected'
    | 'completed';
}

export class RejectOrderDto {
  @IsString()
  reason: string;
}

export class CreateRefundDto {
  @IsString()
  reason: string;
}

export class ReviewRefundDto {
  @IsIn(['APPROVED', 'REJECTED', 'COMPLETED'])
  status: 'APPROVED' | 'REJECTED' | 'COMPLETED';

  @IsOptional()
  @IsString()
  admin_note?: string;
}
