import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CardStatus,
  CouponDiscountType,
  DeliveryType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toBigIntId } from '../../common/utils/id.util';
import {
  generateOrderNo,
  generateQueryPassword,
  hashText,
} from '../../common/utils/order.util';
import { MailService } from '../mail/mail.service';
import {
  CreateOrderDto,
  ManualDeliverOrderDto,
  OrderListQueryDto,
  QueryOrderDto,
} from './dto/order.dto';
import { OrderWorkflowService } from './order-workflow.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly orderWorkflowService: OrderWorkflowService,
  ) {}

  bootstrapInfo() {
    return {
      module: 'order',
      status: 'ready',
      next: ['create order', 'payment callback', 'delivery'],
    };
  }

  list(query: OrderListQueryDto) {
    return this.prisma.order.findMany({
      where: {
        ...(query.keyword
          ? {
              OR: [
                { orderNo: { contains: query.keyword } },
                { orderName: { contains: query.keyword } },
              ],
            }
          : {}),
        ...(query.email ? { email: { contains: query.email } } : {}),
        ...(query.status ? { status: query.status as OrderStatus } : {}),
        ...(query.productId ? { productId: toBigIntId(query.productId) } : {}),
        ...(query.paymentChannelCode
          ? { paymentChannelCode: query.paymentChannelCode }
          : {}),
      },
      include: {
        product: true,
        paymentRecords: { orderBy: { createdAt: 'desc' }, include: { paymentChannel: true } },
        orderCards: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async detail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: toBigIntId(id) },
      include: {
        product: true,
        paymentRecords: { orderBy: { createdAt: 'desc' }, include: { paymentChannel: true } },
        orderCards: { include: { card: true } },
        mailLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return this.attachDeliveryRecords(order);
  }

  async create(payload: CreateOrderDto, buyerIp?: string) {
    await this.verifyTurnstileIfEnabled(payload.cfTurnstileToken, buyerIp);

    const quantity = payload.quantity ?? 1;
    const product = await this.prisma.product.findUnique({
      where: { id: toBigIntId(payload.productId) },
      include: {
        couponProducts: {
          include: { coupon: true },
        },
      },
    });

    if (!product || !product.status) {
      throw new NotFoundException('商品不存在或未上架');
    }

    if (quantity < product.minQuantity || quantity > product.maxQuantity) {
      throw new BadRequestException('购买数量不在允许范围内');
    }

    if (product.deliveryType === DeliveryType.AUTO) {
      const availableCardCount = await this.prisma.card.count({
        where: {
          productId: product.id,
          status: CardStatus.UNUSED,
        },
      });

      if (availableCardCount < quantity) {
        throw new BadRequestException('库存不足');
      }
    } else {
      const manualStock = product.manualStock ?? 0;
      if (manualStock < quantity) {
        throw new BadRequestException('库存不足');
      }
    }

    const totalPrice = Number(product.price) * quantity;
    let couponDiscountAmount = 0;
    let couponCode: string | undefined;

    if (payload.couponCode) {
      const couponBinding = product.couponProducts.find(
        (item) => item.coupon.code === payload.couponCode,
      );

      if (!couponBinding || !couponBinding.coupon.status) {
        throw new BadRequestException('优惠码无效');
      }

      const coupon = couponBinding.coupon;
      const now = new Date();

      if (
        (coupon.startAt && now < coupon.startAt) ||
        (coupon.endAt && now > coupon.endAt)
      ) {
        throw new BadRequestException('优惠码不在有效期内');
      }

      if (coupon.totalLimit && coupon.usedCount >= coupon.totalLimit) {
        throw new BadRequestException('优惠码已达到使用上限');
      }

      if (coupon.minAmount && totalPrice < Number(coupon.minAmount)) {
        throw new BadRequestException('当前订单金额未达到优惠码使用门槛');
      }

      couponCode = coupon.code;
      couponDiscountAmount =
        coupon.discountType === CouponDiscountType.FIXED
          ? Number(coupon.discountValue)
          : Number(((totalPrice * Number(coupon.discountValue)) / 100).toFixed(2));
    }

        const wholesalePrice = Number(product.wholesalePrice ?? 0);
    const wholesaleDiscountAmount = wholesalePrice > 0
      ? Math.max(0, totalPrice - wholesalePrice * quantity)
      : 0;

    const maxCouponDiscountAmount = Math.max(
      0,
      totalPrice - wholesaleDiscountAmount,
    );
    couponDiscountAmount = Math.min(couponDiscountAmount, maxCouponDiscountAmount);

    const payPrice = Math.max(
      0,
      totalPrice - couponDiscountAmount - wholesaleDiscountAmount,
    );

    if (payPrice > 0) {
      if (!payload.paymentChannelCode) {
        throw new BadRequestException('请选择支付方式');
      }

      const paymentChannel = await this.prisma.paymentChannel.findUnique({
        where: { code: payload.paymentChannelCode },
      });

      if (!paymentChannel || !paymentChannel.status) {
        throw new BadRequestException('支付方式不存在或未启用');
      }
    }

    const queryPassword = generateQueryPassword();

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          orderName: product.name,
          orderType: product.type,
          email: payload.email,
          productId: product.id,
          quantity,
          totalPrice: new Prisma.Decimal(totalPrice),
          couponCode,
          couponDiscountAmount: new Prisma.Decimal(couponDiscountAmount),
          wholesaleDiscountAmount: new Prisma.Decimal(wholesaleDiscountAmount),
          payPrice: new Prisma.Decimal(payPrice),
          paymentChannelCode: payPrice > 0 ? payload.paymentChannelCode : null,
          buyerIp,
          queryPasswordHash: hashText(queryPassword),
          queryPasswordPlain: queryPassword,
          status: OrderStatus.PENDING,
        },
        include: {
          product: true,
        },
      });

      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return created;
    });

    if (payPrice <= 0) {
      const settledOrder = await this.orderWorkflowService.settleZeroPaymentOrder(
        order.id,
        couponCode ? 'COUPON_OFFSET' : 'DISCOUNT_OFFSET',
      );

      return {
        ...settledOrder,
        queryPassword,
        requiresPayment: false,
        message: '优惠已抵扣，本次订单无需支付',
      };
    }

    return {
      ...order,
      queryPassword,
      requiresPayment: true,
      message: '订单已创建，请继续完成支付',
    };
  }

  async queryByOrderNo(orderNo: string, payload: QueryOrderDto) {
    const order = await this.findOrderByOrderNo(orderNo);

    if (order.queryPasswordHash !== hashText(payload.queryPassword)) {
      throw new BadRequestException('查询密码错误');
    }

    return order;
  }

  async adminQueryByOrderNo(orderNo: string) {
    return this.findOrderByOrderNo(orderNo);
  }

  async batchDelete(orderIds: string[]) {
    const normalizedIds = Array.from(
      new Set(orderIds.map((item) => String(item).trim()).filter(Boolean)),
    );

    if (normalizedIds.length === 0) {
      throw new BadRequestException('请提供需要删除的订单');
    }

    const ids = normalizedIds.map((item) => toBigIntId(item));
    const orders = await this.prisma.order.findMany({
      where: { id: { in: ids } },
      include: {
        product: true,
      },
    });

    if (orders.length !== ids.length) {
      throw new NotFoundException('部分订单不存在或已被删除');
    }

    const manualStockRestoreMap = new Map<string, { productId: bigint; quantity: number }>();
    const couponRestoreMap = new Map<string, number>();

    for (const order of orders) {
      if (
        order.product.deliveryType === DeliveryType.MANUAL &&
        (order.status === OrderStatus.PAID ||
          order.status === OrderStatus.DELIVERED)
      ) {
        const key = order.productId.toString();
        const current = manualStockRestoreMap.get(key);
        manualStockRestoreMap.set(key, {
          productId: order.productId,
          quantity: (current?.quantity ?? 0) + order.quantity,
        });
      }

      if (order.couponCode) {
        couponRestoreMap.set(
          order.couponCode,
          (couponRestoreMap.get(order.couponCode) ?? 0) + 1,
        );
      }
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.card.updateMany({
        where: { soldOrderId: { in: ids } },
        data: {
          status: CardStatus.UNUSED,
          soldOrderId: null,
          soldAt: null,
        },
      }),
      this.prisma.orderCard.deleteMany({
        where: { orderId: { in: ids } },
      }),
      this.prisma.$executeRaw`
        DELETE FROM order_delivery_records
        WHERE order_id IN (${Prisma.join(ids)})
      `,
      this.prisma.mailLog.deleteMany({
        where: { orderId: { in: ids } },
      }),
      this.prisma.paymentRecord.deleteMany({
        where: { orderId: { in: ids } },
      }),
      ...Array.from(manualStockRestoreMap.values()).map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: {
            manualStock: {
              increment: item.quantity,
            },
          },
        }),
      ),
      ...Array.from(couponRestoreMap.entries()).map(([code, count]) =>
        this.prisma.coupon.updateMany({
          where: {
            code,
            usedCount: { gte: count },
          },
          data: {
            usedCount: {
              decrement: count,
            },
          },
        }),
      ),
      this.prisma.order.deleteMany({
        where: { id: { in: ids } },
      }),
    ];

    await this.prisma.$transaction(operations);

    return { success: true, count: normalizedIds.length };
  }

  async batchResendEmail(orderIds: string[]) {
    const normalizedIds = Array.from(
      new Set(orderIds.map((item) => String(item).trim()).filter(Boolean)),
    );

    if (normalizedIds.length === 0) {
      throw new BadRequestException('请提供需要补发邮件的订单');
    }

    const ids = normalizedIds.map((item) => toBigIntId(item));
    const orders = await this.prisma.order.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true },
    });

    if (orders.length !== ids.length) {
      throw new NotFoundException('部分订单不存在或已被删除');
    }

    for (const order of orders) {
      await this.mailService.sendOrderEventMail(
        order.id,
        this.resolveResendMailEventCode(order.status),
      );
    }

    return { success: true, count: orders.length };
  }

  private async verifyTurnstileIfEnabled(token?: string, buyerIp?: string) {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        configKey: {
          in: [
            'CLOUDFLARE_TURNSTILE_ENABLED',
            'CLOUDFLARE_TURNSTILE_SECRET_KEY',
          ],
        },
      },
    });

    const configMap = new Map(
      configs.map((item) => [item.configKey, item.configValue ?? '']),
    );

    const enabled = ['1', 'true', 'yes', 'on'].includes(
      (configMap.get('CLOUDFLARE_TURNSTILE_ENABLED') || '').trim().toLowerCase(),
    );

    if (!enabled) {
      return;
    }

    const secretKey = (
      configMap.get('CLOUDFLARE_TURNSTILE_SECRET_KEY') || ''
    ).trim();

    if (!secretKey) {
      throw new BadRequestException('Cloudflare Turnstile 密钥未配置');
    }

    if (!token?.trim()) {
      throw new BadRequestException('请先完成验证码校验');
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token.trim(),
          ...(buyerIp ? { remoteip: buyerIp } : {}),
        }),
      },
    );

    if (!response.ok) {
      throw new BadRequestException('验证码校验服务请求失败');
    }

    const result = (await response.json()) as { success?: boolean };

    if (!result.success) {
      throw new BadRequestException('验证码校验未通过');
    }
  }

  private async findOrderByOrderNo(orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      include: {
        product: true,
        orderCards: { include: { card: true } },
        paymentRecords: { orderBy: { createdAt: 'desc' }, include: { paymentChannel: true } },
        mailLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return this.attachDeliveryRecords(order);
  }

  async manualDeliver(id: string, payload: ManualDeliverOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: toBigIntId(id) },
      include: { product: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const deliveryContent = String(payload.deliveryContent ?? '').trim();

    if (!deliveryContent) {
      throw new BadRequestException('请填写发货内容');
    }

    if (order.status === OrderStatus.DELIVERED) {
      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          UPDATE orders
          SET manual_delivery_content = ${deliveryContent}
          WHERE id = ${order.id}
        `;

        await tx.$executeRaw`
          INSERT INTO order_delivery_records (order_id, delivery_type, content, created_at)
          VALUES (${order.id}, ${'SUPPLEMENT'}, ${deliveryContent}, NOW())
        `;
      });

      await this.mailService.sendOrderEventMail(order.id, 'ORDER_RESEND', {
        deliveryContents: [deliveryContent],
      });

      return this.detail(id);
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('当前订单状态不允许手动发货');
    }

    if (order.product.deliveryType !== DeliveryType.MANUAL) {
      throw new BadRequestException('当前订单只支持补录发货内容');
    }

    const deliveredAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE orders
        SET status = ${OrderStatus.DELIVERED},
            delivered_at = ${deliveredAt},
            manual_delivery_content = ${deliveryContent}
        WHERE id = ${order.id}
      `;

      await tx.$executeRaw`
        INSERT INTO order_delivery_records (order_id, delivery_type, content, created_at)
        VALUES (${order.id}, ${'MANUAL'}, ${deliveryContent}, ${deliveredAt})
      `;
    });

    await this.mailService.queueOrderEventMail(order.id, 'ORDER_DELIVERED');

    return this.detail(id);
  }

  async resendEmail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: toBigIntId(id) },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return this.mailService.sendOrderEventMail(
      order.id,
      this.resolveResendMailEventCode(order.status),
    );
  }

  private resolveResendMailEventCode(status: OrderStatus) {
    if (status === OrderStatus.PAID) {
      return 'ORDER_PAID';
    }

    if (status === OrderStatus.DELIVERED) {
      return 'ORDER_RESEND';
    }

    throw new BadRequestException('当前订单状态不支持补发邮件');
  }

  private async attachDeliveryRecords<
    T extends {
      id: bigint;
      orderCards?: Array<{ cardSnapshot: string }>;
      manualDeliveryContent?: string | null;
      product?: { content?: string | null };
    },
  >(order: T) {
    const records = await this.loadDeliveryRecords(order.id);

    if (records.length > 0) {
      return {
        ...order,
        deliveryRecords: records,
      };
    }

    const fallbackRecords = [
      ...(order.orderCards ?? []).map((item) => ({
        id: '',
        deliveryType: 'AUTO_CARD',
        content: item.cardSnapshot,
        createdAt: null,
      })),
      ...(() => {
        const content = String(
          order.manualDeliveryContent ?? order.product?.content ?? '',
        ).trim();
        return content
          ? [
              {
                id: '',
                deliveryType: 'MANUAL',
                content,
                createdAt: null,
              },
            ]
          : [];
      })(),
    ];

    return {
      ...order,
      deliveryRecords: fallbackRecords,
    };
  }

  private async loadDeliveryRecords(orderId: bigint) {
    const rows = (await this.prisma.$queryRaw`
      SELECT id, delivery_type AS deliveryType, content, created_at AS createdAt
      FROM order_delivery_records
      WHERE order_id = ${orderId}
      ORDER BY id DESC
    `) as Array<{
      id: bigint;
      deliveryType: string;
      content: string;
      createdAt: Date | null;
    }>;

    return rows.map((item) => ({
      ...item,
      id: item.id.toString(),
    }));
  }
}












