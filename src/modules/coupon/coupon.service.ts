import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toBigIntId } from '../../common/utils/id.util';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  bootstrapInfo() {
    return {
      module: 'coupon',
      status: 'ready',
      next: ['binding to products', 'usage validation'],
    };
  }

  list() {
    return this.prisma.coupon.findMany({
      include: {
        couponProducts: {
          include: { product: true },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  create(payload: CreateCouponDto) {
    return this.persistCoupon(payload);
  }

  async batchUpdateStatus(couponIds: string[], status: boolean) {
    const normalizedIds = Array.from(new Set(couponIds.map((item) => String(item).trim()).filter(Boolean)));

    if (normalizedIds.length === 0) {
      throw new BadRequestException('请选择要操作的优惠券');
    }

    const ids = normalizedIds.map((item) => toBigIntId(item));
    const result = await this.prisma.coupon.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    if (result.count !== normalizedIds.length) {
      throw new NotFoundException('部分优惠券不存在或已删除');
    }

    return { success: true, count: result.count };
  }

  async batchDelete(couponIds: string[]) {
    const normalizedIds = Array.from(new Set(couponIds.map((item) => String(item).trim()).filter(Boolean)));

    if (normalizedIds.length === 0) {
      throw new BadRequestException('请选择要删除的优惠券');
    }

    const ids = normalizedIds.map((item) => toBigIntId(item));
    const result = await this.prisma.coupon.deleteMany({ where: { id: { in: ids } } });

    if (result.count !== normalizedIds.length) {
      throw new NotFoundException('部分优惠券不存在或已删除');
    }

    return { success: true, count: result.count };
  }
  async update(id: string, payload: UpdateCouponDto) {
    await this.ensureExists(id);

    return this.persistCoupon(payload, toBigIntId(id));
  }

  async delete(id: string) {
    await this.ensureExists(id);
    await this.prisma.coupon.delete({ where: { id: toBigIntId(id) } });
    return { success: true };
  }

  private async persistCoupon(
    payload: CreateCouponDto | UpdateCouponDto,
    id?: bigint,
  ) {
    const data = {
      code: payload.code,
      discountType: payload.discountType,
      discountValue: new Prisma.Decimal(payload.discountValue),
      minAmount:
        payload.minAmount !== undefined
          ? new Prisma.Decimal(payload.minAmount)
          : null,
      totalLimit: payload.totalLimit,
      startAt: payload.startAt ? new Date(payload.startAt) : null,
      endAt: payload.endAt ? new Date(payload.endAt) : null,
      status: payload.status ?? true,
    };

    return this.prisma.$transaction(async (tx) => {
      const coupon = id
        ? await tx.coupon.update({ where: { id }, data })
        : await tx.coupon.create({ data });

      await tx.couponProduct.deleteMany({ where: { couponId: coupon.id } });

      if (payload.productIds?.length) {
        await tx.couponProduct.createMany({
          data: payload.productIds.map((productId) => ({
            couponId: coupon.id,
            productId: toBigIntId(productId),
          })),
        });
      }

      return tx.coupon.findUnique({
        where: { id: coupon.id },
        include: {
          couponProducts: {
            include: { product: true },
          },
        },
      });
    });
  }

  private async ensureExists(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: toBigIntId(id) },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }
  }
}

