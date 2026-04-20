import { Module } from '@nestjs/common';
import { SitePolicyService } from './site-policy.service';
import { SitePolicyController } from './site-policy.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SitePolicyService],
  controllers: [SitePolicyController],
})
export class SitePolicyModule {}
