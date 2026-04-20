import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaginationService } from '../../common/services/pagination.service';

@Module({
    imports:[PrismaModule],
  controllers: [CartController],
  providers: [CartService, PaginationService],
  exports: [CartService],
})
export class CartModule {}
