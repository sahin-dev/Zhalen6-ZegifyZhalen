import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dtos';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationService,
  ) {}

  create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: { ...dto, level: 'Critical' },
    });
  }

  async list(userId: string, query: PaginationQueryDto) {
    const { page, limit } = this.pagination.getValidPaginationParams(query);
    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { createdAt: 'desc' },
        skip: this.pagination.calculateSkip(page, limit),
        take: limit,
      }),
      this.prisma.notification.count({ where: { user_id: userId } }),
      this.prisma.notification.count({
        where: { user_id: userId, readAt: null },
      }),
    ]);
    return {
      ...new PaginatedResponseDto(
        data,
        this.pagination.generateMeta(total, page, limit),
      ),
      unread,
    };
  }

  async markRead(userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, user_id: userId },
      data: { readAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Notification not found');
    return { message: 'Notification marked as read' };
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { user_id: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
