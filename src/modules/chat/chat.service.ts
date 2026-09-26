import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationService,
  ) {}

  async createConversation(buyerId: string, sellerId: string) {
    const seller = await this.prisma.user.findFirst({
      where: { id: sellerId, role: 'SELLER', deletedAt: null },
    });
    if (!seller) throw new NotFoundException('Seller not found');
    return this.prisma.conversation.upsert({
      where: { buyer_id_seller_id: { buyer_id: buyerId, seller_id: sellerId } },
      create: { buyer_id: buyerId, seller_id: sellerId },
      update: {},
      include: { buyer: true, seller: true },
    });
  }

  list(userId: string) {
    return this.prisma.conversation.findMany({
      where: { OR: [{ buyer_id: userId }, { seller_id: userId }] },
      include: {
        buyer: { select: { id: true, full_name: true, avatar_url: true } },
        seller: { select: { id: true, full_name: true, avatar_url: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async messages(
    userId: string,
    conversationId: string,
    query: PaginationQueryDto,
  ) {
    await this.assertParticipant(userId, conversationId);
    const { page, limit } = this.pagination.getValidPaginationParams(query);
    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversation_id: conversationId },
        orderBy: { createdAt: 'desc' },
        skip: this.pagination.calculateSkip(page, limit),
        take: limit,
      }),
      this.prisma.message.count({ where: { conversation_id: conversationId } }),
    ]);
    return new PaginatedResponseDto(
      data.reverse(),
      this.pagination.generateMeta(total, page, limit),
    );
  }

  async send(userId: string, conversationId: string, text: string) {
    const conversation = await this.assertParticipant(userId, conversationId);
    const recipientId =
      conversation.buyer_id === userId
        ? conversation.seller_id
        : conversation.buyer_id;
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { conversation_id: conversationId, sender_id: userId, text },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });
      await tx.notification.create({
        data: {
          user_id: recipientId,
          title: 'New message',
          text: text.slice(0, 120),
          channels: ['Firebase'],
          level: 'Critical',
          type: 'message_received',
        },
      });
      return message;
    });
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);
    return this.prisma.message.updateMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
      throw new ForbiddenException('Conversation access denied');
    }
    return conversation;
  }
}
