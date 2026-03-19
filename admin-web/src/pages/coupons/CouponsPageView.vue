<script setup lang="ts">
import { AddOutline, CheckmarkCircleOutline, CloseCircleOutline, CreateOutline, PricetagOutline, SearchOutline, TrashOutline, CloseOutline } from '@vicons/ionicons5'
import {
  NButton,
  NCard,
  NCheckbox,
  NDatePicker,
  NEmpty,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  NTable,
  NTag,
} from 'naive-ui'
import { computed, ref, watch } from 'vue'
import ConfirmActionButton from '../../components/common/ConfirmActionButton.vue'
import TablePager from '../../components/TablePager.vue'
import type { Coupon, Product } from '../../types'
import { couponDiscountTypeMap, mapLabel } from '../../utils/dicts'

const text = {
  createCoupon: '创建优惠券',
  editCoupon: '编辑优惠券',
  couponList: '优惠券列表',
  couponCode: '优惠码',
  discountType: '类型',
  discountValue: '优惠值',
  minAmount: '最低消费',
  productIds: '绑定商品',
  productIdsHint: '请选择绑定商品',
  useLimit: '使用次数限制',
  unlimited: '无限次',
  totalLimit: '可用次数',
  usageLimit: '使用限制',
  startAt: '开始时间',
  endAt: '结束时间',
  saveCoupon: '保存优惠券',
  createCouponAction: '创建优惠券',
  cancel: '取消',
  searchHint: '搜索优惠码 / 类型 / 商品',
  noCoupons: '暂无优惠券数据',
  value: '值',
  status: '状态',
  products: '商品',
  actions: '操作',
  edit: '编辑',
  delete: '删除',
  enabled: '启用',
  disabled: '禁用',
  selectCurrentPage: '全选当前页',
  selectedPrefix: '已选 ',
  selectedSuffix: ' 条',
  clearSelection: '清空勾选',
  batchEnable: '批量启用',
  batchDisable: '批量禁用',
  batchDelete: '批量删除',
  deleteConfirm: '确认删除这个优惠券吗？',
  batchDeleteConfirm: '确认删除已选优惠券吗？',
}

const props = defineProps<{
  loading: boolean
  editingCouponId: string
  coupons: Coupon[]
  products: Product[]
  selectedCouponIds: string[]
  saveVersion: number
}>()

const couponForm = defineModel<any>('couponForm', { required: true })

const emit = defineEmits<{
  saveCoupon: []
  editCoupon: [item: Coupon]
  toggleCoupon: [item: Coupon]
  deleteCoupon: [id: string]
  resetCoupon: []
  toggleSelect: [id: string, checked: boolean]
  toggleSelectAll: [checked: boolean, ids: string[]]
  clearSelection: []
  batchToggleCoupons: [status: boolean]
  deleteSelectedCoupons: []
}>()

const keyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const modalVisible = ref(false)

const discountOptions = [
  { label: mapLabel('FIXED', couponDiscountTypeMap), value: 'FIXED' },
  { label: mapLabel('PERCENT', couponDiscountTypeMap), value: 'PERCENT' },
]

const productOptions = computed(() => props.products.map((item) => ({ label: item.name, value: Number(item.id) })))

const filteredCoupons = computed(() =>
  props.coupons.filter((item) => {
    if (!keyword.value) return true
    const textToSearch = [item.code, item.discountType, item.couponProducts?.map((row) => row.product.name).join(',') ?? '']
      .join('|')
      .toLowerCase()
    return textToSearch.includes(keyword.value.toLowerCase())
  }),
)

const pagedCoupons = computed(() => filteredCoupons.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const allSelected = computed(() => pagedCoupons.value.length > 0 && pagedCoupons.value.every((item) => props.selectedCouponIds.includes(item.id)))

const openCreateModal = () => {
  emit('resetCoupon')
  modalVisible.value = true
}

const openEditModal = (item: Coupon) => {
  emit('editCoupon', item)
  modalVisible.value = true
}

const closeModal = () => {
  modalVisible.value = false
  emit('resetCoupon')
}

const submit = () => emit('saveCoupon')
const renderDiscountType = (value?: string) => mapLabel(value, couponDiscountTypeMap)

const renderUsageLimit = (item: Coupon) => {
  if (!item.totalLimit) return text.unlimited
  return `${item.usedCount}/${item.totalLimit}`
}

watch(() => props.saveVersion, (value, previous) => {
  if (value !== previous && value > 0) closeModal()
})
</script>

<template>
  <section class="stack">
    <NCard class="panel-card" :bordered="false">
      <template #header>
        <div class="section-header">
          <h3>{{ text.couponList }}</h3>
          <NButton type="primary" @click="openCreateModal">
            <template #icon>
              <AddOutline />
            </template>
            {{ text.createCoupon }}
          </NButton>
        </div>
      </template>

      <div class="toolbar">
        <NInput v-model:value="keyword" :placeholder="text.searchHint">
          <template #prefix>
            <SearchOutline />
          </template>
        </NInput>
      </div>

      <div class="bulk-toolbar">
        <label class="checkbox-inline">
          <NCheckbox :checked="allSelected"
            @update:checked="emit('toggleSelectAll', $event, pagedCoupons.map((item) => item.id))" />
          {{ text.selectCurrentPage }}
          <span class="muted small">{{ text.selectedPrefix }}{{ selectedCouponIds.length }}{{ text.selectedSuffix
          }}</span>
        </label>
        <NSpace>
          <NButton size="small" tertiary :disabled="loading || !selectedCouponIds.length"
            @click="emit('batchToggleCoupons', true)">
            <template #icon>
              <CheckmarkCircleOutline />
            </template>
            {{ text.batchEnable }}
          </NButton>
          <NButton size="small" tertiary type="warning" :disabled="loading || !selectedCouponIds.length"
            @click="emit('batchToggleCoupons', false)">
            <template #icon>
              <CloseCircleOutline />
            </template>
            {{ text.batchDisable }}
          </NButton>
          <ConfirmActionButton :label="text.batchDelete" :message="text.batchDeleteConfirm"
            :disabled="loading || !selectedCouponIds.length" @confirm="emit('deleteSelectedCoupons')">
            <template #icon>
              <TrashOutline />
            </template>
          </ConfirmActionButton>
          <NButton size="small" quaternary :disabled="loading || !selectedCouponIds.length"
            @click="emit('clearSelection')">
            <template #icon><CloseOutline /></template>
            {{ text.clearSelection }}</NButton>
        </NSpace>
      </div>

      <NEmpty v-if="!filteredCoupons.length" class="empty-block" :description="text.noCoupons" />
      <NTable v-else striped>
        <thead>
          <tr>
            <th></th>
            <th>{{ text.couponCode }}</th>
            <th>{{ text.discountType }}</th>
            <th>{{ text.value }}</th>
            <th>{{ text.usageLimit }}</th>
            <th>{{ text.status }}</th>
            <th>{{ text.products }}</th>
            <th>{{ text.actions }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedCoupons" :key="item.id">
            <td>
              <NCheckbox :checked="selectedCouponIds.includes(item.id)"
                @update:checked="emit('toggleSelect', item.id, $event)" />
            </td>
            <td>{{ item.code }}</td>
            <td>{{ renderDiscountType(item.discountType) }}</td>
            <td>{{ item.discountValue }}</td>
            <td>{{ renderUsageLimit(item) }}</td>
            <td>
              <NTag :type="item.status === false ? 'default' : 'success'">{{ item.status === false ? text.disabled :
                text.enabled }}</NTag>
            </td>
            <td>{{item.couponProducts?.map((row) => row.product.name).join(', ') || '-'}}</td>
            <td>
              <NSpace class="row-actions" size="small">
                <NButton class="table-action-button" size="small" tertiary @click="openEditModal(item)">
                  <template #icon>
                    <CreateOutline />
                  </template>
                  {{ text.edit }}
                </NButton>
                <NButton class="table-action-button" size="small" quaternary @click="emit('toggleCoupon', item)">
                  <template #icon><CheckmarkCircleOutline /></template>
                  {{ item.status === false ? text.enabled : text.disabled }}</NButton>
                <ConfirmActionButton :label="text.delete" :message="text.deleteConfirm"
                  @confirm="emit('deleteCoupon', item.id)" />
              </NSpace>
            </td>
          </tr>
        </tbody>
      </NTable>

      <TablePager v-model:page="page" v-model:page-size="pageSize" :total="filteredCoupons.length" />
    </NCard>

    <NModal :show="modalVisible" preset="card" :title="editingCouponId ? text.editCoupon : text.createCoupon"
      class="inline-modal-wide" @update:show="!$event && closeModal()">
      <div class="form-grid compact">
        <div class="field-block">
          <label>{{ text.couponCode }}</label>
          <NInput v-model:value="couponForm.code" />
        </div>
        <div class="field-block">
          <label>{{ text.discountType }}</label>
          <NSelect v-model:value="couponForm.discountType" :options="discountOptions" />
        </div>
        <div class="field-block">
          <label>{{ text.discountValue }}</label>
          <NInputNumber v-model:value="couponForm.discountValue" :show-button="false" />
        </div>
        <div class="field-block">
          <label>{{ text.minAmount }}</label>
          <NInputNumber v-model:value="couponForm.minAmount" :show-button="false" :min="0" />
        </div>
        <div class="field-block field-block-span-2">
          <label>{{ text.productIds }}</label>
          <NSelect v-model:value="couponForm.productIds" multiple clearable filterable :options="productOptions"
            :placeholder="text.productIdsHint" />
        </div>
        <div class="field-block">
          <label>{{ text.useLimit }}</label>
          <NSpace class="switch-row">
            <NSwitch v-model:value="couponForm.useLimit" />
            <span class="muted small">{{ couponForm.useLimit ? text.totalLimit : text.unlimited }}</span>
          </NSpace>
        </div>
        <div class="field-block">
          <label>{{ text.totalLimit }}</label>
          <NInputNumber v-model:value="couponForm.totalLimit" :show-button="false" :disabled="!couponForm.useLimit"
            :min="1" :placeholder="text.unlimited" />
        </div>
        <div class="field-block">
          <label>{{ text.startAt }}</label>
          <NDatePicker v-model:formatted-value="couponForm.startAt" type="datetime" clearable
            value-format="yyyy-MM-dd'T'HH:mm" format="yyyy-MM-dd HH:mm" />
        </div>
        <div class="field-block">
          <label>{{ text.endAt }}</label>
          <NDatePicker v-model:formatted-value="couponForm.endAt" type="datetime" clearable
            value-format="yyyy-MM-dd'T'HH:mm" format="yyyy-MM-dd HH:mm" />
        </div>
      </div>

      <NSpace justify="end">
        <NButton quaternary @click="closeModal"><template #icon><CloseOutline /></template>{{ text.cancel }}</NButton>
        <NButton type="primary" :loading="loading" @click="submit">
          <template #icon>
            <PricetagOutline />
          </template>
          {{ editingCouponId ? text.saveCoupon : text.createCouponAction }}
        </NButton>
      </NSpace>
    </NModal>
  </section>
</template>
