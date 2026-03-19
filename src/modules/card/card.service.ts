import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CardStatus } from '@prisma/client'
import { toBigIntId } from '../../common/utils/id.util'
import { PrismaService } from '../prisma/prisma.service'
import { CardQueryDto, ImportCardsDto, UpdateCardDto, UpdateCardStatusDto } from './dto/card.dto'

@Injectable()
export class CardService {
  constructor(private readonly prisma: PrismaService) { }

  bootstrapInfo() {
    return {
      module: 'card',
      status: 'ready',
      next: ['batch import', 'status changes', 'stock allocation'],
    }
  }

  list(query: CardQueryDto) {
    return this.prisma.card.findMany({
      where: {
        ...(query.productId ? { productId: toBigIntId(query.productId) } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        product: true,
        batch: true,
        soldOrder: true,
      },
      orderBy: { id: 'desc' },
    })
  }

  async import(payload: ImportCardsDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: toBigIntId(payload.productId) },
    })

    if (!product) {
      throw new NotFoundException('商品不存在')
    }

    const normalizedCards = payload.cards
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    if (normalizedCards.length === 0) {
      throw new BadRequestException('卡密内容不能为空')
    }

    const CHUNK_SIZE = 3000

    const batchId = await this.prisma.$transaction(
      async (tx) => {
        const batch = await tx.cardBatch.create({
          data: {
            productId: product.id,
            batchName: payload.batchName,
            totalCount: normalizedCards.length,
            remark: payload.remark,
          },
        })

        const cardsToCreate = normalizedCards.map((card) => ({
          batchId: batch.id,
          productId: product.id,
          cardSecret: card,
          status: CardStatus.UNUSED
        }))


        for (let i = 0; i < cardsToCreate.length; i += CHUNK_SIZE) {
          const chunk = cardsToCreate.slice(i, i + CHUNK_SIZE)
          await tx.card.createMany({
            data: chunk,
          })
        }

        return batch.id
      },
      {
        timeout: 20000,
        maxWait: 10000,
      },
    )

    return this.prisma.cardBatch.findUnique({
      where: { id: batchId },
      include: {
        product: true
      }
    })
  }

  async batchDelete(cardIds: string[]) {
    const normalizedIds = Array.from(new Set(cardIds.map((item) => String(item).trim()).filter(Boolean)))

    if (normalizedIds.length === 0) {
      throw new BadRequestException('请选择要删除的卡密')
    }

    const ids = normalizedIds.map((item) => toBigIntId(item))
    const cards = await this.prisma.card.findMany({
      where: { id: { in: ids } },
      include: { orderCards: true },
    })

    if (cards.length !== ids.length) {
      throw new NotFoundException('部分卡密不存在或已删除')
    }

    for (const card of cards) {
      if (card.status === CardStatus.SOLD || card.soldOrderId || card.orderCards.length > 0) {
        throw new BadRequestException('已售出或已关联订单的卡密不允许删除')
      }

      if (card.status === CardStatus.LOCKED) {
        throw new BadRequestException('已锁定卡密不允许删除')
      }
    }

    const batchDeleteCountMap = new Map<string, { batchId: bigint; deleteCount: number }>()

    for (const card of cards) {
      const key = card.batchId.toString()
      const current = batchDeleteCountMap.get(key)
      batchDeleteCountMap.set(key, {
        batchId: card.batchId,
        deleteCount: (current?.deleteCount ?? 0) + 1,
      })
    }

    const batches = await this.prisma.cardBatch.findMany({
      where: {
        id: {
          in: Array.from(batchDeleteCountMap.values()).map((item) => item.batchId),
        },
      },
      select: {
        id: true,
        totalCount: true,
      },
    })

    const batchSyncPlan = batches.map((batch) => {
      const deleteCount = batchDeleteCountMap.get(batch.id.toString())?.deleteCount ?? 0
      return {
        batchId: batch.id,
        remainingCount: Math.max(0, batch.totalCount - deleteCount),
      }
    })

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.card.deleteMany({ where: { id: { in: ids } } })

      if (result.count !== ids.length) {
        throw new BadRequestException('卡密删除失败，请刷新后重试')
      }

      for (const item of batchSyncPlan) {
        const { batchId, remainingCount } = item
        if (remainingCount > 0) {
          await tx.cardBatch.update({
            where: { id: batchId },
            data: { totalCount: remainingCount },
          })
          continue
        }

        await tx.cardBatch.delete({
          where: { id: batchId },
        })
      }
    }, {
      timeout: 20000,
      maxWait: 10000,
    })

    return { success: true, count: normalizedIds.length }
  }
  async update(id: string, payload: UpdateCardDto) {
    const card = await this.prisma.card.findUnique({
      where: { id: toBigIntId(id) },
      include: { orderCards: true },
    })

    if (!card) {
      throw new NotFoundException('卡密不存在')
    }

    const cardSecret = payload.cardSecret.trim()
    if (!cardSecret) {
      throw new BadRequestException('卡密不能为空')
    }

    if (card.status === CardStatus.SOLD || card.orderCards.length > 0) {
      throw new BadRequestException('已售出卡密不允许编辑')
    }

    return this.prisma.card.update({
      where: { id: card.id },
      data: {
        cardSecret,
        ...(payload.status ? { status: payload.status } : {}),
      },
      include: {
        product: true,
        batch: true,
        soldOrder: true,
      },
    })
  }

  async delete(id: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: toBigIntId(id) },
      include: { orderCards: true },
    })

    if (!card) {
      throw new NotFoundException('卡密不存在')
    }

    if (card.status === CardStatus.SOLD || card.soldOrderId || card.orderCards.length > 0) {
      throw new BadRequestException('已售出或已关联订单的卡密不允许删除')
    }

    if (card.status === CardStatus.LOCKED) {
      throw new BadRequestException('已锁定卡密不允许删除')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.card.delete({ where: { id: card.id } })

      const remainingCount = await tx.card.count({
        where: { batchId: card.batchId },
      })

      if (remainingCount > 0) {
        await tx.cardBatch.update({
          where: { id: card.batchId },
          data: { totalCount: remainingCount },
        })
        return
      }

      await tx.cardBatch.delete({
        where: { id: card.batchId },
      })
    })

    return { success: true }
  }

  async updateStatus(id: string, payload: UpdateCardStatusDto) {
    const card = await this.prisma.card.findUnique({
      where: { id: toBigIntId(id) },
    })

    if (!card) {
      throw new NotFoundException('卡密不存在')
    }

    return this.prisma.card.update({
      where: { id: toBigIntId(id) },
      data: { status: payload.status },
    })
  }
}
