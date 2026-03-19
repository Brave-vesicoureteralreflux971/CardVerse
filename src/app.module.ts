import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { AppController } from './app.controller'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'
import { CardModule } from './modules/card/card.module'
import { CouponModule } from './modules/coupon/coupon.module'
import { MailModule } from './modules/mail/mail.module'
import { OrderModule } from './modules/order/order.module'
import { PaymentModule } from './modules/payment/payment.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { ProductModule } from './modules/product/product.module'
import { SystemModule } from './modules/system/system.module'
import { UploadModule } from './modules/upload/upload.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    ProductModule,
    CardModule,
    CouponModule,
    OrderModule,
    PaymentModule,
    MailModule,
    SystemModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
