import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { OrderModule } from '../order/order.module';
import { PaymentDriverHelperService } from './drivers/payment-driver.helper';
import { MockPaymentDriverService } from './drivers/mock-payment.driver';
import { TokenPayPaymentDriverService } from './drivers/tokenpay-payment.driver';
import { WxpayPaymentDriverService } from './drivers/wxpay-payment.driver';

@Module({
  imports: [OrderModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentDriverHelperService,
    MockPaymentDriverService,
    TokenPayPaymentDriverService,
    WxpayPaymentDriverService,
  ],
})
export class PaymentModule {}
