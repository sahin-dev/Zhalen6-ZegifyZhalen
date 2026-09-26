import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaginationService } from '../../common/services/pagination.service';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PrismaModule, PaymentModule],
  controllers: [OrderController],
  providers: [OrderService, PaginationService],
  exports: [OrderService],
})
export class OrderModule {}
