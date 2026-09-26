import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';

const PLANS = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    price: 9.99,
    duration_months: 2,
    max_products: 1,
    priority: 1,
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Premium',
    price: 19.99,
    duration_months: 4,
    max_products: 1,
    priority: 2,
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 39.99,
    duration_months: 5,
    max_products: -1,
    priority: 3,
  },
} as const;

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  plans() {
    return Object.values(PLANS);
  }

  async create(sellerId: string, dto: CreatePromotionDto) {
    const plan = PLANS[dto.plan];
    const selectedIds =
      dto.plan === 'PRO'
        ? (
            await this.prisma.product.findMany({
              where: { seller_id: sellerId },
              select: { id: true },
            })
          ).map((p) => p.id)
        : dto.product_ids;
    if (dto.plan !== 'PRO' && selectedIds.length !== 1) {
      throw new BadRequestException(
        `${plan.name} requires exactly one product`,
      );
    }
    if (!selectedIds.length)
      throw new BadRequestException('No products are available to promote');
    const ownedCount = await this.prisma.product.count({
      where: { id: { in: selectedIds }, seller_id: sellerId },
    });
    if (ownedCount !== selectedIds.length)
      throw new BadRequestException(
        'One or more products do not belong to this seller',
      );

    return this.prisma.promotionSubscription.create({
      data: {
        seller_id: sellerId,
        plan: dto.plan,
        price: plan.price,
        duration_months: plan.duration_months,
        products: { create: selectedIds.map((product_id) => ({ product_id })) },
      },
      include: { products: { include: { product: true } } },
    });
  }

  mine(sellerId: string) {
    return this.prisma.promotionSubscription.findMany({
      where: { seller_id: sellerId },
      include: { products: { include: { product: true } }, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async activate(id: string) {
    const promotion = await this.prisma.promotionSubscription.findUnique({
      where: { id },
    });
    if (!promotion) throw new BadRequestException('Promotion not found');
    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setMonth(endsAt.getMonth() + promotion.duration_months);
    return this.prisma.promotionSubscription.update({
      where: { id },
      data: { status: 'ACTIVE', startsAt, endsAt },
    });
  }

  promoted() {
    return this.prisma.promotionSubscription.findMany({
      where: { status: 'ACTIVE', endsAt: { gt: new Date() } },
      include: {
        seller: { select: { id: true, full_name: true, avatar_url: true } },
        products: {
          include: { product: { include: { brand: true, category: true } } },
        },
      },
      orderBy: [{ plan: 'desc' }, { startsAt: 'desc' }],
    });
  }
}
