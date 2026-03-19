<script setup lang="ts">
import {
  BagAddOutline,
  CheckmarkDoneOutline,
  EyeOutline,
} from '@vicons/ionicons5'
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NTable,
  NTag,
} from 'naive-ui'
import { computed, ref } from 'vue'
import { deliveryTypeMap, mapLabel, orderStatusMap, productTypeMap } from '../../utils/dicts'
import { formatDateTime } from '../../utils/format'

const text = {
  toolPanel: '订单工具区',
  toolTag: '测试与排查',
  createTestOrder: '创建测试订单',
  product: '商品',
  email: '邮箱',
  quantity: '购买数量',
  couponCode: '优惠券',
  paymentChannelCode: '支付通道',
  createOrder: '创建订单',
  mockNotify: '模拟支付回调',
  orderNo: '订单号',
  channelCode: '通道代码',
  thirdTradeNo: '第三方订单号',
  runNotify: '执行回调',
  notifyHint: '用于模拟第三方支付异步回调，通道代码必须和支付渠道 code 一致。',
  queryTest: '后台查询订单',
  queryOrder: '查询订单',
  queryHint: '后台查询订单不需要填写查询密码，只需要输入订单号。',
  orderResult: '新建订单结果',
  queryResult: '订单查询结果',
  status: '状态',
  amount: '支付金额',
  createdAt: '创建时间',
  productType: '商品类型',
  deliveryType: '发货方式',
  queryPassword: '查询密码',
  cards: '发货内容',
  deliveryRecordType: '发货类型',
  deliveryTime: '发货时间',
  noCards: '暂无发货内容',
}

const props = defineProps<{
  loading: boolean
  productOptions: Array<{ label: string; value: string }>
  paymentChannelOptions: Array<{ label: string; value: string }>
  lastOrder: Record<string, unknown> | null
  queriedOrder: Record<string, unknown> | null
}>()

const orderForm = defineModel<{
  productId: string
  email: string
  quantity: number
  couponCode: string
  paymentChannelCode: string
}>('orderForm', { required: true })
const notifyForm = defineModel<{
  orderNo: string
  channelCode: string
  thirdTradeNo: string
}>('notifyForm', { required: true })
const orderQueryForm = defineModel<{ orderNo: string }>('orderQueryForm', { required: true })
const emit = defineEmits<{ createOrder: []; sendNotify: []; queryOrder: [] }>()

const toolPanels = ref([])

const createdOrder = computed(() => (props.lastOrder ?? {}) as Record<string, any>)
const queriedOrderData = computed(() => (props.queriedOrder ?? {}) as Record<string, any>)
const queriedDeliveryRecords = computed(() =>
  Array.isArray(queriedOrderData.value.deliveryRecords) ? queriedOrderData.value.deliveryRecords : [],
)

const deliveryRecordTypeMap: Record<string, string> = {
  AUTO_CARD: '自动发货',
  MANUAL: '手动发货',
  SUPPLEMENT: '补发内容',
}

function renderOrderStatus(value?: string) {
  return mapLabel(value, orderStatusMap)
}

function renderProductType(value?: string) {
  return mapLabel(value, productTypeMap)
}

function renderDeliveryType(value?: string) {
  return mapLabel(value, deliveryTypeMap)
}

function renderDeliveryRecordType(value?: string) {
  return deliveryRecordTypeMap[value ?? ''] ?? value ?? '-'
}
</script>

<template>
  <NCard class="panel-card" :bordered="false">
    <template #header>
      <div class="section-header">
        <h3>{{ text.toolPanel }}</h3>
        <NTag size="small" type="default">{{ text.toolTag }}</NTag>
      </div>
    </template>

    <NCollapse v-model:expanded-names="toolPanels" accordion>
      <NCollapseItem name="create-order">
        <template #header>
          <NSpace align="center" :wrap="false">
            <BagAddOutline />
            <span>{{ text.createTestOrder }}</span>
          </NSpace>
        </template>

        <div class="three-up-grid">
          <div class="field-block">
            <label>{{ text.product }}</label>
            <NSelect v-model:value="orderForm.productId" :options="productOptions" />
          </div>
          <div class="field-block">
            <label>{{ text.paymentChannelCode }}</label>
            <NSelect v-model:value="orderForm.paymentChannelCode" :options="paymentChannelOptions" />
          </div>
        </div>

        <div class="order-inline-fields">
          <div class="field-block order-inline-field">
            <label>{{ text.email }}</label>
            <NInput v-model:value="orderForm.email" />
          </div>
          <div class="field-block order-inline-field">
            <label>{{ text.quantity }}</label>
            <NInputNumber v-model:value="orderForm.quantity" :show-button="false" />
          </div>
          <div class="field-block order-inline-field">
            <label>{{ text.couponCode }}</label>
            <NInput v-model:value="orderForm.couponCode" />
          </div>
        </div>

        <NSpace>
          <NButton type="primary" :loading="loading" @click="emit('createOrder')">
            <template #icon>
              <BagAddOutline />
            </template>
            {{ text.createOrder }}
          </NButton>
        </NSpace>

        <NCard v-if="lastOrder" size="small" :bordered="false" class="stack section-card">
          <template #header>{{ text.orderResult }}</template>
          <NDescriptions :column="2" bordered label-placement="left">
            <NDescriptionsItem :label="text.orderNo">{{ createdOrder.orderNo ?? '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.email">{{ createdOrder.email ?? '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.status">{{ renderOrderStatus(createdOrder.status) }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.amount">{{ createdOrder.payPrice ?? '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.quantity">{{ createdOrder.quantity ?? '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.queryPassword">{{ createdOrder.queryPassword ?? '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.createdAt">{{ formatDateTime(createdOrder.createdAt) }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.product">{{ createdOrder.product?.name ?? createdOrder.orderName ?? '-' }}</NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NCollapseItem>

      <NCollapseItem name="notify-order">
        <template #header>
          <NSpace align="center" :wrap="false">
            <CheckmarkDoneOutline />
            <span>{{ text.mockNotify }}</span>
          </NSpace>
        </template>
        <p class="muted small">{{ text.notifyHint }}</p>
        <div class="three-up-grid">
          <div class="field-block">
            <label>{{ text.orderNo }}</label>
            <NInput v-model:value="notifyForm.orderNo" />
          </div>
          <div class="field-block">
            <label>{{ text.channelCode }}</label>
            <NSelect v-model:value="notifyForm.channelCode" :options="paymentChannelOptions" />
          </div>
          <div class="field-block">
            <label>{{ text.thirdTradeNo }}</label>
            <NInput v-model:value="notifyForm.thirdTradeNo" />
          </div>
        </div>
        <NButton type="primary" :loading="loading" @click="emit('sendNotify')">
          <template #icon>
            <CheckmarkDoneOutline />
          </template>
          {{ text.runNotify }}
        </NButton>
      </NCollapseItem>

      <NCollapseItem name="query-order">
        <template #header>
          <NSpace align="center" :wrap="false">
            <EyeOutline />
            <span>{{ text.queryTest }}</span>
          </NSpace>
        </template>
        <p class="muted small">{{ text.queryHint }}</p>
        <div class="three-up-grid">
          <div class="field-block">
            <label>{{ text.orderNo }}</label>
            <NInput v-model:value="orderQueryForm.orderNo" />
          </div>
        </div>
        <NButton tertiary :loading="loading" @click="emit('queryOrder')">
          <template #icon>
            <EyeOutline />
          </template>
          {{ text.queryOrder }}
        </NButton>

        <NCard v-if="queriedOrder" size="small" :bordered="false" class="stack section-card">
          <template #header>{{ text.queryResult }}</template>
          <NDescriptions :column="2" bordered label-placement="left">
            <NDescriptionsItem :label="text.orderNo">{{ queriedOrderData.orderNo ?? '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.email">{{ queriedOrderData.email ?? '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.status">{{ renderOrderStatus(queriedOrderData.status) }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.amount">{{ queriedOrderData.payPrice ?? '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.product">{{ queriedOrderData.product?.name ?? queriedOrderData.orderName ?? '-' }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.productType">{{ renderProductType(queriedOrderData.product?.type || queriedOrderData.orderType) }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.deliveryType">{{ renderDeliveryType(queriedOrderData.product?.deliveryType) }}</NDescriptionsItem>
            <NDescriptionsItem :label="text.createdAt">{{ formatDateTime(queriedOrderData.createdAt) }}</NDescriptionsItem>
          </NDescriptions>

          <div class="stack">
            <h4>{{ text.cards }}</h4>
            <NTable v-if="queriedDeliveryRecords.length" striped>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ text.deliveryRecordType }}</th>
                  <th>{{ text.cards }}</th>
                  <th>{{ text.deliveryTime }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in queriedDeliveryRecords" :key="item.id ?? index">
                  <td>{{ index + 1 }}</td>
                  <td>
                    <NTag size="small" :type="item.deliveryType === 'SUPPLEMENT' ? 'warning' : 'info'">
                      {{ renderDeliveryRecordType(item.deliveryType) }}
                    </NTag>
                  </td>
                  <td class="mono-cell">{{ item.content ?? '-' }}</td>
                  <td>{{ formatDateTime(item.createdAt) }}</td>
                </tr>
              </tbody>
            </NTable>
            <NEmpty v-else :description="text.noCards" class="empty-block" />
          </div>
        </NCard>
      </NCollapseItem>
    </NCollapse>
  </NCard>
</template>
