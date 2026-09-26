import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './modules/product/product.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { BrandModule } from './modules/brand/brand.module';
import { CategoryModule } from './modules/category/category.module';
import { AuthModule } from './modules/auth/auth.module';
import { SitePolicyModule } from './modules/site-policy/site-policy.module';
import { ConfigModule } from '@nestjs/config';
import dbConfig from './config/db.config';
import { PrismaModule } from './prisma/prisma.module';
import smtpConfig from './config/smtp.config';
import jwtConfig from './config/jwt.config';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { UserModule } from './modules/user/user.module';
import { SellerModule } from './modules/seller/seller.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ChatModule } from './modules/chat/chat.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { SupportModule } from './modules/support/support.module';
import { UploadModule } from './modules/upload/upload.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [dbConfig, smtpConfig, jwtConfig],
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    SellerModule,
    ProductModule,
    CartModule,
    OrderModule,
    BrandModule,
    CategoryModule,
    SitePolicyModule,
    NotificationModule,
    ChatModule,
    PromotionModule,
    PaymentModule,
    SupportModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
