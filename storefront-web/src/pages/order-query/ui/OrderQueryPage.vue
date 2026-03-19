<script setup lang="ts">
import { queryOrder } from '@/entities/order/api/order'
import { createPayment } from '@/entities/order/api/payment-create'
import type { OrderQueryResult } from '@/entities/order/model/types'
import { fetchSiteBootstrap } from '@/entities/site/api/site'
import TurnstileWidget from '@/shared/components/TurnstileWidget.vue'
import { formatDateTime, formatPrice } from '@/shared/utils/format'
import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NFormItem,
  NInput,
  NTag,
  useMessage,
} from 'naive-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const message = useMessage()
const route = useRoute()
const router = useRouter()
const orderNo = ref('')
const queryPassword = ref('')
const turnstileEnabled = ref(false)
const turnstileSiteKey = ref('')
const turnstileToken = ref('')
const loading = ref(false)
const paying = ref(false)
const result = ref<OrderQueryResult | null>(null)

const hasAutoQueryCredentials = computed(() => !!orderNo.value.trim() && !!queryPassword.value.trim())
const isPaymentReturn = computed(
  () => typeof route.query.channelCode === 'string' && route.query.channelCode.trim().length > 0,
)
const shouldWaitForTurnstile = computed(
  () => turnstileEnabled.value && isPaymentReturn.value && !turnstileToken.value.trim(),
)
const returnChannelCode = computed(() =>
  typeof route.query.channelCode === 'string' ? route.query.channelCode : '',
)
const isCouponOffset = computed(() => {
  if (!result.value) {
    return false
  }

  return Number(result.value.payPrice) <= 0 && !result.value.paymentRecords?.length
})
const canRepay = computed(() => {
  if (!result.value) {
    return false
  }

  return result.value.status === 'PENDING' && Number(result.value.payPrice) > 0
})
const paymentMethodLabel = computed(() => {
  if (!result.value) {
    return '-'
  }

  return (
    result.value.paymentChannelCode
    || result.value.paymentRecords?.[0]?.paymentChannel?.name
    || (isCouponOffset.value ? '优惠券抵扣' : '')
    || '-'
  )
})
const deliveryItems = computed(() => {
  if (!result.value) {
    return []
  }

  if (result.value.deliveryRecords?.length) {
    return result.value.deliveryRecords.map((item) => ({
      id: item.id,
      deliveryType: item.deliveryType || '',
      createdAt: item.createdAt || null,
      content: item.content,
    }))
  }

  return result.value.orderCards?.map((item) => ({
    id: item.id,
    deliveryType: 'AUTO_CARD',
    createdAt: null,
    content: item.cardSnapshot,
  })) ?? []
})
const sortedMailLogs = computed(() => {
  const items = result.value?.mailLogs ?? []

  return [...items].sort((a, b) => {
    const aTime = new Date(a.sentAt || a.createdAt || 0).getTime()
    const bTime = new Date(b.sentAt || b.createdAt || 0).getTime()
    return bTime - aTime
  })
})

async function tryAutoQuery() {
  if (!hasAutoQueryCredentials.value || loading.value || result.value) {
    return
  }

  if (shouldWaitForTurnstile.value) {
    return
  }

  await handleQuery()
}

function renderOrderStatus(status: string) {
  const dict: Record<string, string> = {
    PENDING: '待支付',
    PAID: '已支付',
    DELIVERED: '已发货',
    FAILED: '失败',
    CLOSED: '已关闭',
    REFUNDED: '已退款',
  }

  return dict[status] || status
}

function renderMailStatus(status?: string) {
  const dict: Record<string, string> = {
    PENDING: '待发送',
    SUCCESS: '已发送',
    FAILED: '发送失败',
  }

  return status ? (dict[status] || status) : '-'
}

function renderMailEvent(eventCode?: string) {
  const dict: Record<string, string> = {
    ORDER_PAID: '支付成功通知',
    ORDER_DELIVERED: '发货通知',
    ORDER_RESEND: '补发通知',
  }

  return eventCode ? (dict[eventCode] || eventCode) : '-'
}

function renderDeliveryType(deliveryType?: string) {
  const dict: Record<string, string> = {
    MANUAL: '人工发货',
    AUTO_CARD: '自动发货',
    SUPPLEMENT: '补发内容',
  }

  return deliveryType ? (dict[deliveryType] || deliveryType) : '-'
}

async function handleQuery() {
  if (!orderNo.value.trim() || !queryPassword.value.trim()) {
    message.warning('请输入订单号和查询密码')
    return
  }

  if (turnstileEnabled.value && !turnstileToken.value.trim()) {
    message.warning('请先完成验证码校验')
    return
  }

  loading.value = true

  try {
    result.value = await queryOrder(orderNo.value.trim(), {
      queryPassword: queryPassword.value.trim(),
      cfTurnstileToken: turnstileEnabled.value ? turnstileToken.value.trim() : undefined,
    })
  } catch (error) {
    turnstileToken.value = ''
    message.error(error instanceof Error ? error.message : '查询失败')
  } finally {
    loading.value = false
  }
}

async function handlePay() {
  if (!result.value || !canRepay.value) {
    return
  }

  paying.value = true

  try {
    const payment = await createPayment(result.value.orderNo)
    const redirectTarget = payment.paymentUrl || payment.redirectUrl || payment.gatewayUrl || null

    if (!redirectTarget) {
      throw new Error(payment.message || '支付地址生成失败')
    }

    const anchor = document.createElement('a')
    anchor.href = redirectTarget
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.click()

    await router.replace({
      path: '/order/query',
      query: {
        orderNo: result.value.orderNo,
      },
    })
  } catch (error) {
    message.error(error instanceof Error ? error.message : '拉起支付失败')
  } finally {
    paying.value = false
  }
}

onMounted(async () => {
  try {
    const siteData = await fetchSiteBootstrap()
    turnstileEnabled.value = !!siteData.cloudflareTurnstileEnabled
    turnstileSiteKey.value = siteData.cloudflareTurnstileSiteKey || ''
  } catch {
    turnstileEnabled.value = false
    turnstileSiteKey.value = ''
  }

  const orderNoFromRoute = typeof route.query.orderNo === 'string' ? route.query.orderNo : ''
  if (!orderNoFromRoute) {
    return
  }

  orderNo.value = orderNoFromRoute

  if (typeof window === 'undefined') {
    return
  }

  const cached = window.sessionStorage.getItem(`order-query:${orderNoFromRoute}`)
  if (!cached) {
    return
  }

  try {
    const parsed = JSON.parse(cached) as { queryPassword?: string }
    if (parsed.queryPassword) {
      queryPassword.value = parsed.queryPassword
      await tryAutoQuery()
    }
  } catch {
    // ignore malformed local cache
  }
})

watch(turnstileToken, async (value, previousValue) => {
  if (value === previousValue || !value.trim()) {
    return
  }

  if (!isPaymentReturn.value) {
    return
  }

  await tryAutoQuery()
})
</script>

<template>
  <section class="order-query-page stack-lg">
    <section class="query-hero">
      <div class="query-hero__copy">
        <span class="query-hero__eyebrow">{{ isPaymentReturn ? 'Payment Success' : 'Order Tracking' }}</span>
        <h1>{{ isPaymentReturn ? '支付已完成' : '查询订单' }}</h1>
        <p>
          {{ isPaymentReturn
            ? '支付平台已返回本站，你现在可以直接查看本次购买详情、支付流水和发货记录。'
            : '输入订单号和查询密码，快速查看支付状态、购买信息和发货结果。' }}
        </p>
      </div>
      <div class="query-hero__tips">
        <article class="query-tip-card">
          <strong>1</strong>
          <span>{{ isPaymentReturn ? '已带回订单号' : '输入订单号' }}</span>
        </article>
        <article class="query-tip-card">
          <strong>2</strong>
          <span>{{ isPaymentReturn ? '查询密码可自动回填' : '填写查询密码' }}</span>
        </article>
        <article class="query-tip-card">
          <strong>3</strong>
          <span>{{ isPaymentReturn ? '查看支付与发货详情' : '查看订单详情' }}</span>
        </article>
      </div>
    </section>

    <NCard v-if="isPaymentReturn" class="query-card payment-return-card" :bordered="false">
      <div class="payment-return-card__content">
        <div class="payment-return-card__icon">OK</div>
        <div class="payment-return-card__copy">
          <span class="detail-card__label">Payment Return</span>
          <strong>支付成功，订单已回到本站</strong>
          <p>
            订单号：{{ orderNo || '-' }}
            <span v-if="returnChannelCode">，支付渠道：{{ returnChannelCode }}</span>
          </p>
          <p>
            {{ result
              ? '订单详情已展示在下方。'
              : turnstileEnabled
                ? '如已启用验证码，请先完成验证后自动查询订单详情。'
                : '系统正在自动尝试查询你的订单详情。' }}
          </p>
        </div>
      </div>
    </NCard>

    <NCard class="query-card" :bordered="false">
      <div class="query-card__header">
        <span class="detail-card__label">Lookup</span>
        <h2>订单查询</h2>
        <p>如果浏览器保存过最近一次的查询密码，会自动帮你回填。</p>
      </div>
      <div class="query-form-grid">
        <div class="field-block">
          <label>订单号</label>
          <NInput v-model:value="orderNo" placeholder="请输入订单号" />
        </div>
        <div class="field-block">
          <label>查询密码</label>
          <NInput v-model:value="queryPassword" type="password" show-password-on="click" placeholder="请输入查询密码" />
        </div>
      </div>
      <NFormItem v-if="turnstileEnabled && turnstileSiteKey" class="turnstile-form-item" label="验证码">
        <TurnstileWidget :site-key="turnstileSiteKey" @verify="turnstileToken = $event" @expired="turnstileToken = ''"
          @error="turnstileToken = ''" />
      </NFormItem>
      <div class="query-card__actions">
        <NButton type="primary" round :loading="loading" @click="handleQuery">查询</NButton>
      </div>
    </NCard>

    <NCard v-if="result" class="query-card" :bordered="false">
      <div class="query-card__header">
        <span class="detail-card__label">Result</span>
        <h2>购买详情</h2>
        <p>这里会显示订单号、查询密码、支付方式、应付金额和后台发货记录。</p>
      </div>

      <div class="order-result-grid">
        <div class="order-result-item">
          <span>订单号</span>
          <strong>{{ result.orderNo }}</strong>
        </div>
        <div class="order-result-item">
          <span>查询密码</span>
          <strong>{{ queryPassword }}</strong>
        </div>
        <div class="order-result-item">
          <span>支付方式</span>
          <strong>{{ paymentMethodLabel }}</strong>
        </div>
        <div class="order-result-item">
          <span>应付金额</span>
          <strong>{{ formatPrice(result.payPrice) }}</strong>
        </div>
      </div>

      <div class="query-result-details">
        <NDescriptions bordered :column="1" label-placement="left">
          <NDescriptionsItem label="订单状态">
            <div class="order-status-row">
              <NTag type="info">{{ renderOrderStatus(result.status) }}</NTag>
              <NButton v-if="canRepay" type="primary" size="small" round :loading="paying" @click="handlePay">
                立即支付
              </NButton>
            </div>
          </NDescriptionsItem>
          <NDescriptionsItem label="商品">{{ result.product?.name || result.orderName || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="邮箱">{{ result.email }}</NDescriptionsItem>
          <NDescriptionsItem label="创建时间">{{ formatDateTime(result.createdAt) }}</NDescriptionsItem>
          <NDescriptionsItem label="发货时间">{{ formatDateTime(result.deliveredAt) }}</NDescriptionsItem>
          <NDescriptionsItem label="支付流水">
            <div class="query-record-list">
              <div v-for="item in result.paymentRecords?.length ? result.paymentRecords : [{ id: 'empty' }]"
                :key="item.id" class="query-record-item">
                <template v-if="result.paymentRecords?.length">
                  <strong>{{ item.paymentChannel?.name || paymentMethodLabel || '支付记录' }}</strong>
                  <span>交易号：{{ item.thirdTradeNo || '-' }}</span>
                  <span>支付时间：{{ formatDateTime(item.paidAt) }}</span>
                </template>
                <template v-else>
                  <strong>{{ isCouponOffset ? '优惠券抵扣' : '暂无支付流水' }}</strong>
                  <span>
                    {{ isCouponOffset
                      ? `本次订单已由优惠直接抵扣，应付金额为 ${formatPrice(result.payPrice)}。`
                      : '订单可能尚未支付，或本次订单还没有生成第三方支付流水。' }}
                  </span>
                </template>
              </div>
            </div>
          </NDescriptionsItem>
          <NDescriptionsItem label="发货记录">
            <div class="query-record-list">
              <div
                v-for="item in deliveryItems.length ? deliveryItems : [{ id: 'empty-delivery', deliveryType: '', createdAt: null, content: '' }]"
                :key="item.id" class="query-record-item">
                <template v-if="deliveryItems.length">
                  <strong>{{ renderDeliveryType(item.deliveryType) }}</strong>
                  <span>发货时间：{{ formatDateTime(item.createdAt) }}</span>
                  <div class="query-card__result-box">{{ item.content }}</div>
                </template>
                <template v-else>
                  <strong>暂无发货结果</strong>
                  <span>订单还没有生成发货记录。</span>
                </template>
              </div>
            </div>
          </NDescriptionsItem>
          <NDescriptionsItem label="邮件记录">
            <div class="query-mail-timeline">
              <div v-for="item in sortedMailLogs.length ? sortedMailLogs : [{ id: 'empty-mail' }]" :key="item.id"
                class="query-mail-timeline__item">
                <template v-if="sortedMailLogs.length">
                  <div class="query-mail-timeline__dot"></div>
                  <div class="query-mail-timeline__content">
                    <strong>{{ renderMailEvent(item.eventCode) }}</strong>
                    <span>状态：{{ renderMailStatus(item.sendStatus) }}</span>
                    <span>时间：{{ formatDateTime(item.sentAt || item.createdAt) }}</span>
                  </div>
                </template>
                <template v-else>
                  <div class="query-mail-timeline__dot"></div>
                  <div class="query-mail-timeline__content">
                    <strong>暂无邮件记录</strong>
                    <span>后台还没有对应的邮件发送日志。</span>
                  </div>
                </template>
              </div>
            </div>
          </NDescriptionsItem>
        </NDescriptions>
      </div>
    </NCard>
  </section>
</template>

<style scoped>
.order-status-row {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
