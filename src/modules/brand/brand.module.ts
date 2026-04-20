import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaginationService } from '../../common/services/pagination.service';

@Module({
  imports: [PrismaModule],
  controllers: [BrandController],
  providers: [BrandService, PaginationService],
  exports: [BrandService],
})
export class BrandModule {}
