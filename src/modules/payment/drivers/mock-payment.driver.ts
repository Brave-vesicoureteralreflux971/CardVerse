import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentChannel, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderWorkflowService } from '../../order/order-workflow.service';
import { PaymentDriver, PaymentNotifyPayload, PaymentOrderContext } from './payment-driver.interface';

@Injectable()
export class MockPaymentDriverService implements PaymentDriver {
  readonly code = 'MOCK';

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderWorkflowService: OrderWorkflowService,
  ) {}

  async createPayment(order: PaymentOrderContext, channel: PaymentChannel) {
    return {
      driver: this.code,
      orderNo: order.orderNo,
      amount: order.payPrice,
      paymentChannelCode: order.paymentChannelCode,
      channelName: channel.name,
      message: '模拟支付无需发起真实下单，可直接调用支付回调接口完成测试。',
    };
  }

  async handleNotify(channel: PaymentChannel, payload: PaymentNotifyPayload) {
    const orderNo = String(payload.orderNo ?? payload.outTradeNo ?? '');
    const thirdTradeNo = payload.thirdTradeNo ? String(payload.thirdTradeNo) : undefined;

    if (!orderNo) {
      throw new NotFoundException('回调缺少订单号');
    }

    const order = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return this.orderWorkflowService.markOrderPaid({
      orderId: order.id,
      channelCode: channel.code,
      thirdTradeNo,
      callbackPayload: payload as Prisma.InputJsonValue,
    });
  }
}
