import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ReviewSellerDto,
  UpsertBusinessProfileDto,
} from './dto/upsert-business-profile.dto';

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  async getBusinessProfile(sellerId: string) {
    const profile = await this.prisma.businessProfile.findUnique({
      where: { seller_id: sellerId },
      include: {
        seller: { select: { id: true, full_name: true, email: true } },
      },
    });
    const documents = await this.prisma.sellerDocument.findMany({
      where: { seller_id: sellerId },
      orderBy: { createdAt: 'desc' },
    });
    return { profile, documents };
  }

  async upsertBusinessProfile(sellerId: string, dto: UpsertBusinessProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: sellerId } });
    if (!user) throw new NotFoundException('Seller not found');
    if (user.role !== 'SELLER')
      throw new ForbiddenException('Only sellers can submit business details');

    const { documents = [], ...profileData } = dto;
    if (!documents.some((document) => document.type === 'BUSINESS_LICENSE')) {
      const existingLicense = await this.prisma.sellerDocument.count({
        where: { seller_id: sellerId, type: 'BUSINESS_LICENSE' },
      });
      if (!existingLicense)
        throw new BadRequestException(
          'A business license document is required',
        );
    }

    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.businessProfile.upsert({
        where: { seller_id: sellerId },
        create: { seller_id: sellerId, ...profileData },
        update: { ...profileData, status: 'PENDING', rejection_reason: null },
      });
      if (documents.length) {
        await tx.sellerDocument.deleteMany({ where: { seller_id: sellerId } });
        await tx.sellerDocument.createMany({
          data: documents.map((document) => ({
            ...document,
            seller_id: sellerId,
          })),
        });
      }
      const savedDocuments = await tx.sellerDocument.findMany({
        where: { seller_id: sellerId },
      });
      return { profile, documents: savedDocuments };
    });
  }

  async listPending() {
    return this.prisma.businessProfile.findMany({
      where: { status: 'PENDING' },
      include: { seller: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(sellerId: string, dto: ReviewSellerDto) {
    if (dto.status === 'REJECTED' && !dto.rejection_reason) {
      throw new BadRequestException('A rejection reason is required');
    }
    const profile = await this.prisma.businessProfile.update({
      where: { seller_id: sellerId },
      data: {
        status: dto.status,
        rejection_reason: dto.rejection_reason ?? null,
      },
    });
    await this.prisma.sellerDocument.updateMany({
      where: { seller_id: sellerId },
      data: {
        status: dto.status,
        rejection_reason: dto.rejection_reason ?? null,
      },
    });
    return profile;
  }
}
