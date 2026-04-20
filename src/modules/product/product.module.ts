import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaginationService } from '../../common/services/pagination.service';

@Module({
    imports:[PrismaModule],
    controllers: [ProductController],
    providers: [ProductService, PaginationService],
    exports: [ProductService],
})
export class ProductModule {}
