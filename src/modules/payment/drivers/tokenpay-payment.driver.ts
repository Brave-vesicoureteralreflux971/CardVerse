import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentChannel, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderWorkflowService } from '../../order/order-workflow.service';
import { PaymentDriver, PaymentNotifyPayload, PaymentOrderContext } from './payment-driver.interface';
import { PaymentDriverHelperService } from './payment-driver.helper';

const TOKENPAY_CURRENCY_ALIAS: Record<string, string> = {
  trx: 'TRX',
  usdt_trc20: 'USDT_TRC20',
  'usdt-trc20': 'USDT_TRC20',
  usdttrc20: 'USDT_TRC20',
  usdt_trc: 'USDT_TRC20',
  'usdt-trc': 'USDT_TRC20',
  usdttrc: 'USDT_TRC20',
  evm_eth_eth: 'EVM_ETH_ETH',
  eth: 'EVM_ETH_ETH',
  evm_eth_usdt_erc20: 'EVM_ETH_USDT_ERC20',
  usdt_erc20: 'EVM_ETH_USDT_ERC20',
  'usdt-erc20': 'EVM_ETH_USDT_ERC20',
  usdterc20: 'EVM_ETH_USDT_ERC20',
  evm_eth_usdc_erc20: 'EVM_ETH_USDC_ERC20',
  usdc_erc20: 'EVM_ETH_USDC_ERC20',
  'usdc-erc20': 'EVM_ETH_USDC_ERC20',
  usdcerc20: 'EVM_ETH_USDC_ERC20',
  evm_bsc_bnb: 'EVM_BSC_BNB',
  bnb: 'EVM_BSC_BNB',
  evm_bsc_usdt_bep20: 'EVM_BSC_USDT_BEP20',
  usdt_bep20: 'EVM_BSC_USDT_BEP20',
  'usdt-bep20': 'EVM_BSC_USDT_BEP20',
  usdtbep20: 'EVM_BSC_USDT_BEP20',
  evm_bsc_usdc_bep20: 'EVM_BSC_USDC_BEP20',
  usdc_bep20: 'EVM_BSC_USDC_BEP20',
  'usdc-bep20': 'EVM_BSC_USDC_BEP20',
  usdcbep20: 'EVM_BSC_USDC_BEP20',
  evm_polygon_pol: 'EVM_Polygon_POL',
  pol: 'EVM_Polygon_POL',
  matic: 'EVM_Polygon_POL',
  evm_polygon_usdt_erc20: 'EVM_Polygon_USDT_ERC20',
  polygon_usdt: 'EVM_Polygon_USDT_ERC20',
  'polygon-usdt': 'EVM_Polygon_USDT_ERC20',
  evm_polygon_usdc_erc20: 'EVM_Polygon_USDC_ERC20',
  polygon_usdc: 'EVM_Polygon_USDC_ERC20',
  'polygon-usdc': 'EVM_Polygon_USDC_ERC20',
};

@Injectable()
export class TokenPayPaymentDriverService implements PaymentDriver {
  readonly code = 'TOKENPAY';

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderWorkflowService: OrderWorkflowService,
    private readonly helper: PaymentDriverHelperService,
  ) {}

  async createPayment(order: PaymentOrderContext, channel: PaymentChannel) {
    const config = this.helper.parseChannelConfig(channel);
    const baseUrl = this.helper.requireConfig(
      this.helper.getConfigValue(config, 'baseUrl', 'gatewayUrl', 'apiBaseUrl'),
      'TokenPay 缺少 baseUrl 配置',
    );
    const secretKey = this.helper.requireConfig(
      this.helper.getConfigValue(config, 'secretKey', 'appSecret', 'signKey'),
      'TokenPay 缺少 secretKey 配置',
    );
    const currency = this.normalizeCurrency(
      this.helper.requireConfig(
        this.helper.getConfigValue(config, 'currency', 'Currency'),
        'TokenPay 缺少 currency 配置',
      ),
    );
    const createOrderPath = this.helper.getConfigValue(config, 'createOrderPath') || '/CreateOrder';
    const notifyUrl = await this.helper.buildNotifyUrl(this.prisma, channel.code, channel.notifyUrl);
    const redirectUrl = await this.helper.buildReturnUrl(this.prisma, channel.code, channel.returnUrl);

    const requestPayload = {
      OutOrderId: order.orderNo,
      OrderUserKey: order.email,
      ActualAmount: this.helper.decimalToString(order.payPrice),
      Currency: currency,
      NotifyUrl: notifyUrl,
      RedirectUrl: redirectUrl,
      Signature: '',
    } as Record<string, string>;

    requestPayload.Signature = this.sign(requestPayload, secretKey);

    const response = await fetch(this.helper.joinUrl(baseUrl, createOrderPath), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const rawText = await response.text();
    const responseData = this.helper.tryParseJson(rawText);

    if (!response.ok) {
      throw new BadRequestException(
        `TokenPay 下单失败: ${this.helper.extractProviderMessage(responseData, rawText)}`,
      );
    }

    const success =
      responseData &&
      typeof responseData === 'object' &&
      (responseData.success === true || responseData.Success === true || responseData.code === 0);

    if (!success) {
      throw new BadRequestException(
        `TokenPay 下单失败: ${this.helper.extractProviderMessage(responseData, rawText)}`,
      );
    }

    const paymentUrl =
      String(
        responseData?.Data ??
          responseData?.data ??
          responseData?.paymentUrl ??
          responseData?.payUrl ??
          '',
      ) || null;

    return {
      driver: this.code,
      orderNo: order.orderNo,
      amount: order.payPrice,
      paymentChannelCode: order.paymentChannelCode,
      paymentUrl,
      notifyUrl,
      redirectUrl,
      providerResponse: responseData ?? rawText,
    };
  }

  async handleNotify(channel: PaymentChannel, payload: PaymentNotifyPayload) {
    const config = this.helper.parseChannelConfig(channel);
    const secretKey = this.helper.requireConfig(
      this.helper.getConfigValue(config, 'secretKey', 'appSecret', 'signKey'),
      'TokenPay 缺少 secretKey 配置',
    );
    const normalizedPayload = this.helper.normalizePayload(payload);
    const signature = normalizedPayload.Signature || normalizedPayload.signature;

    if (!signature) {
      throw new BadRequestException('TokenPay 回调缺少签名');
    }

    const expectedSignature = this.sign(normalizedPayload, secretKey);
    if (String(signature).toUpperCase() !== expectedSignature.toUpperCase()) {
      throw new BadRequestException('TokenPay 回调签名验证失败');
    }

    const orderNo = String(normalizedPayload.OutOrderId || normalizedPayload.orderNo || '');
    if (!orderNo) {
      throw new BadRequestException('TokenPay 回调缺少订单号');
    }

    const status = String(normalizedPayload.Status ?? '');
    if (status && status !== '1') {
      return 'ok';
    }

    const order = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    await this.orderWorkflowService.markOrderPaid({
      orderId: order.id,
      channelCode: channel.code,
      thirdTradeNo:
        String(
          normalizedPayload.Id ||
            normalizedPayload.BlockTransactionId ||
            normalizedPayload.thirdTradeNo ||
            '',
        ) || undefined,
      callbackPayload: normalizedPayload as Prisma.InputJsonValue,
    });

    return 'ok';
  }

  private normalizeCurrency(value: string) {
    const raw = String(value ?? '').trim();
    if (!raw) {
      return raw;
    }

    const key = raw.toLowerCase().replace(/\s+/g, '').replace(/\./g, '_');
    return TOKENPAY_CURRENCY_ALIAS[key] ?? raw;
  }

  private sign(payload: Record<string, unknown>, secretKey: string) {
    const content = Object.keys(payload)
      .filter((key) => key !== 'Signature' && key !== 'signature')
      .filter((key) => payload[key] !== undefined && payload[key] !== null && String(payload[key]) !== '')
      .sort()
      .map((key) => `${key}=${String(payload[key])}`)
      .join('&');

    return createHash('md5').update(`${content}${secretKey}`, 'utf8').digest('hex');
  }
}
