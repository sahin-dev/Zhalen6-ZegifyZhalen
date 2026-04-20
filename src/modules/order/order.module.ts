import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaginationService } from '../../common/services/pagination.service';

@Module({
    imports:[PrismaModule],
  controllers: [OrderController],
  providers: [OrderService, PaginationService],
  exports: [OrderService],
})
export class OrderModule {}
