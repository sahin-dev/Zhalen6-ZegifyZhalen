import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaginationService } from '../../common/services/pagination.service';

@Module({
  imports: [PrismaModule],
  controllers: [CategoryController],
  providers: [CategoryService, PaginationService],
  exports: [CategoryService],
})
export class CategoryModule {}
