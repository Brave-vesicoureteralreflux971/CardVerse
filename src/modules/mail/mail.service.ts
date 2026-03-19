import { Injectable, NotFoundException } from '@nestjs/common';
import { MailSendStatus } from '@prisma/client';
import { createTransport } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMailTemplateDto, UpdateMailTemplateDto } from './dto/mail-template.dto';
import { toBigIntId } from '../../common/utils/id.util';

interface MailTemplateVariables {
  [key: string]: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  fromAddress: string;
  fromName?: string;
  replyTo?: string;
}

interface SendOrderEventMailOptions {
  deliveryContents?: string[];
}

@Injectable()
export class MailService {
  constructor(private readonly prisma: PrismaService) {}

  bootstrapInfo() {
    return {
      module: 'mail',
      status: 'ready',
      next: ['templates', 'smtp delivery', 'send logs'],
      configKeys: [
        'MAIL_SMTP_HOST',
        'MAIL_SMTP_PORT',
        'MAIL_SMTP_SECURE',
        'MAIL_SMTP_USER',
        'MAIL_SMTP_PASS',
        'MAIL_FROM_ADDRESS',
        'MAIL_FROM_NAME',
        'MAIL_REPLY_TO',
      ],
    };
  }

  listTemplates() {
    return this.prisma.mailTemplate.findMany({ orderBy: { id: 'desc' } });
  }

  createTemplate(payload: CreateMailTemplateDto) {
    return this.prisma.mailTemplate.create({
      data: {
        name: payload.name,
        eventCode: payload.eventCode,
        subject: payload.subject,
        content: payload.content,
        status: payload.status ?? true,
      },
    });
  }

  async updateTemplate(id: string, payload: UpdateMailTemplateDto) {
    await this.ensureExists(id);

    return this.prisma.mailTemplate.update({
      where: { id: toBigIntId(id) },
      data: {
        name: payload.name,
        eventCode: payload.eventCode,
        subject: payload.subject,
        content: payload.content,
        status: payload.status,
      },
    });
  }

  async deleteTemplate(id: string) {
    await this.ensureExists(id);
    await this.prisma.mailTemplate.delete({ where: { id: toBigIntId(id) } });
    return { success: true };
  }

  async sendTestMail(toEmail: string, subject: string, content: string) {
    const smtpConfig = await this.loadSmtpConfig();
    const transporter = this.createSmtpTransport(smtpConfig);

    await transporter.sendMail({
      from: this.formatFrom(smtpConfig),
      to: toEmail,
      replyTo: smtpConfig.replyTo,
      subject,
      html: content,
    });

    return {
      success: true,
      toEmail,
      subject,
      message: '测试邮件发送成功',
    };
  }

  async queueOrderEventMail(orderId: bigint | string, eventCode: string) {
    const log = await this.createOrderEventMailLog(orderId, eventCode);
    this.scheduleMailLogProcess(log.id);
    return log;
  }

  async retryMailLog(id: string) {
    const logId = toBigIntId(id);
    const log = await this.prisma.mailLog.findUnique({ where: { id: logId } });

    if (!log) {
      throw new NotFoundException('邮件日志不存在');
    }

    await this.prisma.mailLog.update({
      where: { id: logId },
      data: {
        sendStatus: MailSendStatus.PENDING,
        errorMessage: null,
        sentAt: null,
      },
    });

    return this.processMailLog(logId);
  }

  async sendOrderEventMail(
    orderId: bigint | string,
    eventCode: string,
    options: SendOrderEventMailOptions = {},
  ) {
    const log = await this.createOrderEventMailLog(orderId, eventCode);
    return this.processMailLog(log.id, options.deliveryContents);
  }

  async ensureExists(id: string) {
    const template = await this.prisma.mailTemplate.findUnique({
      where: { id: toBigIntId(id) },
    });

    if (!template) {
      throw new NotFoundException('邮件模板不存在');
    }
  }

  private async createOrderEventMailLog(orderId: bigint | string, eventCode: string) {
    const normalizedOrderId = typeof orderId === 'bigint' ? orderId : toBigIntId(orderId);
    const order = await this.prisma.order.findUnique({
      where: { id: normalizedOrderId },
      select: { id: true, email: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const template = await this.findActiveTemplate(eventCode);
    return this.prisma.mailLog.create({
      data: {
        orderId: order.id,
        templateId: template?.id,
        toEmail: order.email,
        eventCode,
        sendStatus: MailSendStatus.PENDING,
        errorMessage: null,
        sentAt: null,
      },
    });
  }

  private scheduleMailLogProcess(logId: bigint) {
    setTimeout(() => {
      void this.processMailLog(logId).catch(() => undefined);
    }, 0);
  }

  private async processMailLog(logId: bigint, overrideDeliveryContents?: string[]) {
    const log = await this.prisma.mailLog.findUnique({
      where: { id: logId },
      include: {
        template: true,
        order: {
          include: {
            product: true,
            orderCards: { include: { card: true } },
            paymentRecords: {
              orderBy: { id: 'desc' },
              take: 1,
              include: { paymentChannel: true },
            },
          },
        },
      },
    });

    if (!log) {
      return null;
    }

    const template = log.template ?? (await this.findActiveTemplate(log.eventCode));
    if (!template) {
      return this.prisma.mailLog.update({
        where: { id: log.id },
        data: {
          sendStatus: MailSendStatus.FAILED,
          errorMessage: '邮件模板不存在或未启用',
        },
      });
    }

    if (log.templateId !== template.id) {
      await this.prisma.mailLog.update({
        where: { id: log.id },
        data: { templateId: template.id },
      });
    }

    try {
      const smtpConfig = await this.loadSmtpConfig();
      const deliveryRecords = overrideDeliveryContents?.length
        ? overrideDeliveryContents.map((content) => ({ content }))
        : await this.loadDeliveryRecords(log.order.id);
      const siteUrl = await this.loadSiteUrl();
      const variables = this.buildOrderVariables(log.order, deliveryRecords, siteUrl);
      const subject = this.renderTemplate(template.subject, variables);
      const html = this.renderTemplate(template.content, variables);
      const transporter = this.createSmtpTransport(smtpConfig);

      const info = await transporter.sendMail({
        from: this.formatFrom(smtpConfig),
        to: log.toEmail,
        replyTo: smtpConfig.replyTo,
        subject,
        html,
      });

      const accepted = Array.isArray(info.accepted) ? info.accepted.join(', ') : '';
      const rejected = Array.isArray(info.rejected) ? info.rejected.join(', ') : '';
      const responseNote = [
        info.messageId ? `messageId: ${info.messageId}` : '',
        accepted ? `accepted: ${accepted}` : '',
        rejected ? `rejected: ${rejected}` : '',
        info.response ? `response: ${String(info.response).slice(0, 200)}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      return this.prisma.mailLog.update({
        where: { id: log.id },
        data: {
          templateId: template.id,
          sendStatus: MailSendStatus.SUCCESS,
          sentAt: new Date(),
          errorMessage: responseNote || 'SMTP 已接受投递请求',
        },
      });
    } catch (error) {
      return this.prisma.mailLog.update({
        where: { id: log.id },
        data: {
          templateId: template.id,
          sendStatus: MailSendStatus.FAILED,
          errorMessage: this.toErrorMessage(error),
        },
      });
    }
  }

  private findActiveTemplate(eventCode: string) {
    return this.prisma.mailTemplate.findFirst({
      where: { eventCode, status: true },
      orderBy: { id: 'desc' },
    });
  }

  private async loadSmtpConfig(): Promise<SmtpConfig> {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        configKey: {
          in: [
            'MAIL_SMTP_HOST',
            'MAIL_SMTP_PORT',
            'MAIL_SMTP_SECURE',
            'MAIL_SMTP_USER',
            'MAIL_SMTP_PASS',
            'MAIL_FROM_ADDRESS',
            'MAIL_FROM_NAME',
            'MAIL_REPLY_TO',
          ],
        },
      },
    });

    const configMap = new Map(configs.map((item) => [item.configKey, item.configValue ?? '']));
    const host = configMap.get('MAIL_SMTP_HOST')?.trim() ?? '';
    const portRaw = configMap.get('MAIL_SMTP_PORT')?.trim() ?? '';
    const fromAddress = configMap.get('MAIL_FROM_ADDRESS')?.trim() ?? '';

    if (!host) {
      throw new Error('未配置 SMTP 主机 MAIL_SMTP_HOST');
    }

    if (!portRaw || Number.isNaN(Number(portRaw))) {
      throw new Error('未配置有效的 SMTP 端口 MAIL_SMTP_PORT');
    }

    if (!fromAddress) {
      throw new Error('未配置发件邮箱 MAIL_FROM_ADDRESS');
    }

    return {
      host,
      port: Number(portRaw),
      secure: this.parseBoolean(configMap.get('MAIL_SMTP_SECURE')),
      user: configMap.get('MAIL_SMTP_USER')?.trim() || undefined,
      pass: configMap.get('MAIL_SMTP_PASS')?.trim() || undefined,
      fromAddress,
      fromName: configMap.get('MAIL_FROM_NAME')?.trim() || undefined,
      replyTo: configMap.get('MAIL_REPLY_TO')?.trim() || undefined,
    };
  }

  private buildOrderVariables(
    order: {
      orderNo: string;
      orderName: string;
      email: string;
      queryPasswordPlain: string | null;
      quantity: number;
      totalPrice: unknown;
      payPrice: unknown;
      couponCode: string | null;
      couponDiscountAmount: unknown;
      wholesaleDiscountAmount: unknown;
      paymentChannelCode: string | null;
      buyerIp: string | null;
      thirdPartyOrderNo: string | null;
      createdAt: Date;
      paidAt: Date | null;
      deliveredAt: Date | null;
      product: { name: string; type: string; deliveryType: string; content: string | null };
      orderCards: Array<{ cardSnapshot: string }>;
      paymentRecords: Array<{ thirdTradeNo: string | null; paymentChannel: { name: string } | null }>;
    },
    deliveryRecords: Array<{ content: string }>,
    siteUrl: string,
  ): MailTemplateVariables {
    const latestPayment = order.paymentRecords[0];
    const deliveryContents = deliveryRecords.length
      ? deliveryRecords.map((item) => item.content)
      : order.orderCards.length
        ? order.orderCards.map((item) => item.cardSnapshot)
        : [String(order.product.content ?? '').trim()].filter(Boolean);
    const productContent = deliveryContents.join('\n');

    return {
      orderNo: order.orderNo,
      orderName: order.orderName,
      email: order.email,
      queryPassword: order.queryPasswordPlain ?? '',
      orderQueryUrl: this.buildOrderQueryUrl(siteUrl, order.orderNo),
      quantity: String(order.quantity),
      totalPrice: String(order.totalPrice),
      payPrice: String(order.payPrice),
      couponCode: order.couponCode ?? '',
      couponDiscountAmount: String(order.couponDiscountAmount ?? ''),
      wholesaleDiscountAmount: String(order.wholesaleDiscountAmount ?? ''),
      paymentChannelCode: order.paymentChannelCode ?? '',
      paymentChannelName: latestPayment?.paymentChannel?.name ?? '',
      buyerIp: order.buyerIp ?? '',
      thirdPartyOrderNo: order.thirdPartyOrderNo ?? latestPayment?.thirdTradeNo ?? '',
      createdAt: this.formatDate(order.createdAt),
      paidAt: this.formatDate(order.paidAt),
      deliveredAt: this.formatDate(order.deliveredAt),
      productName: order.product.name,
      productType: order.product.type,
      deliveryType: order.product.deliveryType,
      productContent,
      cardList: productContent,
    };
  }

  private async loadDeliveryRecords(orderId: bigint) {
    const rows = (await this.prisma.$queryRaw`
      SELECT content
      FROM order_delivery_records
      WHERE order_id = ${orderId}
      ORDER BY id ASC
    `) as Array<{ content: string }>;

    return rows;
  }

  private async loadSiteUrl() {
    const config = await this.prisma.systemConfig.findUnique({
      where: { configKey: 'SITE_URL' },
    });

    return String(config?.configValue ?? '').trim().replace(/\/$/, '');
  }

  private buildOrderQueryUrl(siteUrl: string, orderNo: string) {
    if (!siteUrl) {
      return '';
    }

    const searchParams = new URLSearchParams({ orderNo });
    return `${siteUrl}/order/query?${searchParams.toString()}`;
  }

  private renderTemplate(template: string, variables: MailTemplateVariables) {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
      return variables[key] ?? '';
    });
  }

  private createSmtpTransport(config: SmtpConfig) {
    return createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth:
        config.user && config.pass
          ? {
              user: config.user,
              pass: config.pass,
            }
          : undefined,
    });
  }

  private formatFrom(config: SmtpConfig) {
    return config.fromName
      ? `"${config.fromName}" <${config.fromAddress}>`
      : config.fromAddress;
  }

  private parseBoolean(value: string | undefined) {
    return ['1', 'true', 'yes', 'on'].includes((value ?? '').trim().toLowerCase());
  }

  private formatDate(value: Date | null) {
    if (!value) {
      return '';
    }

    return value.toISOString().replace('T', ' ').slice(0, 19);
  }

  private toErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message.slice(0, 500);
    }

    return '邮件发送失败';
  }
}



