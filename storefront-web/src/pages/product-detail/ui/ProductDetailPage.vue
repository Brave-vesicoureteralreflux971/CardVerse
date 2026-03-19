<script setup lang="ts">
import { createOrder } from '@/entities/order/api/order'
import { fetchPublicPaymentChannels } from '@/entities/order/api/payment'
import { createPayment } from '@/entities/order/api/payment-create'
import type { PaymentChannelItem } from '@/entities/order/model/payment'
import { fetchProductBySlug } from '@/entities/product/api/product'
import type { ProductItem } from '@/entities/product/model/types'
import { fetchSiteBootstrap } from '@/entities/site/api/site'
import TurnstileWidget from '@/shared/components/TurnstileWidget.vue'
import { resolveAssetUrl } from '@/shared/utils/asset'
import { formatPrice } from '@/shared/utils/format'
import {
  NAlert,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSpin,
  NTag,
  useMessage,
} from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const submitting = ref(false)
const product = ref<ProductItem | null>(null)
const paymentChannels = ref<PaymentChannelItem[]>([])
const turnstileEnabled = ref(false)
const turnstileSiteKey = ref('')
const turnstileToken = ref('')
const email = ref('')
const quantity = ref(1)
const couponCode = ref('')
const selectedPaymentChannelCode = ref('')
const latestOrder = ref<{
  orderNo: string
  queryPassword: string
  payPrice: string | number
  paymentChannelCode?: string
  message?: string
} | null>(null)

const maxQuantity = computed(() => 99)
const productIdNumber = computed(() => Number(product.value?.id ?? 0))
const deliveryLabel = computed(() => {
  const deliveryType = (product.value as ProductItem & { deliveryType?: string } | null)?.deliveryType
  return deliveryType === 'MANUAL' ? '人工发货' : '自动发货'
})
const deliveryDescription = computed(() => {
  const deliveryType = (product.value as ProductItem & { deliveryType?: string } | null)?.deliveryType
  return deliveryType === 'MANUAL' ? '支付成功后人工处理' : '支付成功后自动处理'
})
const productIntroduction = computed(() => {
  const richContent = product.value?.content?.trim()
  if (richContent) {
    return richContent
  }

  const summary = product.value?.description?.trim()
  if (!summary) {
    return ''
  }

  return summary.replace(/\n/g, '<br />')
})

function saveOrderCredential(orderNo: string, queryPassword: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(`order-query:${orderNo}`, JSON.stringify({ queryPassword }))
}

async function loadPage() {
  loading.value = true

  try {
    const [productData, channels, siteData] = await Promise.all([
      fetchProductBySlug(String(route.params.slug)),
      fetchPublicPaymentChannels(),
      fetchSiteBootstrap(),
    ])

    product.value = productData
    paymentChannels.value = channels
    selectedPaymentChannelCode.value = channels[0]?.code ?? ''
    turnstileEnabled.value = !!siteData.cloudflareTurnstileEnabled
    turnstileSiteKey.value = siteData.cloudflareTurnstileSiteKey || ''
  } catch (error) {
    message.error(error instanceof Error ? error.message : '商品加载失败')
  } finally {
    loading.value = false
  }
}

async function submitOrder() {
  if (!product.value) {
    return
  }

  if (!email.value.trim()) {
    message.warning('请输入邮箱地址')
    return
  }

  if (!selectedPaymentChannelCode.value) {
    message.warning('请选择支付方式')
    return
  }

  if (turnstileEnabled.value && !turnstileToken.value.trim()) {
    message.warning('请先完成验证码校验')
    return
  }

  submitting.value = true

  try {
    const order = await createOrder({
      productId: productIdNumber.value,
      email: email.value.trim(),
      quantity: quantity.value,
      couponCode: couponCode.value.trim() || undefined,
      paymentChannelCode: selectedPaymentChannelCode.value,
      cfTurnstileToken: turnstileEnabled.value ? turnstileToken.value.trim() : undefined,
    })

    saveOrderCredential(order.orderNo, order.queryPassword)

    if (order.requiresPayment === false || Number(order.payPrice) <= 0) {
      latestOrder.value = {
        orderNo: order.orderNo,
        queryPassword: order.queryPassword,
        payPrice: order.payPrice,
        paymentChannelCode: order.paymentChannelCode || '无需支付',
        message: order.message || '订单已创建，无需支付',
      }

      message.success(order.message || '订单已创建，无需支付')
      await router.push({
        path: '/order/query',
        query: { orderNo: order.orderNo },
      })
      return
    }

    const payment = await createPayment(order.orderNo)
    const redirectTarget = payment.paymentUrl || payment.redirectUrl || null

    latestOrder.value = {
      orderNo: order.orderNo,
      queryPassword: order.queryPassword,
      payPrice: order.payPrice,
      paymentChannelCode: order.paymentChannelCode,
      message: payment.message,
    }

    if (redirectTarget) {
      const anchor = document.createElement('a')
      anchor.href = redirectTarget
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.click()

      await router.push({
        path: '/order/query',
        query: { orderNo: order.orderNo },
      })
      return
    }

    message.success('订单已创建，请在新窗口完成支付')
  } catch (error) {
    turnstileToken.value = ''
    message.error(error instanceof Error ? error.message : '订单创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadPage)
</script>

<template>
  <section class="detail-page">
    <div v-if="loading" class="detail-page__loading">
      <NSpin size="large" />
    </div>
    <template v-else-if="product">
      <NCard :bordered="false" class="detail-card detail-card--hero">
        <div class="hero-layout">
          <div class="hero-layout__media">
            <img v-if="product.coverImage" :src="resolveAssetUrl(product.coverImage)" :alt="product.name"
              class="hero-layout__image" />
            <div v-else class="hero-layout__placeholder">
              {{ product.name.slice(0, 1).toUpperCase() }}
            </div>
          </div>
          <div class="hero-layout__content">
            <span class="hero-layout__eyebrow">Secure checkout</span>
            <NTag type="primary" round>{{ product.category?.name || '商品' }}</NTag>
            <h1>{{ product.name }}</h1>
            <p class="hero-layout__description">{{ product.description || '下单后即可通过邮箱接收订单结果与发货通知。' }}</p>
            <div class="hero-layout__stats">
              <div class="hero-stat">
                <span>价格</span>
                <strong>{{ formatPrice(product.price) }}</strong>
              </div>
              <div class="hero-stat">
                <span>库存</span>
                <strong>{{ product.stock }}</strong>
              </div>
              <div class="hero-stat">
                <span>交付方式</span>
                <strong>{{ deliveryLabel }}</strong>
              </div>
            </div>
            <p class="hero-layout__hint">{{ deliveryDescription }}</p>
          </div>
        </div>
      </NCard>

      <NCard :bordered="false" class="detail-card">
        <template #header>
          <div class="detail-card__header">
            <div>
              <span class="detail-card__label">Checkout</span>
              <strong>立即下单</strong>
            </div>
          </div>
        </template>

        <NForm class="checkout-form" label-placement="top">
          <div class="checkout-grid">
            <NFormItem label="邮箱">
              <NInput v-model:value="email" placeholder="请输入接收结果的邮箱" />
            </NFormItem>
            <NFormItem label="优惠码">
              <NInput v-model:value="couponCode" placeholder="没有可留空" />
            </NFormItem>
          </div>

          <NFormItem label="购买数量">
            <NInputNumber v-model:value="quantity" :min="1" :max="maxQuantity" clearable />
          </NFormItem>

          <NFormItem label="支付方式">
            <NRadioGroup v-model:value="selectedPaymentChannelCode" class="payment-channel-group">
              <div class="payment-channel-grid">
                <label v-for="item in paymentChannels" :key="item.code" class="payment-channel-card"
                  :class="{ 'payment-channel-card--active': selectedPaymentChannelCode === item.code }">
                  <NRadio :value="item.code">
                    <div class="payment-channel-card__content">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.driver }}</span>
                      <small>第三方支付将新开窗口</small>
                    </div>
                  </NRadio>
                </label>
              </div>
            </NRadioGroup>
          </NFormItem>

          <NFormItem v-if="turnstileEnabled && turnstileSiteKey" label="验证码">
            <TurnstileWidget :site-key="turnstileSiteKey" @verify="turnstileToken = $event"
              @expired="turnstileToken = ''" @error="turnstileToken = ''" />
          </NFormItem>

          <NAlert v-if="!paymentChannels.length" type="warning" :show-icon="false">
            当前还没有可用支付方式，请先在后台启用支付渠道。
          </NAlert>

          <div class="checkout-summary">
            <div class="checkout-summary__row">
              <span>商品单价</span>
              <strong>{{ formatPrice(product.price) }}</strong>
            </div>
            <div class="checkout-summary__row">
              <span>购买数量</span>
              <strong>{{ quantity }}</strong>
            </div>
            <div class="checkout-summary__row checkout-summary__row--total">
              <span>预计金额</span>
              <strong>{{ formatPrice(Number(product.price) * quantity) }}</strong>
            </div>
          </div>

          <div class="detail-card__actions">
            <NButton type="primary" round size="large" :loading="submitting" :disabled="!paymentChannels.length"
              @click="submitOrder">
              创建订单并前往支付
            </NButton>
          </div>
        </NForm>
      </NCard>

      <NCard v-if="productIntroduction" :bordered="false" class="detail-card">
        <template #header>
          <div class="detail-card__header">
            <div>
              <span class="detail-card__label">Introduction</span>
              <strong>商品介绍</strong>
            </div>
          </div>
        </template>
        <div class="detail-card__rich-text" v-html="productIntroduction"></div>
      </NCard>

      <NCard v-if="latestOrder" :bordered="false" class="detail-card">
        <template #header>
          <div class="detail-card__header">
            <div>
              <span class="detail-card__label">Order created</span>
              <strong>订单已创建</strong>
            </div>
            <p>请保存订单号和查询密码，后续可继续跟踪发货状态。</p>
          </div>
        </template>

        <div class="order-result-grid">
          <div class="order-result-item">
            <span>订单号</span>
            <strong>{{ latestOrder.orderNo }}</strong>
          </div>
          <div class="order-result-item">
            <span>查询密码</span>
            <strong>{{ latestOrder.queryPassword }}</strong>
          </div>
          <div class="order-result-item">
            <span>支付方式</span>
            <strong>{{ latestOrder.paymentChannelCode || '-' }}</strong>
          </div>
          <div class="order-result-item">
            <span>应付金额</span>
            <strong>{{ formatPrice(latestOrder.payPrice) }}</strong>
          </div>
        </div>

        <NAlert type="info" :show-icon="false" class="order-result-alert">
          {{ latestOrder.message || '支付能力待接入。' }}
        </NAlert>
      </NCard>
    </template>
  </section>
</template>

<style scoped>
.detail-page {
  display: grid;
  gap: 24px;
}

.detail-page__loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.detail-card {
  border-radius: 24px;
}

.hero-layout {
  display: grid;
  gap: 24px;
}

.hero-layout__media {
  display: flex;
  justify-content: center;
}

.hero-layout__image,
.hero-layout__placeholder {
  width: min(100%, 320px);
  aspect-ratio: 1;
  border-radius: 24px;
  object-fit: cover;
  background: #f3f4f6;
}

.hero-layout__placeholder {
  display: grid;
  place-items: center;
  font-size: 64px;
  font-weight: 700;
  color: #111827;
}

.hero-layout__content {
  display: grid;
  gap: 12px;
}

.hero-layout__eyebrow,
.detail-card__label {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b7280;
}

.hero-layout__description,
.hero-layout__hint,
.detail-card__header p {
  margin: 0;
  color: #4b5563;
}

.hero-layout__stats,
.order-result-grid {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.hero-stat,
.order-result-item,
.checkout-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.checkout-form,
.detail-card__header,
.payment-channel-grid,
.payment-channel-card__content,
.checkout-summary {
  display: grid;
  gap: 16px;
}

.checkout-grid {
  display: grid;
  gap: 16px;
}

.payment-channel-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
}

.payment-channel-card--active {
  border-color: #18a058;
  background: #f0fdf4;
}

.payment-channel-card__content span,
.payment-channel-card__content small {
  color: #6b7280;
}

.checkout-summary {
  padding: 16px;
  border-radius: 18px;
  background: #f9fafb;
}

.checkout-summary__row--total {
  font-weight: 700;
}

.detail-card__actions {
  display: flex;
  justify-content: flex-end;
}

.detail-card__rich-text :deep(p) {
  margin: 0 0 12px;
}

.order-result-alert {
  margin-top: 16px;
}

@media (min-width: 960px) {
  .hero-layout {
    grid-template-columns: 320px minmax(0, 1fr);
    align-items: center;
  }

  .hero-layout__stats,
  .order-result-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .checkout-grid,
  .payment-channel-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
</style>
