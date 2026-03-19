import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CardStatus, DeliveryType, Prisma } from '@prisma/client'
import { toBigIntId } from '../../common/utils/id.util'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto'
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto'

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) { }

  bootstrapInfo() {
    return {
      module: 'product',
      status: 'ready',
      next: ['categories', 'products', 'inventory'],
    }
  }

  listCategories() {
    return this.prisma.productCategory.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'desc' }],
    })
  }

  listPublicCategories() {
    return this.prisma.productCategory.findMany({
      where: { status: true },
      orderBy: [{ sort: 'asc' }, { id: 'desc' }],
    })
  }

  createCategory(payload: CreateCategoryDto) {
    return this.prisma.productCategory.create({
      data: {
        name: payload.name,
        sort: payload.sort ?? 0,
        status: payload.status ?? true,
      },
    })
  }

  async updateCategory(id: string, payload: UpdateCategoryDto) {
    await this.ensureCategoryExists(id)

    return this.prisma.productCategory.update({
      where: { id: toBigIntId(id) },
      data: {
        name: payload.name,
        sort: payload.sort,
        status: payload.status,
      },
    })
  }

  async deleteCategory(id: string) {
    const count = await this.prisma.product.count({
      where: { categoryId: toBigIntId(id) },
    })

    if (count > 0) {
      throw new BadRequestException('当前分类下有关联商品，无法删除')
    }

    await this.prisma.productCategory.delete({
      where: { id: toBigIntId(id) },
    })

    return { success: true }
  }

  async listProducts(query: ProductQueryDto, adminView = true) {
    const products = await this.prisma.product.findMany({
      where: {
        ...(query.keyword
          ? {
            OR: [
              { name: { contains: query.keyword } },
              { slug: { contains: query.keyword } },
            ],
          }
          : {}),
        ...(query.categoryId
          ? { categoryId: toBigIntId(query.categoryId) }
          : {}),
        ...(adminView ? {} : { status: true, category: { status: true } }),
        ...(adminView && query.status !== undefined ? { status: query.status } : {}),
      },
      include: {
        category: true,
        _count: {
          select: {
            cards: true,
            orders: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    })

    return this.attachStock(products)
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: toBigIntId(id) },
      include: {
        category: true,
        couponProducts: {
          include: { coupon: true },
        },
        _count: {
          select: {
            cards: true,
            orders: true,
          },
        },
      },
    })

    if (!product) {
      throw new NotFoundException('商品不存在')
    }

    const [result] = await this.attachStock([product])
    return result
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        couponProducts: {
          include: { coupon: true },
        },
        _count: {
          select: { cards: true },
        },
      },
    })

    if (!product || !product.status || !product.category?.status) {
      throw new NotFoundException('商品不存在')
    }

    const [result] = await this.attachStock([product])
    return result
  }

  async createProduct(payload: CreateProductDto) {
    await this.ensureCategoryExists(payload.categoryId)

    const created = await this.prisma.product.create({
      data: this.toProductData(payload),
      include: { category: true },
    })

    const [result] = await this.attachStock([created])
    return result
  }

  async updateProduct(id: string, payload: UpdateProductDto) {
    await this.ensureProductExists(id)
    await this.ensureCategoryExists(payload.categoryId)

    const updated = await this.prisma.product.update({
      where: { id: toBigIntId(id) },
      data: this.toProductData(payload),
      include: { category: true },
    })

    const [result] = await this.attachStock([updated])
    return result
  }

  async batchUpdateProductStatus(productIds: string[], status: boolean) {
    const normalizedIds = this.normalizeProductIds(productIds)

    if (normalizedIds.length === 0) {
      throw new BadRequestException('请选择要操作的商品')
    }

    const ids = normalizedIds.map((item) => toBigIntId(item))
    const result = await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status },
    })

    if (result.count !== normalizedIds.length) {
      throw new NotFoundException('部分商品不存在或已删除')
    }

    return { success: true, count: result.count }
  }

  async batchDeleteProducts(productIds: string[]) {
    const normalizedIds = this.normalizeProductIds(productIds)

    if (normalizedIds.length === 0) {
      throw new BadRequestException('请选择要删除的商品')
    }

    const ids = normalizedIds.map((item) => toBigIntId(item))
    const products = await this.getProductsForDelete(ids)
    this.ensureProductsCanBeDeleted(products)
    const result = await this.prisma.product.deleteMany({ where: { id: { in: ids } } })

    if (result.count !== normalizedIds.length) {
      throw new NotFoundException('部分商品不存在或已删除')
    }

    return { success: true, count: result.count }
  }
  async updateProductStatus(id: string, status: boolean) {
    await this.ensureProductExists(id)

    return this.prisma.product.update({
      where: { id: toBigIntId(id) },
      data: { status },
    })
  }

  async deleteProduct(id: string) {
    const productId = toBigIntId(id)
    const products = await this.getProductsForDelete([productId])
    this.ensureProductsCanBeDeleted(products)

    await this.prisma.product.delete({ where: { id: productId } })
    return { success: true }
  }

  private async ensureCategoryExists(id: string | number) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id: toBigIntId(id) },
    })

    if (!category) {
      throw new NotFoundException('商品分类不存在')
    }
  }

  private async ensureProductExists(id: string | number) {
    const product = await this.prisma.product.findUnique({
      where: { id: toBigIntId(id) },
    })

    if (!product) {
      throw new NotFoundException('商品不存在')
    }
  }

  private normalizeProductIds(productIds: string[]) {
    return Array.from(new Set(productIds.map((item) => String(item).trim()).filter(Boolean)))
  }

  private async getProductsForDelete(ids: bigint[]) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            cardBatches: true,
            cards: true,
            couponProducts: true,
            orders: true,
          },
        },
      },
    })

    if (products.length !== ids.length) {
      throw new NotFoundException('部分商品不存在或已删除')
    }

    return products
  }

  private ensureProductsCanBeDeleted(
    products: Array<{
      id: bigint
      name: string
      _count: {
        cardBatches: number
        cards: number
        couponProducts: number
        orders: number
      }
    }>,
  ) {
    const blockedProducts = products
      .map((product) => {
        const reasons = [
          product._count.orders > 0 ? `订单 ${product._count.orders} 条` : null,
          product._count.cards > 0 ? `卡密 ${product._count.cards} 条` : null,
          product._count.cardBatches > 0 ? `卡批次 ${product._count.cardBatches} 条` : null,
          product._count.couponProducts > 0 ? `优惠券关联 ${product._count.couponProducts} 条` : null,
        ].filter(Boolean)

        return reasons.length > 0
          ? `${product.name}(ID:${product.id.toString()}) 存在 ${reasons.join('、')}`
          : null
      })
      .filter((item): item is string => Boolean(item))

    if (blockedProducts.length > 0) {
      throw new BadRequestException(`以下商品存在关联数据，无法删除：${blockedProducts.join('；')}`)
    }
  }

  private async attachStock<T extends { id: bigint; deliveryType: DeliveryType; manualStock: number | null }>(products: T[]) {
    if (products.length === 0) {
      return products
    }

    const autoProductIds = products
      .filter((item) => item.deliveryType === DeliveryType.AUTO)
      .map((item) => item.id)

    const stockMap = new Map<string, number>()

    if (autoProductIds.length > 0) {
      const groups = await this.prisma.card.groupBy({
        by: ['productId'],
        where: {
          productId: { in: autoProductIds },
          status: CardStatus.UNUSED,
        },
        _count: {
          _all: true,
        },
      })

      for (const group of groups) {
        stockMap.set(group.productId.toString(), group._count._all)
      }
    }

    return products.map((item) => ({
      ...item,
      stock:
        item.deliveryType === DeliveryType.AUTO
          ? stockMap.get(item.id.toString()) ?? 0
          : item.manualStock ?? 0,
    }))
  }

  private toProductData(
    payload: CreateProductDto | UpdateProductDto,
  ): Prisma.ProductUncheckedCreateInput {
    if ((payload.maxQuantity ?? 1) < (payload.minQuantity ?? 1)) {
      throw new BadRequestException('最大购买数量不能小于最小购买数量')
    }

    if (payload.deliveryType === DeliveryType.MANUAL && payload.manualStock === undefined) {
      throw new BadRequestException('手动发货商品必须填写库存')
    }

    return {
      name: payload.name,
      categoryId: toBigIntId(payload.categoryId),
      slug: payload.slug,
      type: payload.type,
      deliveryType: payload.deliveryType,
      coverImage: payload.coverImage,
      description: payload.description,
      apiHook: payload.apiHook,
      content: payload.content,
      price: new Prisma.Decimal(payload.price),
            wholesalePrice:
        payload.wholesalePrice !== undefined && payload.wholesalePrice > 0
          ? new Prisma.Decimal(payload.wholesalePrice)
          : null,
      minQuantity: payload.minQuantity ?? 1,
      maxQuantity: payload.maxQuantity ?? 1,
      manualStock:
        payload.deliveryType === DeliveryType.MANUAL
          ? payload.manualStock ?? 0
          : null,
      status: payload.status ?? true,
    }
  }
}


