import { Controller, Headers, Param, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post('orders/:orderId/intent')
  @Roles('BUYER')
  orderIntent(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.payments.createOrderIntent(userId, orderId);
  }

  @Post('promotions/:promotionId/intent')
  @Roles('SELLER')
  promotionIntent(
    @CurrentUser('sub') userId: string,
    @Param('promotionId') promotionId: string,
  ) {
    return this.payments.createPromotionIntent(userId, promotionId);
  }

  @Public()
  @Post('stripe/webhook')
  webhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.payments.handleWebhook(request.rawBody!, signature);
  }
}
