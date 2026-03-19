import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toBigIntId } from '../../common/utils/id.util';
import {
  CreatePaymentChannelDto,
  UpdateChannelStatusDto,
  UpdatePaymentChannelDto,
} from './dto/payment-channel.dto';
import { MockPaymentDriverService } from './drivers/mock-payment.driver';
import { TokenPayPaymentDriverService } from './drivers/tokenpay-payment.driver';
import { WxpayPaymentDriverService } from './drivers/wxpay-payment.driver';
import { PaymentDriverHelperService } from './drivers/payment-driver.helper';
import type { PaymentDriver } from './drivers/payment-driver.interface';

@Injectable()
export class PaymentService {
  private readonly drivers: Map<string, PaymentDriver>;

  constructor(
    private readonly prisma: PrismaService,
    mockDriver: MockPaymentDriverService,
    tokenPayDriver: TokenPayPaymentDriverService,
    wxpayDriver: WxpayPaymentDriverService,
    private readonly paymentDriverHelper: PaymentDriverHelperService,
  ) {
    this.drivers = new Map(
      [mockDriver, tokenPayDriver, wxpayDriver].map((driver) => [driver.code, driver]),
    );
  }

  bootstrapInfo() {
    return {
      module: 'payment',
      status: 'ready',
      next: ['drivers', 'notify verification', 'channel config'],
      drivers: Array.from(this.drivers.keys()),
    };
  }

  listChannels() {
    return this.prisma.paymentChannel.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'desc' }],
    });
  }

  listPublicChannels() {
    return this.prisma.paymentChannel.findMany({
      where: { status: true },
      orderBy: [{ sort: 'asc' }, { id: 'desc' }],
      select: {
        id: true,
        name: true,
        code: true,
        driver: true,
      },
    });
  }

  createChannel(payload: CreatePaymentChannelDto) {
    this.ensureDriverSupported(payload.driver);

    return this.prisma.paymentChannel.create({
      data: this.toChannelData(payload),
    });
  }

  async updateChannel(id: string, payload: UpdatePaymentChannelDto) {
    await this.ensureChannelExists(id);
    this.ensureDriverSupported(payload.driver);

    return this.prisma.paymentChannel.update({
      where: { id: toBigIntId(id) },
      data: this.toChannelData(payload),
    });
  }

  async deleteChannel(id: string) {
    await this.ensureChannelExists(id);
    await this.prisma.paymentChannel.delete({ where: { id: toBigIntId(id) } });
    return { success: true };
  }

  async updateChannelStatus(id: string, payload: UpdateChannelStatusDto) {
    await this.ensureChannelExists(id);

    return this.prisma.paymentChannel.update({
      where: { id: toBigIntId(id) },
      data: { status: payload.status },
    });
  }

  async createPayment(orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      select: {
        id: true,
        orderNo: true,
        email: true,
        payPrice: true,
        paymentChannelCode: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (Number(order.payPrice) <= 0) {
      throw new NotFoundException('订单无需支付');
    }

    if (!order.paymentChannelCode) {
      throw new NotFoundException('订单未配置支付通道');
    }

    const channel = await this.prisma.paymentChannel.findUnique({
      where: { code: order.paymentChannelCode },
    });

    if (!channel || !channel.status) {
      throw new NotFoundException('支付通道不存在或未启用');
    }

    return this.resolveDriver(channel.driver).createPayment(order, channel);
  }

  async handleNotify(channelCode: string, payload: Record<string, unknown>) {
    const channel = await this.prisma.paymentChannel.findUnique({
      where: { code: channelCode },
    });

    if (!channel) {
      throw new NotFoundException('支付通道不存在');
    }

    return this.resolveDriver(channel.driver).handleNotify(channel, payload);
  }

  async buildReturnRedirectUrl(
    channelCode: string,
    payload: Record<string, unknown>,
  ) {
    const siteUrl = await this.paymentDriverHelper.buildReturnUrl(
      this.prisma,
      channelCode,
      null,
    );
    const baseSiteUrl = siteUrl.replace(
      new RegExp(`/api/payments/return/${channelCode}$`),
      '',
    );
    const orderNo = String(
      payload.orderNo ?? payload.OutOrderId ?? payload.outTradeNo ?? '',
    ).trim();
    const searchParams = new URLSearchParams();

    if (orderNo) {
      searchParams.set('orderNo', orderNo);
    }

    searchParams.set('channelCode', channelCode);

    return `${baseSiteUrl}/order/query?${searchParams.toString()}`;
  }

  private ensureDriverSupported(driverCode: string) {
    if (!this.drivers.has(String(driverCode).toUpperCase())) {
      throw new BadRequestException(`暂不支持的支付通道驱动: ${driverCode}`);
    }
  }

  private resolveDriver(driverCode: string) {
    const driver = this.drivers.get(String(driverCode).toUpperCase());
    if (!driver) {
      throw new NotFoundException(`未注册的支付驱动: ${driverCode}`);
    }

    return driver;
  }

  private toChannelData(payload: CreatePaymentChannelDto | UpdatePaymentChannelDto) {
    return {
      name: payload.name,
      code: payload.code,
      driver: payload.driver,
      configJson: payload.configJson
        ? (JSON.parse(payload.configJson) as Prisma.InputJsonValue)
        : undefined,
      notifyUrl: payload.notifyUrl,
      returnUrl: payload.returnUrl,
      sort: payload.sort ?? 0,
      status: payload.status ?? true,
    };
  }

  private async ensureChannelExists(id: string) {
    const channel = await this.prisma.paymentChannel.findUnique({
      where: { id: toBigIntId(id) },
    });

    if (!channel) {
      throw new NotFoundException('支付通道不存在');
    }
  }
}
