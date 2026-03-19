import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentChannel } from '@prisma/client';
import { PaymentDriver, PaymentNotifyPayload, PaymentOrderContext } from './payment-driver.interface';
import { PaymentDriverHelperService } from './payment-driver.helper';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WxpayPaymentDriverService implements PaymentDriver {
  readonly code = 'WXPAY';

  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: PaymentDriverHelperService,
  ) {}

  async createPayment(order: PaymentOrderContext, channel: PaymentChannel) {
    const config = this.helper.parseChannelConfig(channel);
    const appId = this.helper.requireConfig(
      this.helper.getConfigValue(config, 'appId'),
      '微信支付缺少 appId 配置',
    );
    const mchId = this.helper.requireConfig(
      this.helper.getConfigValue(config, 'mchId', 'merchantId'),
      '微信支付缺少 mchId 配置',
    );
    const mode = this.helper.getConfigValue(config, 'mode') || 'NATIVE';
    const notifyUrl = await this.helper.buildNotifyUrl(this.prisma, channel.code, channel.notifyUrl);
    const returnUrl = await this.helper.buildReturnUrl(this.prisma, channel.code, channel.returnUrl);

    return {
      driver: this.code,
      orderNo: order.orderNo,
      amount: order.payPrice,
      paymentChannelCode: order.paymentChannelCode,
      notifyUrl,
      returnUrl,
      configSummary: {
        appId,
        mchId,
        mode,
      },
      message:
        '微信支付驱动已独立注册。当前已完成配置模型和模块边界，正式下单签名、平台证书验签和回调处理需要按你的接入模式继续实现。',
    };
  }

  async handleNotify(_channel: PaymentChannel, _payload: PaymentNotifyPayload) {
    throw new BadRequestException('微信支付驱动已注册，但尚未实现官方回调验签逻辑');
  }
}
