<script setup lang="ts">
import { AddOutline, CloudUploadOutline, CreateOutline, DownloadOutline, FunnelOutline, RefreshOutline, TrashOutline, CloseOutline, SaveOutline } from '@vicons/ionicons5'
import { NButton, NCard, NCheckbox, NEmpty, NInput, NModal, NSelect, NSpace, NTable, NTag } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import TablePager from '../../components/TablePager.vue'
import ConfirmActionButton from '../../components/common/ConfirmActionButton.vue'
import type { Card, Product } from '../../types'
import { cardStatusMap, mapLabel } from '../../utils/dicts'

const text = {
  all: '全部',
  cardList: '卡密列表',
  importCards: '导入卡密',
  applyFilter: '应用筛选',
  productFilter: '商品筛选',
  statusFilter: '状态筛选',
  searchPlaceholder: '搜索商品 / 批次 / 卡密 / 订单号',
  selectCurrentPage: '全选当前页',
  selectedPrefix: '已选 ',
  selectedSuffix: ' 条',
  batchUnused: '批量设为未售',
  batchInvalid: '批量作废',
  batchDelete: '批量删除',
  clearSelection: '清空勾选',
  exportCsv: '导出 CSV',
  noCards: '暂无卡密数据',
  product: '商品',
  batch: '批次',
  status: '状态',
  cardSecret: '卡密',
  orderNo: '订单号',
  actions: '操作',
  edit: '编辑',
  setUnused: '设为未售',
  invalidate: '作废',
  delete: '删除',
  importTitle: '导入卡密',
  editTitle: '编辑卡密',
  batchName: '批次名称',
  cardListInput: '卡密列表（每行一条）',
  duplicateTip: '支持导入重复卡密，系统不会自动去重。',
  cancel: '取消',
  save: '保存',
  deleteConfirm: '确认删除这条卡密吗？',
  batchDeleteConfirm: '确认删除已选卡密吗？',
}

const props = defineProps<{
  loading: boolean
  products: Product[]
  cards: Card[]
  selectedCardIds: string[]
  importVersion: number
  editVersion: number
}>()

const cardForm = defineModel<{ productId: string; batchName: string; remark: string; cards: string }>('cardForm', { required: true })
const cardEditForm = defineModel<{ id: string; cardSecret: string; status: string }>('cardEditForm', { required: true })
const cardFilter = defineModel<{ productId: string; status: string }>('cardFilter', { required: true })

const emit = defineEmits<{
  importCards: []
  filterCards: []
  editCard: [item: Card]
  saveCardEdit: []
  deleteCard: [id: string]
  resetCardEdit: []
  updateStatus: [id: string, status: string]
  toggleSelect: [id: string, checked: boolean]
  toggleSelectAll: [checked: boolean, ids: string[]]
  clearSelection: []
  batchUpdateStatus: [status: string]
  batchDeleteCards: []
  exportCards: []
}>()

const keyword = ref('')
const page = ref(1)
const pageSize = ref(20)
const importModalVisible = ref(false)
const editModalVisible = ref(false)

const productOptions = computed(() => props.products.map((item) => ({ label: item.name, value: item.id })))
const statusOptions = [
  { label: text.all, value: '' },
  { label: mapLabel('UNUSED', cardStatusMap), value: 'UNUSED' },
  { label: mapLabel('LOCKED', cardStatusMap), value: 'LOCKED' },
  { label: mapLabel('SOLD', cardStatusMap), value: 'SOLD' },
  { label: mapLabel('INVALID', cardStatusMap), value: 'INVALID' },
]
const editStatusOptions = statusOptions.filter((item) => item.value)
const filteredCards = computed(() => props.cards.filter((item) => !keyword.value || [item.product?.name ?? '', item.batch?.batchName ?? '', item.status, item.cardSecret, item.soldOrder?.orderNo ?? ''].some((value) => value.toLowerCase().includes(keyword.value.toLowerCase()))))
const pagedCards = computed(() => filteredCards.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const allSelected = computed(() => pagedCards.value.length > 0 && pagedCards.value.every((item) => props.selectedCardIds.includes(item.id)))

function renderCardStatus(value?: string) {
  return mapLabel(value, cardStatusMap)
}

function openImportModal() {
  importModalVisible.value = true
}

function closeImportModal() {
  importModalVisible.value = false
}

function openEditModal(item: Card) {
  emit('editCard', item)
  editModalVisible.value = true
}

function closeEditModal() {
  editModalVisible.value = false
  emit('resetCardEdit')
}

function submitImport() {
  emit('importCards')
}

function submitEdit() {
  emit('saveCardEdit')
}

watch(() => props.importVersion, (value, previous) => {
  if (value !== previous && value > 0) {
    closeImportModal()
  }
})

watch(() => props.editVersion, (value, previous) => {
  if (value !== previous && value > 0) {
    editModalVisible.value = false
  }
})
</script>

<template>
  <section class="stack">
    <NCard class="panel-card" :bordered="false">
      <template #header>
        <div class="section-header">
          <h3>{{ text.cardList }}</h3>
          <NSpace>
            <NButton type="primary" @click="openImportModal">
              <template #icon>
                <AddOutline />
              </template>
              {{ text.importCards }}
            </NButton>
            <NButton tertiary @click="emit('filterCards')">
              <template #icon>
                <FunnelOutline />
              </template>
              {{ text.applyFilter }}
            </NButton>
          </NSpace>
        </div>
      </template>

      <div class="form-grid compact">
        <div class="field-block">
          <label>{{ text.productFilter }}</label>
          <NSelect v-model:value="cardFilter.productId"
            :options="[{ label: text.all, value: '' }, ...productOptions]" />
        </div>
        <div class="field-block">
          <label>{{ text.statusFilter }}</label>
          <NSelect v-model:value="cardFilter.status" :options="statusOptions" />
        </div>
      </div>

      <div class="toolbar">
        <NInput v-model:value="keyword" :placeholder="text.searchPlaceholder" />
      </div>

      <div class="bulk-toolbar">
        <label class="checkbox-inline">
          <NCheckbox :checked="allSelected"
            @update:checked="emit('toggleSelectAll', $event, pagedCards.map((item) => item.id))" />
          {{ text.selectCurrentPage }}
          <span class="muted small">{{ text.selectedPrefix }}{{ selectedCardIds.length }}{{ text.selectedSuffix
            }}</span>
        </label>
        <NSpace>
          <NButton size="small" tertiary :disabled="loading || !selectedCardIds.length"
            @click="emit('batchUpdateStatus', 'UNUSED')">
            <template #icon><RefreshOutline /></template>
            {{ text.batchUnused }}</NButton>
          <NButton size="small" tertiary type="warning" :disabled="loading || !selectedCardIds.length"
            @click="emit('batchUpdateStatus', 'INVALID')">
            <template #icon><CloseOutline /></template>
            {{ text.batchInvalid }}</NButton>
          <ConfirmActionButton :label="text.batchDelete" :message="text.batchDeleteConfirm"
            :disabled="loading || !selectedCardIds.length" @confirm="emit('batchDeleteCards')">
            <template #icon>
              <TrashOutline />
            </template>
          </ConfirmActionButton>
          <NButton size="small" quaternary :disabled="loading || !selectedCardIds.length"
            @click="emit('clearSelection')">
            <template #icon><CloseOutline /></template>
            {{ text.clearSelection }}</NButton>
          <NButton size="small" quaternary :disabled="loading || !cards.length" @click="emit('exportCards')">
            <template #icon>
              <DownloadOutline />
            </template>
            {{ text.exportCsv }}
          </NButton>
        </NSpace>
      </div>

      <NEmpty v-if="!filteredCards.length" class="empty-block" :description="text.noCards" />
      <NTable v-else striped>
        <thead>
          <tr>
            <th></th>
            <th>{{ text.product }}</th>
            <th>{{ text.batch }}</th>
            <th>{{ text.status }}</th>
            <th>{{ text.cardSecret }}</th>
            <th>{{ text.orderNo }}</th>
            <th>{{ text.actions }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedCards" :key="item.id">
            <td>
              <NCheckbox :checked="selectedCardIds.includes(item.id)"
                @update:checked="emit('toggleSelect', item.id, $event)" />
            </td>
            <td>{{ item.product?.name }}</td>
            <td>{{ item.batch?.batchName }}</td>
            <td>
              <NTag type="info">{{ renderCardStatus(item.status) }}</NTag>
            </td>
            <td class="mono-cell">{{ item.cardSecret }}</td>
            <td>{{ item.soldOrder?.orderNo ?? '-' }}</td>
            <td>
              <NSpace class="row-actions" size="small">
                <NButton class="table-action-button" size="small" tertiary @click="openEditModal(item)">
                  <template #icon>
                    <CreateOutline />
                  </template>
                  {{ text.edit }}
                </NButton>
                <NButton class="table-action-button" size="small" tertiary
                  @click="emit('updateStatus', item.id, 'UNUSED')">
                  <template #icon><RefreshOutline /></template>
                  {{ text.setUnused }}</NButton>
                <NButton class="table-action-button" size="small" quaternary type="warning"
                  @click="emit('updateStatus', item.id, 'INVALID')">
                  <template #icon><CloseOutline /></template>
                  {{ text.invalidate }}</NButton>
                <ConfirmActionButton :label="text.delete" :message="text.deleteConfirm"
                  @confirm="emit('deleteCard', item.id)">
                  <template #icon>
                    <TrashOutline />
                  </template>
                </ConfirmActionButton>
              </NSpace>
            </td>
          </tr>
        </tbody>
      </NTable>

      <TablePager v-model:page="page" v-model:page-size="pageSize" :total="filteredCards.length" />
    </NCard>

    <NModal :show="importModalVisible" preset="card" :title="text.importTitle" class="inline-modal-wide"
      @update:show="!$event && closeImportModal()">
      <div class="form-grid compact">
        <div class="field-block">
          <label>{{ text.product }}</label>
          <NSelect v-model:value="cardForm.productId" :options="productOptions" />
        </div>
        <div class="field-block">
          <label>{{ text.batchName }}</label>
          <NInput v-model:value="cardForm.batchName" />
        </div>
      </div>
      <div class="field-block">
        <label>{{ text.cardListInput }}</label>
        <NInput v-model:value="cardForm.cards" type="textarea" :autosize="{ minRows: 8, maxRows: 14 }" />
      </div>
      <p class="muted small">{{ text.duplicateTip }}</p>
      <NSpace justify="end">
        <NButton quaternary @click="closeImportModal"><template #icon><CloseOutline /></template>{{ text.cancel }}</NButton>
        <NButton type="primary" :loading="loading" @click="submitImport">
          <template #icon>
            <CloudUploadOutline />
          </template>
          {{ text.importCards }}
        </NButton>
      </NSpace>
    </NModal>

    <NModal :show="editModalVisible" preset="card" :title="text.editTitle" class="inline-modal-wide"
      @update:show="!$event && closeEditModal()">
      <div class="field-block">
        <label>{{ text.cardSecret }}</label>
        <NInput v-model:value="cardEditForm.cardSecret" type="textarea" :autosize="{ minRows: 4, maxRows: 10 }" />
      </div>
      <div class="field-block">
        <label>{{ text.status }}</label>
        <NSelect v-model:value="cardEditForm.status" :options="editStatusOptions" />
      </div>
      <NSpace justify="end">
        <NButton quaternary @click="closeEditModal"><template #icon><CloseOutline /></template>{{ text.cancel }}</NButton>
        <NButton type="primary" :loading="loading" @click="submitEdit"><template #icon><SaveOutline /></template>{{ text.save }}</NButton>
      </NSpace>
    </NModal>
  </section>
</template>
