import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentChannel, Prisma } from '@prisma/client';

@Injectable()
export class PaymentDriverHelperService {
  async buildNotifyUrl(
    prisma: { systemConfig: { findUnique(args: unknown): Promise<{ configValue: string | null } | null> } },
    channelCode: string,
    channelNotifyUrl?: string | null,
  ) {
    if (channelNotifyUrl) {
      return channelNotifyUrl;
    }

    const siteUrl = await this.loadSiteUrl(prisma);
    if (!siteUrl) {
      throw new BadRequestException('请先在系统设置中配置 SITE_URL 或在支付渠道中单独填写 notifyUrl');
    }

    return `${siteUrl}/api/payments/notify/${channelCode}`;
  }

  async buildReturnUrl(
    prisma: { systemConfig: { findUnique(args: unknown): Promise<{ configValue: string | null } | null> } },
    channelCode: string,
    channelReturnUrl?: string | null,
  ) {
    if (channelReturnUrl) {
      return channelReturnUrl;
    }

    const siteUrl = await this.loadSiteUrl(prisma);
    if (!siteUrl) {
      throw new BadRequestException('请先在系统设置中配置 SITE_URL 或在支付渠道中单独填写 returnUrl');
    }

    return `${siteUrl}/api/payments/return/${channelCode}`;
  }

  parseChannelConfig(channel: PaymentChannel) {
    return (channel.configJson as Record<string, unknown> | null) ?? {};
  }

  getConfigValue(config: Record<string, unknown>, ...keys: string[]) {
    for (const key of keys) {
      const value = config[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }

    return '';
  }

  requireConfig(value: string, message: string) {
    if (!value) {
      throw new BadRequestException(message);
    }

    return value;
  }

  joinUrl(baseUrl: string, path: string) {
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  decimalToString(value: Prisma.Decimal) {
    return value.toFixed(2);
  }

  tryParseJson(rawText: string) {
    try {
      return JSON.parse(rawText) as Record<string, any>;
    } catch {
      return null;
    }
  }

  extractProviderMessage(responseData: Record<string, any> | null, rawText: string) {
    if (!responseData) {
      return rawText.slice(0, 300) || '未知错误';
    }

    return String(
      responseData.message ??
        responseData.Message ??
        responseData.msg ??
        responseData.error ??
        responseData.Error ??
        responseData.data ??
        rawText ??
        '未知错误',
    ).slice(0, 300);
  }

  normalizePayload(payload: Record<string, unknown>) {
    return Object.entries(payload).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value == null ? '' : String(value);
      return acc;
    }, {});
  }

  private async loadSiteUrl(prisma: {
    systemConfig: { findUnique(args: unknown): Promise<{ configValue: string | null } | null> };
  }) {
    const config = await prisma.systemConfig.findUnique({
      where: { configKey: 'SITE_URL' },
      select: { configValue: true },
    } as never);

    return String(config?.configValue ?? '').trim().replace(/\/$/, '');
  }
}
