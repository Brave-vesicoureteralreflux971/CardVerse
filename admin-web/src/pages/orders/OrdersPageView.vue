<script setup lang="ts">
import {
  FilterOutline,
  MailOutline,
  ReceiptOutline,
  RefreshOutline,
  SendOutline,
  TrashOutline,
} from '@vicons/ionicons5'
import {
  NButton,
  NCard,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTable,
  NTag,
} from 'naive-ui'
import { computed, ref } from 'vue'
import TablePager from '../../components/TablePager.vue'
import ConfirmActionButton from '../../components/common/ConfirmActionButton.vue'
import type { Order, OrderDeliveryRecord, PaymentChannel, Product } from '../../types'
import {
  deliveryTypeMap,
  mailEventCodeMap,
  mailSendStatusMap,
  mapCodeLabel,
  mapLabel,
  orderStatusMap,
  paymentRecordStatusMap,
  productTypeMap,
} from '../../utils/dicts'
import { formatDateTime } from '../../utils/format'
import OrderToolsPanel from './OrderToolsPanel.vue'

const text = {
  all: '全部',
  orderNo: '订单号',
  product: '商品',
  email: '邮箱',
  status: '状态',
  paymentChannel: '支付通道',
  payPrice: '支付金额',
  totalPrice: '订单总价',
  couponDiscountAmount: '优惠券抵扣',
  wholesaleDiscountAmount: '批发优惠',
  thirdPartyPaidAmount: '第三方支付金额',
  cards: '发货内容',
  deliveryRecordType: '发货类型',
  deliveryTime: '发货时间',
  actions: '操作',
  detail: '详情',
  resendMail: '补发邮件',
  batchResendMail: '批量补发邮件',
  detailTitle: '订单详情',
  orderList: '订单列表',
  filter: '查询',
  exportCsv: '导出 CSV',
  batchDelete: '批量删除',
  deleteConfirm: '确认删除已选订单吗？删除后会回滚库存、卡密和订单相关记录。',
  keyword: '关键字',
  orderNameHint: '订单号 / 订单名称',
  localSearch: '搜索订单 / 邮箱 / 商品 / 发货内容',
  noOrders: '暂无订单数据',
  selectCurrentPage: '全选当前页',
  selectedPrefix: '已选 ',
  selectedSuffix: ' 条',
  clearSelection: '清空勾选',
  orderInfo: '订单信息',
  productInfo: '商品信息',
  cardInfo: '发货内容',
  paymentInfo: '支付记录',
  mailInfo: '邮件记录',
  orderName: '订单名称',
  queryPassword: '查询密码',
  createdAt: '创建时间',
  updatedAt: '更新时间',
  quantity: '购买数量',
  productType: '商品类型',
  deliveryType: '发货方式',
  paymentStatus: '支付状态',
  paidAt: '支付时间',
  thirdTradeNo: '第三方订单号',
  amount: '金额',
  noPayment: '暂无支付记录',
  mailEvent: '事件码',
  mailStatus: '发送状态',
  sentAt: '发送时间',
  noMail: '暂无邮件记录',
  noCardsDelivered: '暂无发货内容',
  manualDeliver: '手动发货',
  recordDelivery: '补录发货内容',
  retry: '重试',
  productOnline: '上架',
  productOffline: '下架',
}

const props = defineProps<{
  loading: boolean
  products: Product[]
  paymentChannels: PaymentChannel[]
  orders: Order[]
  lastOrder: Record<string, unknown> | null
  queriedOrder: Record<string, unknown> | null
  orderDetail: Record<string, unknown> | null
  selectedOrderIds: string[]
  manualDeliverVisible: boolean
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

const orderQueryForm = defineModel<{ orderNo: string }>('orderQueryForm', {
  required: true,
})
const orderFilter = defineModel<{
  keyword: string
  email: string
  status: string
  productId: string
  paymentChannelCode: string
}>('orderFilter', { required: true })

const manualDeliverContent = defineModel<string>('manualDeliverContent', {
  required: true,
})

const emit = defineEmits<{
  createOrder: []
  sendNotify: []
  queryOrder: []
  resendEmail: [id: string]
  batchResendEmails: []
  openManualDeliver: [id: string]
  manualDeliver: []
  closeManualDeliver: []
  retryMail: [logId: string, orderId?: string]
  filterOrders: []
  exportOrders: []
  deleteSelectedOrders: []
  toggleSelect: [id: string, checked: boolean]
  toggleSelectAll: [checked: boolean, ids: string[]]
  clearSelection: []
  viewDetail: [id: string]
  closeDetail: []
}>()

const localKeyword = ref('')
const page = ref(1)
const pageSize = ref(20)

const productOptions = computed(() =>
  props.products.map((item) => ({ label: item.name, value: item.id })),
)
const paymentChannelOptions = computed(() =>
  props.paymentChannels
    .filter((item) => item.status)
    .map((item) => ({ label: `${item.name} (${item.code})`, value: item.code })),
)
const statusOptions = [
  { label: text.all, value: '' },
  { label: mapLabel('PENDING', orderStatusMap), value: 'PENDING' },
  { label: mapLabel('PAID', orderStatusMap), value: 'PAID' },
  { label: mapLabel('DELIVERED', orderStatusMap), value: 'DELIVERED' },
  { label: mapLabel('FAILED', orderStatusMap), value: 'FAILED' },
  { label: mapLabel('CLOSED', orderStatusMap), value: 'CLOSED' },
  { label: mapLabel('REFUNDED', orderStatusMap), value: 'REFUNDED' },
]

const filteredOrders = computed(() =>
  props.orders.filter((item) => {
    if (!localKeyword.value) {
      return true
    }
    const keyword = localKeyword.value.toLowerCase()
    return [
      item.orderNo,
      item.product?.name ?? item.orderName ?? '',
      item.email,
      item.status,
      item.paymentChannelCode ?? '',
      item.orderCards?.map((row) => row.cardSnapshot).join(' ') ?? '',
      item.deliveryRecords?.map((row: OrderDeliveryRecord) => row.content).join(' ') ?? '',
      item.product?.content ?? '',
    ].some((value) => value.toLowerCase().includes(keyword))
  }),
)

const pagedOrders = computed(() =>
  filteredOrders.value.slice(
    (page.value - 1) * pageSize.value,
    page.value * pageSize.value,
  ),
)
const allSelected = computed(
  () =>
    pagedOrders.value.length > 0 &&
    pagedOrders.value.every((item) => props.selectedOrderIds.includes(item.id)),
)
const selectedOrders = computed(() =>
  props.orders.filter((item) => props.selectedOrderIds.includes(item.id)),
)

const detail = computed(() => (props.orderDetail ?? {}) as Record<string, any>)
const detailProduct = computed(() => (detail.value.product ?? {}) as Record<string, any>)
const detailCards = computed(() =>
  Array.isArray(detail.value.orderCards) ? detail.value.orderCards : [],
)
const detailDeliveryRecords = computed(
  () =>
    (Array.isArray(detail.value.deliveryRecords)
      ? detail.value.deliveryRecords
      : []) as OrderDeliveryRecord[],
)
const detailManualContent = computed(() =>
  String(detail.value.manualDeliveryContent ?? detailProduct.value.content ?? '').trim(),
)
const detailPayments = computed(() =>
  Array.isArray(detail.value.paymentRecords) ? detail.value.paymentRecords : [],
)
const detailMails = computed(() =>
  Array.isArray(detail.value.mailLogs) ? detail.value.mailLogs : [],
)

const deliveryRecordTypeMap: Record<string, string> = {
  AUTO_CARD: '自动发货',
  MANUAL: '手动发货',
  SUPPLEMENT: '补发内容',
}

const renderOrderStatus = (value?: string) => mapLabel(value, orderStatusMap)
const renderProductType = (value?: string) => mapLabel(value, productTypeMap)
const renderDeliveryType = (value?: string) => mapLabel(value, deliveryTypeMap)
const renderPaymentStatus = (value?: string) => mapLabel(value, paymentRecordStatusMap)
const renderMailStatus = (value?: string) => mapLabel(value, mailSendStatusMap)
const renderMailEventCode = (value?: string) => mapCodeLabel(value, mailEventCodeMap)
const renderDeliveryRecordType = (value?: string) =>
  deliveryRecordTypeMap[value ?? ''] ?? value ?? '-'
const canResendEmail = (item: { status?: string }) =>
  item.status === 'PAID' || item.status === 'DELIVERED'
const canOpenManualDeliver = (item: {
  status?: string
  product?: { deliveryType?: string } | null
}) => item.status === 'DELIVERED' || (item.status === 'PAID' && item.product?.deliveryType === 'MANUAL')
const canBatchResend = computed(
  () =>
    selectedOrders.value.length > 0 &&
    selectedOrders.value.every((item) => canResendEmail(item)),
)
</script>

<template>
  <section class="stack">
    <OrderToolsPanel v-model:order-form="orderForm" v-model:notify-form="notifyForm"
      v-model:order-query-form="orderQueryForm" :loading="loading" :product-options="productOptions"
      :payment-channel-options="paymentChannelOptions" :last-order="lastOrder" :queried-order="queriedOrder"
      @create-order="emit('createOrder')" @send-notify="emit('sendNotify')" @query-order="emit('queryOrder')" />

    <NCard class="panel-card" :bordered="false">
      <template #header>
        <div class="section-header">
          <h3>{{ text.orderList }}</h3>
          <NSpace>
            <NButton tertiary :loading="loading" @click="emit('filterOrders')">
              <template #icon>
                <FilterOutline />
              </template>
              {{ text.filter }}
            </NButton>
            <NButton quaternary :disabled="loading" @click="emit('exportOrders')">
              <template #icon>
                <ReceiptOutline />
              </template>
              {{ text.exportCsv }}
            </NButton>
          </NSpace>
        </div>
      </template>

      <div class="three-up-grid">
        <div class="field-block">
          <label>{{ text.keyword }}</label>
          <NInput v-model:value="orderFilter.keyword" :placeholder="text.orderNameHint" />
        </div>
        <div class="field-block">
          <label>{{ text.email }}</label>
          <NInput v-model:value="orderFilter.email" />
        </div>
        <div class="field-block">
          <label>{{ text.status }}</label>
          <NSelect v-model:value="orderFilter.status" :options="statusOptions" />
        </div>
        <div class="field-block">
          <label>{{ text.product }}</label>
          <NSelect v-model:value="orderFilter.productId"
            :options="[{ label: text.all, value: '' }, ...productOptions]" />
        </div>
        <div class="field-block">
          <label>{{ text.paymentChannel }}</label>
          <NInput v-model:value="orderFilter.paymentChannelCode" />
        </div>
      </div>

      <div class="toolbar">
        <NInput v-model:value="localKeyword" :placeholder="text.localSearch" />
      </div>

      <div class="bulk-toolbar">
        <label class="checkbox-inline">
          <NCheckbox :checked="allSelected"
            @update:checked="emit('toggleSelectAll', $event, pagedOrders.map((item) => item.id))" />
          {{ text.selectCurrentPage }}
          <span class="muted small">
            {{ text.selectedPrefix }}{{ selectedOrderIds.length }}{{ text.selectedSuffix }}
          </span>
        </label>
        <NSpace>
          <NButton size="small" tertiary :disabled="loading || !canBatchResend" @click="emit('batchResendEmails')">
            <template #icon>
              <MailOutline />
            </template>
            {{ text.batchResendMail }}
          </NButton>
          <ConfirmActionButton :label="text.batchDelete" :message="text.deleteConfirm"
            :disabled="loading || !selectedOrderIds.length" @confirm="emit('deleteSelectedOrders')">
            <template #icon>
              <TrashOutline />
            </template>
          </ConfirmActionButton>
          <NButton size="small" quaternary :disabled="loading || !selectedOrderIds.length"
            @click="emit('clearSelection')">
            <template #icon>
              <RefreshOutline />
            </template>
            {{ text.clearSelection }}
          </NButton>
        </NSpace>
      </div>

      <NEmpty v-if="!filteredOrders.length" class="empty-block" :description="text.noOrders" />
      <NTable v-else striped>
        <thead>
          <tr>
            <th></th>
            <th>{{ text.orderNo }}</th>
            <th>{{ text.product }}</th>
            <th>{{ text.email }}</th>
            <th>{{ text.status }}</th>
            <th>{{ text.payPrice }}</th>
            <th>{{ text.paymentChannel }}</th>
            <th>{{ text.actions }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedOrders" :key="item.id">
            <td>
              <NCheckbox :checked="selectedOrderIds.includes(item.id)"
                @update:checked="emit('toggleSelect', item.id, $event)" />
            </td>
            <td>{{ item.orderNo }}</td>
            <td>{{ item.product?.name ?? item.orderName ?? '-' }}</td>
            <td>{{ item.email }}</td>
            <td>
              <NTag type="info">{{ renderOrderStatus(item.status) }}</NTag>
            </td>
            <td>{{ item.payPrice }}</td>
            <td>{{ item.paymentChannelCode ?? '-' }}</td>
            <td>
              <NSpace class="row-actions" size="small">
                <NButton class="table-action-button" size="small" tertiary @click="emit('viewDetail', item.id)">
                  <template #icon>
                    <ReceiptOutline />
                  </template>
                  {{ text.detail }}
                </NButton>
                <NButton v-if="canOpenManualDeliver(item)" class="table-action-button" size="small" secondary
                  @click="emit('openManualDeliver', item.id)">
                  <template #icon>
                    <SendOutline />
                  </template>
                  {{ item.status === 'DELIVERED' ? text.recordDelivery : text.manualDeliver }}
                </NButton>
                <NButton v-if="canResendEmail(item)" class="table-action-button" size="small" quaternary
                  @click="emit('resendEmail', item.id)">
                  <template #icon>
                    <MailOutline />
                  </template>
                  {{ text.resendMail }}
                </NButton>
              </NSpace>
            </td>
          </tr>
        </tbody>
      </NTable>

      <TablePager v-model:page="page" v-model:page-size="pageSize" :total="filteredOrders.length" />
    </NCard>

    <NModal :show="manualDeliverVisible" preset="card"
      :title="detail.status === 'DELIVERED' ? text.recordDelivery : text.manualDeliver" class="detail-modal"
      @update:show="!$event && emit('closeManualDeliver')">
      <section class="stack">
        <div class="field-block">
          <label>{{ text.cards }}</label>
          <NInput v-model:value="manualDeliverContent" type="textarea" :rows="8" />
        </div>
        <NSpace justify="end">
          <NButton quaternary @click="emit('closeManualDeliver')">取消</NButton>
          <NButton type="primary" :loading="loading" @click="emit('manualDeliver')">
            <template #icon>
              <SendOutline />
            </template>
            {{ detail.status === 'DELIVERED' ? text.recordDelivery : text.manualDeliver }}
          </NButton>
        </NSpace>
      </section>
    </NModal>

    <NModal :show="Boolean(orderDetail)" preset="card" :title="text.detailTitle" class="detail-modal detail-modal-wide"
      @update:show="!$event && emit('closeDetail')">
      <section class="stack">
        <NCollapse :default-expanded-names="['order-info']" arrow-placement="right">
          <NCollapseItem name="order-info" :title="text.orderInfo">
            <NCard size="small" :bordered="false">
              <NDescriptions :column="2" bordered label-placement="left">
                <NDescriptionsItem :label="text.orderNo">{{ detail.orderNo ?? '-' }}</NDescriptionsItem>
                <NDescriptionsItem :label="text.orderName">{{ detail.orderName ?? '-' }}</NDescriptionsItem>
                <NDescriptionsItem :label="text.email">{{ detail.email ?? '-' }}</NDescriptionsItem>
                <NDescriptionsItem :label="text.queryPassword">{{ detail.queryPasswordPlain ?? '-' }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="text.status">{{ renderOrderStatus(detail.status) }}</NDescriptionsItem>
                <NDescriptionsItem :label="text.totalPrice">{{ detail.totalPrice ?? '-' }}</NDescriptionsItem>
                <NDescriptionsItem :label="text.payPrice">{{ detail.payPrice ?? '-' }}</NDescriptionsItem>
                <NDescriptionsItem :label="text.couponDiscountAmount">
                  {{ detail.couponDiscountAmount ?? '0.00' }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="text.wholesaleDiscountAmount">
                  {{ detail.wholesaleDiscountAmount ?? '0.00' }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="text.paymentChannel">
                  {{ detail.paymentChannelCode ?? '-' }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="text.quantity">{{ detail.quantity ?? '-' }}</NDescriptionsItem>
                <NDescriptionsItem :label="text.createdAt">{{ formatDateTime(detail.createdAt) }}</NDescriptionsItem>
                <NDescriptionsItem :label="text.updatedAt">{{ formatDateTime(detail.updatedAt) }}</NDescriptionsItem>
                <NDescriptionsItem :label="text.thirdTradeNo">{{ detail.thirdPartyOrderNo ?? '-' }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </NCollapseItem>

          <NCollapseItem name="card-info" :title="text.cardInfo">
            <NCard size="small" :bordered="false">
              <template #header>
                <div class="section-header">
                  <span>{{ text.cardInfo }}</span>
                  <NButton v-if="canOpenManualDeliver({ status: detail.status, product: detailProduct })" size="small"
                    type="primary" @click="emit('openManualDeliver', detail.id)">
                    <template #icon>
                      <SendOutline />
                    </template>
                    {{ detail.status === 'DELIVERED' ? text.recordDelivery : text.manualDeliver }}
                  </NButton>
                </div>
              </template>
              <NTable v-if="detailDeliveryRecords.length" striped>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{{ text.deliveryRecordType }}</th>
                    <th>{{ text.cards }}</th>
                    <th>{{ text.deliveryTime }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in detailDeliveryRecords" :key="item.id || index">
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
              <NTable v-else-if="detailCards.length" striped>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{{ text.deliveryRecordType }}</th>
                    <th>{{ text.cards }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in detailCards" :key="item.id ?? index">
                    <td>{{ index + 1 }}</td>
                    <td>
                      <NTag size="small" type="info">{{ renderDeliveryRecordType('AUTO_CARD') }}</NTag>
                    </td>
                    <td class="mono-cell">{{ item.cardSnapshot ?? item.card?.cardSecret ?? '-' }}</td>
                  </tr>
                </tbody>
              </NTable>
              <div v-else-if="detailManualContent" class="result-box">{{ detailManualContent }}</div>
              <NEmpty v-else :description="text.noCardsDelivered" class="empty-block" />
            </NCard>
          </NCollapseItem>

          <NCollapseItem name="product-info" :title="text.productInfo">
            <NCard size="small" :bordered="false">
              <NDescriptions :column="2" bordered label-placement="left">
                <NDescriptionsItem :label="text.product">{{ detailProduct.name ?? '-' }}</NDescriptionsItem>
                <NDescriptionsItem :label="text.productType">
                  {{ renderProductType(detailProduct.type || detail.orderType) }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="text.deliveryType">
                  {{ renderDeliveryType(detailProduct.deliveryType) }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="text.status">
                  {{ detailProduct.status === false ? text.productOffline : text.productOnline }}
                </NDescriptionsItem>
              </NDescriptions>
            </NCard>
          </NCollapseItem>

          <NCollapseItem name="payment-info" :title="text.paymentInfo">
            <NCard size="small" :bordered="false">
              <NEmpty v-if="!detailPayments.length" :description="text.noPayment" class="empty-block" />
              <NTable v-else striped>
                <thead>
                  <tr>
                    <th>{{ text.paymentChannel }}</th>
                    <th>{{ text.paymentStatus }}</th>
                    <th>{{ text.totalPrice }}</th>
                    <th>{{ text.couponDiscountAmount }}</th>
                    <th>{{ text.wholesaleDiscountAmount }}</th>
                    <th>{{ text.thirdPartyPaidAmount }}</th>
                    <th>{{ text.thirdTradeNo }}</th>
                    <th>{{ text.paidAt }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in detailPayments" :key="item.id ?? index">
                    <td>
                      {{
                        item.paymentChannel?.name
                          ? item.paymentChannel.name + ' (' + (item.paymentChannel.code ?? detail.paymentChannelCode ?? '-')
                          +
                          ')'
                          : (item.paymentChannel?.code ?? detail.paymentChannelCode ?? '-')
                      }}
                    </td>
                    <td>
                      <NTag type="success">{{ renderPaymentStatus(item.status) }}</NTag>
                    </td>
                    <td>{{ detail.totalPrice ?? '-' }}</td>
                    <td>{{ detail.couponDiscountAmount ?? '0.00' }}</td>
                    <td>{{ detail.wholesaleDiscountAmount ?? '0.00' }}</td>
                    <td>{{ item.amount ?? detail.payPrice ?? '-' }}</td>
                    <td>{{ item.thirdTradeNo ?? detail.thirdPartyOrderNo ?? '-' }}</td>
                    <td>{{ formatDateTime(item.paidAt ?? detail.paidAt) }}</td>
                  </tr>
                </tbody>
              </NTable>
            </NCard>
          </NCollapseItem>

          <NCollapseItem name="mail-info" :title="text.mailInfo">
            <NCard size="small" :bordered="false">
              <NEmpty v-if="!detailMails.length" :description="text.noMail" class="empty-block" />
              <NTable v-else striped>
                <thead>
                  <tr>
                    <th>{{ text.mailEvent }}</th>
                    <th>{{ text.mailStatus }}</th>
                    <th>{{ text.sentAt }}</th>
                    <th>{{ text.actions }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in detailMails" :key="item.id ?? index">
                    <td>{{ renderMailEventCode(item.eventCode) }}</td>
                    <td>
                      <NTag
                        :type="item.sendStatus === 'FAILED' ? 'error' : item.sendStatus === 'SUCCESS' ? 'success' : 'warning'">
                        {{ renderMailStatus(item.sendStatus) }}
                      </NTag>
                    </td>
                    <td>{{ formatDateTime(item.sentAt) }}</td>
                    <td>
                      <NButton v-if="item.sendStatus !== 'SUCCESS'" size="small" tertiary
                        @click="emit('retryMail', item.id, detail.id)">
                        <template #icon>
                          <MailOutline />
                        </template>
                        {{ text.retry }}
                      </NButton>
                    </td>
                  </tr>
                </tbody>
              </NTable>
            </NCard>
          </NCollapseItem>
        </NCollapse>
      </section>
    </NModal>
  </section>
</template>
