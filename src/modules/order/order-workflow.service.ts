import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  CardStatus,
  DeliveryType,
  OrderStatus,
  PaymentRecordStatus,
  Prisma,
} from '@prisma/client'
import { MailService } from '../mail/mail.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class OrderWorkflowService {
  private readonly logger = new Logger(OrderWorkflowService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async markOrderPaid(options: {
    orderId: bigint
    channelCode: string
    thirdTradeNo?: string
    callbackPayload?: Prisma.InputJsonValue
  }) {
    const channel = await this.prisma.paymentChannel.findUnique({
      where: { code: options.channelCode },
    })

    if (!channel || !channel.status) {
      throw new BadRequestException('支付渠道不可用')
    }

    return this.finalizeOrderSettlement({
      orderId: options.orderId,
      paymentChannelCode: channel.code,
      paymentChannelId: channel.id,
      thirdTradeNo: options.thirdTradeNo,
      callbackPayload: options.callbackPayload,
      skipPaymentRecord: false,
    })
  }

  async settleZeroPaymentOrder(orderId: bigint, reason = 'DISCOUNT_OFFSET') {
    return this.finalizeOrderSettlement({
      orderId,
      paymentChannelCode: null,
      callbackPayload: {
        settlementReason: reason,
        settlementType: 'ZERO_PAYMENT',
      },
      skipPaymentRecord: true,
    })
  }

  private async finalizeOrderSettlement(options: {
    orderId: bigint
    paymentChannelCode: string | null
    paymentChannelId?: bigint
    thirdTradeNo?: string
    callbackPayload?: Prisma.InputJsonValue
    skipPaymentRecord: boolean
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: options.orderId },
      include: { product: true },
    })

    if (!order) {
      throw new NotFoundException('订单不存在')
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.PAID) {
      return this.prisma.order.findUnique({
        where: { id: order.id },
        include: {
          product: true,
          orderCards: { include: { card: true } },
          paymentRecords: { include: { paymentChannel: true } },
          mailLogs: true,
        },
      })
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { product: true },
        })

        if (!currentOrder) {
          throw new NotFoundException('订单不存在')
        }

        if (
          currentOrder.status === OrderStatus.DELIVERED ||
          currentOrder.status === OrderStatus.PAID
        ) {
          return {
            order: await tx.order.findUnique({
              where: { id: currentOrder.id },
              include: {
                product: true,
                orderCards: { include: { card: true } },
                paymentRecords: { include: { paymentChannel: true } },
                mailLogs: true,
              },
            }),
            mailEventCode: null,
          }
        }

        const now = new Date()

        if (!options.skipPaymentRecord) {
          if (!options.paymentChannelId) {
            throw new BadRequestException('支付渠道不可用')
          }

          await tx.paymentRecord.create({
            data: {
              orderId: currentOrder.id,
              paymentChannelId: options.paymentChannelId,
              outTradeNo: currentOrder.orderNo,
              thirdTradeNo: options.thirdTradeNo,
              amount: currentOrder.payPrice,
              status: PaymentRecordStatus.SUCCESS,
              rawCallback: options.callbackPayload,
              paidAt: now,
            },
          })
        }

        if (currentOrder.product.deliveryType === DeliveryType.MANUAL) {
          const latestProduct = await tx.product.findUnique({
            where: { id: currentOrder.productId },
          })

          const manualStock = latestProduct?.manualStock ?? 0
          if (manualStock < currentOrder.quantity) {
            await tx.order.update({
              where: { id: currentOrder.id },
              data: {
                status: OrderStatus.FAILED,
                paymentChannelCode: options.paymentChannelCode,
                thirdPartyOrderNo: options.thirdTradeNo,
                paidAt: now,
              },
            })

            throw new BadRequestException('手动发货库存不足，订单已标记为异常')
          }

          await tx.product.update({
            where: { id: currentOrder.productId },
            data: {
              manualStock: {
                decrement: currentOrder.quantity,
              },
            },
          })

          const paidOrder = await tx.order.update({
            where: { id: currentOrder.id },
            data: {
              status: OrderStatus.PAID,
              paymentChannelCode: options.paymentChannelCode,
              thirdPartyOrderNo: options.thirdTradeNo,
              paidAt: now,
            },
          })

          return {
            order: await tx.order.findUnique({
              where: { id: paidOrder.id },
              include: {
                product: true,
                orderCards: { include: { card: true } },
                paymentRecords: { include: { paymentChannel: true } },
                mailLogs: true,
              },
            }),
            mailEventCode: 'ORDER_PAID',
          }
        }

        const availableCards = await tx.card.findMany({
          where: {
            productId: currentOrder.productId,
            status: CardStatus.UNUSED,
          },
          orderBy: { id: 'asc' },
          take: currentOrder.quantity,
        })

        if (availableCards.length < currentOrder.quantity) {
          await tx.order.update({
            where: { id: currentOrder.id },
            data: {
              status: OrderStatus.FAILED,
              paymentChannelCode: options.paymentChannelCode,
              thirdPartyOrderNo: options.thirdTradeNo,
              paidAt: now,
            },
          })

          throw new BadRequestException('可发卡库存不足，订单已标记为异常')
        }

        await tx.card.updateMany({
          where: {
            id: { in: availableCards.map((card) => card.id) },
          },
          data: {
            status: CardStatus.SOLD,
            soldOrderId: currentOrder.id,
            soldAt: now,
          },
        })

        await tx.orderCard.createMany({
          data: availableCards.map((card) => ({
            orderId: currentOrder.id,
            cardId: card.id,
            cardSnapshot: card.cardSecret,
          })),
        })

        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO order_delivery_records (order_id, delivery_type, content, created_at)
            VALUES ${Prisma.join(
              availableCards.map((card) =>
                Prisma.sql`(${currentOrder.id}, ${'AUTO_CARD'}, ${card.cardSecret}, ${now})`,
              ),
            )}
          `,
        )

        const deliveredOrder = await tx.order.update({
          where: { id: currentOrder.id },
          data: {
            status: OrderStatus.DELIVERED,
            paymentChannelCode: options.paymentChannelCode,
            thirdPartyOrderNo: options.thirdTradeNo,
            paidAt: now,
            deliveredAt: now,
          },
        })

        return {
          order: await tx.order.findUnique({
            where: { id: deliveredOrder.id },
            include: {
              product: true,
              orderCards: { include: { card: true } },
              paymentRecords: { include: { paymentChannel: true } },
              mailLogs: true,
            },
          }),
          mailEventCode: 'ORDER_DELIVERED',
        }
      },
      { timeout: 15000, maxWait: 5000 },
    )

    if (result.order && result.mailEventCode) {
      void this.mailService.queueOrderEventMail(result.order.id, result.mailEventCode)
    }

    if (result.order) {
      void this.sendProductWebhook(result.order)
    }

    return result.order
  }

  private async sendProductWebhook(order: {
    orderNo: string
    email: string
    queryPasswordPlain: string | null
    payPrice: Prisma.Decimal
    product: {
      id: bigint
      name: string
      apiHook: string | null
    }
  }) {
    const webhookUrl = String(order.product.apiHook ?? '').trim()

    if (!webhookUrl) {
      return
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: order.product.id.toString(),
          productName: order.product.name,
          email: order.email,
          queryPassword: order.queryPasswordPlain ?? '',
          orderNo: order.orderNo,
          payPrice: Number(order.payPrice),
        }),
      })

      if (!response.ok) {
        this.logger.warn(
          `Webhook request failed for order ${order.orderNo}: ${response.status} ${response.statusText}`,
        )
      }
    } catch (error) {
      this.logger.warn(
        `Webhook request failed for order ${order.orderNo}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
}
