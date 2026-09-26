import { Module } from '@nestjs/common';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, PaginationService],
  exports: [NotificationService],
})
export class NotificationModule {}
