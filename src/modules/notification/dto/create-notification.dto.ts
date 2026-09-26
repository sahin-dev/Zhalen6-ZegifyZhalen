import { IsArray, IsIn, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  user_id: string;

  @IsString()
  title: string;

  @IsString()
  text: string;

  @IsIn([
    'account_created',
    'order_updated',
    'message_received',
    'promotion_updated',
    'seller_verification_updated',
    'support_updated',
  ])
  type:
    | 'account_created'
    | 'order_updated'
    | 'message_received'
    | 'promotion_updated'
    | 'seller_verification_updated'
    | 'support_updated';

  @IsArray()
  @IsIn(['Email', 'Firebase'], { each: true })
  channels: ('Email' | 'Firebase')[];
}
