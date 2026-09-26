import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSupportTicketDto,
  UpdateSupportTicketDto,
} from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({
      data: { user_id: userId, ...dto },
    });
  }

  listMine(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAll() {
    return this.prisma.supportTicket.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateSupportTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.supportTicket.update({
        where: { id },
        data: dto,
      });
      await tx.notification.create({
        data: {
          user_id: ticket.user_id,
          title: 'Support request updated',
          text:
            dto.admin_response ??
            `Your request is now ${dto.status.toLowerCase()}`,
          channels: ['Firebase'],
          level: 'Critical',
          type: 'support_updated',
        },
      });
      return updated;
    });
  }
}
