import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentService {
  private readonly stripe?: Stripe;

  constructor(private readonly prisma: PrismaService) {
    if (process.env.STRIPE_SECRET_KEY)
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createOrderIntent(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (['cancelled', 'rejected'].includes(order.status))
      throw new BadRequestException('Order cannot be paid');
    return this.createIntent(userId, order.total, 'ORDER', orderId, undefined);
  }

  async createPromotionIntent(userId: string, promotionId: string) {
    const promotion = await this.prisma.promotionSubscription.findFirst({
      where: { id: promotionId, seller_id: userId, status: 'PENDING_PAYMENT' },
    });
    if (!promotion) throw new NotFoundException('Pending promotion not found');
    return this.createIntent(
      userId,
      promotion.price,
      'PROMOTION',
      undefined,
      promotionId,
    );
  }

  private async createIntent(
    userId: string,
    amount: number,
    purpose: 'ORDER' | 'PROMOTION',
    orderId?: string,
    promotionId?: string,
  ) {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    const existing = await this.prisma.payment.findFirst({
      where: orderId ? { order_id: orderId } : { promotion_id: promotionId },
    });
    if (existing?.provider_payment_id) {
      const intent = await this.stripe.paymentIntents.retrieve(
        existing.provider_payment_id,
      );
      return { payment_id: existing.id, client_secret: intent.client_secret };
    }

    const payment =
      existing ??
      (await this.prisma.payment.create({
        data: {
          user_id: userId,
          purpose,
          amount,
          order_id: orderId,
          promotion_id: promotionId,
        },
      }));
    const intent = await this.stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency: payment.currency,
        automatic_payment_methods: { enabled: true },
        metadata: { payment_id: payment.id, purpose },
      },
      { idempotencyKey: payment.id },
    );
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { provider_payment_id: intent.id },
    });
    return { payment_id: payment.id, client_secret: intent.client_secret };
  }

  async handleWebhook(rawBody: Buffer, signature?: string) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new BadRequestException('Stripe webhook is not configured');
    }
    if (!signature) throw new UnauthorizedException('Missing Stripe signature');
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new UnauthorizedException('Invalid Stripe signature');
    }

    if (
      event.type === 'payment_intent.succeeded' ||
      event.type === 'payment_intent.payment_failed'
    ) {
      const intent = event.data.object;
      const payment = await this.prisma.payment.findUnique({
        where: { provider_payment_id: intent.id },
      });
      if (!payment) return { received: true };
      const succeeded = event.type === 'payment_intent.succeeded';
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: succeeded ? 'SUCCEEDED' : 'FAILED' },
        });
        if (succeeded && payment.order_id) {
          await tx.order.update({
            where: { id: payment.order_id },
            data: {
              status: 'waiting_for_admin_approval',
              logs: { create: { title: 'Payment received' } },
            },
          });
        }
        if (succeeded && payment.promotion_id) {
          const promotion = await tx.promotionSubscription.findUnique({
            where: { id: payment.promotion_id },
          });
          if (promotion) {
            const startsAt = new Date();
            const endsAt = new Date(startsAt);
            endsAt.setMonth(endsAt.getMonth() + promotion.duration_months);
            await tx.promotionSubscription.update({
              where: { id: promotion.id },
              data: { status: 'ACTIVE', startsAt, endsAt },
            });
          }
        }
      });
    }
    return { received: true };
  }

  async refundOrder(orderId: string) {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    const payment = await this.prisma.payment.findFirst({
      where: { order_id: orderId, status: 'SUCCEEDED' },
    });
    if (!payment?.provider_payment_id) {
      throw new BadRequestException(
        'No successful payment exists for this order',
      );
    }
    await this.stripe.refunds.create(
      { payment_intent: payment.provider_payment_id },
      { idempotencyKey: `refund-${payment.id}` },
    );
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });
  }
}
