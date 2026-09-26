import { BadRequestException } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import type { PrismaService } from '../../prisma/prisma.service';

jest.mock('../../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('PromotionService', () => {
  const service = new PromotionService({} as PrismaService);

  it('exposes the exact plans designed by the Flutter client', () => {
    expect(service.plans()).toEqual([
      expect.objectContaining({
        id: 'STARTER',
        price: 9.99,
        duration_months: 2,
        max_products: 1,
      }),
      expect.objectContaining({
        id: 'PREMIUM',
        price: 19.99,
        duration_months: 4,
        max_products: 1,
      }),
      expect.objectContaining({
        id: 'PRO',
        price: 39.99,
        duration_months: 5,
        max_products: -1,
      }),
    ]);
  });

  it('rejects multiple products for a single-product plan before persistence', async () => {
    await expect(
      service.create('seller-id', {
        plan: 'STARTER',
        product_ids: [
          'f10d7b03-5646-4f5b-aaef-32f093f41c99',
          '557305bf-90d8-411c-aa96-d601aaa399a8',
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
