<script setup lang="ts">
import { AddOutline, CheckmarkCircleOutline, CloseOutline, CloudUploadOutline, CreateOutline, ImageOutline, PricetagOutline, RemoveCircleOutline, SaveOutline, TrashOutline } from '@vicons/ionicons5'
import { NButton, NCard, NCheckbox, NEmpty, NIcon, NImage, NInput, NInputNumber, NModal, NSelect, NSpace, NTable, NTag } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import ConfirmActionButton from '../../components/common/ConfirmActionButton.vue'
import TablePager from '../../components/TablePager.vue'
import type { Category, Product } from '../../types'
import { deliveryTypeMap, mapLabel, productTypeMap } from '../../utils/dicts'

const text = {
  categoryList: '分类列表',
  createCategory: '创建分类',
  categorySearch: '搜索分类名称',
  name: '名称',
  sort: '排序',
  status: '状态',
  actions: '操作',
  enabled: '启用',
  disabled: '禁用',
  edit: '编辑',
  remove: '删除',
  removeCategoryConfirm: '确认删除这个分类吗？',
  editCategoryTitle: '编辑分类',
  createCategoryTitle: '创建分类',
  saveCategory: '保存分类',
  productList: '商品管理',
  productCountSuffix: ' 个商品',
  createProduct: '创建商品',
  productSearch: '搜索商品名称 / Slug / 分类',
  category: '分类',
  coverImage: '缩略图',
  coverImageUpload: '上传图片',
  coverImageHint: '支持 jpg、png、webp，单张不超过 2MB，也可以直接填写图片地址。',
  coverImageUrl: '图片地址',
  price: '售价',
  wholesalePrice: '批发价',
  stock: '库存',
  stockAutoHint: '自动发货时由卡密数量自动计算',
  stockManualHint: '手动发货需要维护库存',
  slug: 'Slug（商品地址）',
  type: '商品类型',
  deliveryType: '发货方式',
  cardType: '卡密类',
  subscriptionType: '订阅类',
  customType: '自定义',
  autoDelivery: '自动发货',
  manualDelivery: '手动发货',
  apiHook: 'Webhook 地址',
  description: '商品描述',
  apiHookHint: '订单支付成功后会向该地址发送 POST 请求。',
  listed: '上架',
  unlisted: '下架',
  removeProductConfirm: '确认删除这个商品吗？',
  batchUnlistConfirm: '确认下架已选商品吗？',
  batchDeleteConfirm: '确认删除已选商品吗？',
  selectCurrentPage: '全选当前页',
  selectedPrefix: '已选 ',
  selectedSuffix: ' 个',
  batchUnlist: '批量下架',
  batchDelete: '批量删除',
  clearSelection: '清空勾选',
  noProducts: '暂无商品数据',
  editProductTitle: '编辑商品',
  createProductTitle: '创建商品',
  saveProduct: '保存商品',
  cancel: '取消',
}

const props = defineProps<{
  loading: boolean
  editingCategoryId: string
  editingProductId: string
  categorySaveVersion: number
  productSaveVersion: number
  categories: Category[]
  products: Product[]
  selectedProductIds: string[]
}>()

const categoryForm = defineModel<{ name: string; sort: number; status: boolean }>('categoryForm', { required: true })
const productForm = defineModel<any>('productForm', { required: true })
const emit = defineEmits<{
  saveCategory: []
  editCategory: [item: Category]
  toggleCategory: [item: Category]
  deleteCategory: [id: string]
  resetCategory: []
  saveProduct: []
  editProduct: [item: Product]
  toggleProduct: [item: Product]
  deleteProduct: [id: string]
  resetProduct: []
  uploadCover: [file: File]
  toggleProductSelect: [id: string, checked: boolean]
  toggleAllProducts: [checked: boolean, ids: string[]]
  clearProductSelection: []
  batchUnlistProducts: []
  deleteSelectedProducts: []
}>()

const categoryKeyword = ref('')
const productKeyword = ref('')
const categoryPage = ref(1)
const productPage = ref(1)
const categoryPageSize = ref(10)
const productPageSize = ref(10)
const categoryModalVisible = ref(false)
const productModalVisible = ref(false)
const coverInput = ref<HTMLInputElement | null>(null)

const categoryOptions = computed(() => props.categories.map((item) => ({ label: item.name, value: item.id })))
const productTypeOptions = [
  { label: text.cardType, value: 'CARD' },
  { label: text.subscriptionType, value: 'SUBSCRIPTION' },
  { label: text.customType, value: 'CUSTOM' },
]
const deliveryTypeOptions = [
  { label: text.autoDelivery, value: 'AUTO' },
  { label: text.manualDelivery, value: 'MANUAL' },
]

const filteredCategories = computed(() => props.categories.filter((item) => !categoryKeyword.value || item.name.toLowerCase().includes(categoryKeyword.value.toLowerCase())))
const pagedCategories = computed(() => filteredCategories.value.slice((categoryPage.value - 1) * categoryPageSize.value, categoryPage.value * categoryPageSize.value))
const filteredProducts = computed(() => props.products.filter((item) => !productKeyword.value || [item.name, item.slug, item.category?.name ?? '', item.type ?? '', item.deliveryType ?? ''].some((value) => value.toLowerCase().includes(productKeyword.value.toLowerCase()))))
const pagedProducts = computed(() => filteredProducts.value.slice((productPage.value - 1) * productPageSize.value, productPage.value * productPageSize.value))
const allSelected = computed(() => pagedProducts.value.length > 0 && pagedProducts.value.every((item) => props.selectedProductIds.includes(item.id)))

function openCreateCategory() {
  emit('resetCategory')
  categoryModalVisible.value = true
}

function openEditCategory(item: Category) {
  emit('editCategory', item)
  categoryModalVisible.value = true
}

function closeCategoryModal() {
  categoryModalVisible.value = false
  emit('resetCategory')
}

function submitCategory() {
  emit('saveCategory')
}

function openCreateProduct() {
  emit('resetProduct')
  productModalVisible.value = true
}

function openEditProduct(item: Product) {
  emit('editProduct', item)
  productModalVisible.value = true
}

function closeProductModal() {
  productModalVisible.value = false
  emit('resetProduct')
}

function submitProduct() {
  emit('saveProduct')
}

function openCoverPicker() {
  coverInput.value?.click()
}

function handleCoverPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  emit('uploadCover', file)
  input.value = ''
}

function renderDeliveryType(value?: string) {
  return mapLabel(value, deliveryTypeMap)
}

function renderProductType(value?: string) {
  return mapLabel(value, productTypeMap)
}

watch(() => props.categorySaveVersion, (value, previous) => {
  if (value !== previous && value > 0) closeCategoryModal()
})

watch(() => props.productSaveVersion, (value, previous) => {
  if (value !== previous && value > 0) closeProductModal()
})
</script>

<template>
  <section class="stack">
    <NCard class="panel-card" :bordered="false">
      <template #header>
        <div class="section-header">
          <h3>{{ text.categoryList }}</h3>
          <NButton type="primary" @click="openCreateCategory">
            <template #icon>
              <NIcon>
                <AddOutline />
              </NIcon>
            </template>
            {{ text.createCategory }}
          </NButton>
        </div>
      </template>
      <div class="toolbar">
        <NInput v-model:value="categoryKeyword" :placeholder="text.categorySearch" />
      </div>
      <NTable striped>
        <thead>
          <tr>
            <th>{{ text.name }}</th>
            <th>{{ text.sort }}</th>
            <th>{{ text.status }}</th>
            <th>{{ text.actions }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedCategories" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.sort }}</td>
            <td>
              <NTag :type="item.status ? 'success' : 'default'">{{ item.status ? text.enabled : text.disabled }}</NTag>
            </td>
            <td>
              <NSpace class="row-actions" size="small">
                <NButton class="table-action-button" size="small" tertiary @click="openEditCategory(item)">
                  <template #icon>
                    <NIcon>
                      <CreateOutline />
                    </NIcon>
                  </template>
                  {{ text.edit }}
                </NButton>
                <NButton class="table-action-button" size="small" quaternary @click="emit('toggleCategory', item)">
                  <template #icon>
                    <CheckmarkCircleOutline />
                  </template>
                  {{ item.status ? text.disabled : text.enabled }}
                </NButton>
                <ConfirmActionButton :label="text.remove" :message="text.removeCategoryConfirm"
                  @confirm="emit('deleteCategory', item.id)">
                  <template #icon>
                    <NIcon>
                      <TrashOutline />
                    </NIcon>
                  </template>
                </ConfirmActionButton>
              </NSpace>
            </td>
          </tr>
        </tbody>
      </NTable>
      <TablePager v-model:page="categoryPage" v-model:page-size="categoryPageSize" :total="filteredCategories.length" />
    </NCard>

    <NModal :show="categoryModalVisible" preset="card"
      :title="editingCategoryId ? text.editCategoryTitle : text.createCategoryTitle" class="inline-modal"
      @update:show="!$event && closeCategoryModal()">
      <div class="form-grid compact">
        <div class="field-block"><label>{{ text.name }}</label>
          <NInput v-model:value="categoryForm.name" />
        </div>
        <div class="field-block"><label>{{ text.sort }}</label>
          <NInputNumber v-model:value="categoryForm.sort" :show-button="false" />
        </div>
      </div>
      <div class="modal-actions">
        <NButton quaternary @click="closeCategoryModal"><template #icon>
            <CloseOutline />
          </template>{{ text.cancel }}
        </NButton>
        <NButton type="primary" :loading="loading" @click="submitCategory"><template #icon>
            <SaveOutline />
          </template>{{
            editingCategoryId ? text.saveCategory : text.createCategory }}</NButton>
      </div>
    </NModal>

    <NCard class="panel-card" :bordered="false">
      <template #header>
        <div class="section-header">
          <h3>{{ text.productList }}</h3>
          <NSpace>
            <NTag type="info" round>
              <template #icon>
                <NIcon>
                  <PricetagOutline />
                </NIcon>
              </template>
              {{ products.length }}{{ text.productCountSuffix }}
            </NTag>
            <NButton type="primary" @click="openCreateProduct">
              <template #icon>
                <NIcon>
                  <AddOutline />
                </NIcon>
              </template>
              {{ text.createProduct }}
            </NButton>
          </NSpace>
        </div>
      </template>

      <div class="toolbar">
        <NInput v-model:value="productKeyword" :placeholder="text.productSearch" />
      </div>

      <div class="bulk-toolbar">
        <label class="checkbox-inline">
          <NCheckbox :checked="allSelected"
            @update:checked="emit('toggleAllProducts', $event, pagedProducts.map((item) => item.id))" />
          {{ text.selectCurrentPage }}
          <span class="muted small">{{ text.selectedPrefix }}{{ selectedProductIds.length }}{{ text.selectedSuffix
            }}</span>
        </label>
        <NSpace>
          <NButton size="small" tertiary type="warning" :disabled="loading || !selectedProductIds.length"
            @click="emit('batchUnlistProducts')">
            <template #icon>
              <NIcon>
                <RemoveCircleOutline />
              </NIcon>
            </template>
            {{ text.batchUnlist }}
          </NButton>
          <ConfirmActionButton :label="text.batchDelete" :message="text.batchDeleteConfirm"
            :disabled="loading || !selectedProductIds.length" @confirm="emit('deleteSelectedProducts')">
            <template #icon>
              <TrashOutline />
            </template>
          </ConfirmActionButton>
          <NButton size="small" quaternary :disabled="loading || !selectedProductIds.length"
            @click="emit('clearProductSelection')">
            <template #icon>
              <CloseOutline />
            </template>
            {{ text.clearSelection }}
          </NButton>
        </NSpace>
      </div>

      <NEmpty v-if="!filteredProducts.length" class="empty-block" :description="text.noProducts" />
      <NTable v-else striped>
        <thead>
          <tr>
            <th></th>
            <th>{{ text.name }}</th>
            <th>{{ text.category }}</th>
            <th>{{ text.type }}</th>
            <th>{{ text.deliveryType }}</th>
            <th>{{ text.price }}</th>
            <th>{{ text.stock }}</th>
            <th>{{ text.status }}</th>
            <th>{{ text.actions }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedProducts" :key="item.id">
            <td>
              <NCheckbox :checked="selectedProductIds.includes(item.id)"
                @update:checked="emit('toggleProductSelect', item.id, $event)" />
            </td>
            <td>
              <div class="product-row-head">
                <NImage v-if="item.coverImage" :src="item.coverImage" width="40" height="40" object-fit="cover"
                  class="product-cover-thumb" />
                <div>
                  <div>{{ item.name }}</div>
                  <small class="muted">{{ item.slug }}</small>
                </div>
              </div>
            </td>
            <td>{{ item.category?.name ?? '-' }}</td>
            <td>
              <NTag type="default">{{ renderProductType(item.type) }}</NTag>
            </td>
            <td>
              <NTag :type="item.deliveryType === 'MANUAL' ? 'warning' : 'info'">{{ renderDeliveryType(item.deliveryType)
                }}
              </NTag>
            </td>
            <td>{{ item.price }}</td>
            <td>{{ item.stock ?? item.manualStock ?? 0 }}</td>
            <td>
              <NTag :type="item.status ? 'success' : 'warning'">{{ item.status ? text.listed : text.unlisted }}</NTag>
            </td>
            <td>
              <NSpace class="row-actions" size="small">
                <NButton class="table-action-button" size="small" tertiary @click="openEditProduct(item)">
                  <template #icon>
                    <NIcon>
                      <CreateOutline />
                    </NIcon>
                  </template>
                  {{ text.edit }}
                </NButton>
                <NButton class="table-action-button" size="small" quaternary @click="emit('toggleProduct', item)">
                  <template #icon>
                    <CheckmarkCircleOutline />
                  </template>
                  {{ item.status ? text.unlisted : text.listed }}
                </NButton>
                <ConfirmActionButton :label="text.remove" :message="text.removeProductConfirm"
                  @confirm="emit('deleteProduct', item.id)">
                  <template #icon>
                    <NIcon>
                      <TrashOutline />
                    </NIcon>
                  </template>
                </ConfirmActionButton>
              </NSpace>
            </td>
          </tr>
        </tbody>
      </NTable>
      <TablePager v-model:page="productPage" v-model:page-size="productPageSize" :total="filteredProducts.length" />
    </NCard>

    <NModal :show="productModalVisible" preset="card"
      :title="editingProductId ? text.editProductTitle : text.createProductTitle" class="inline-modal inline-modal-wide"
      @update:show="!$event && closeProductModal()">
      <div class="form-grid compact">
        <div class="field-block field-block-span-2">
          <label>{{ text.coverImage }}</label>
          <div class="product-cover-field">
            <div class="product-cover-preview">
              <NImage v-if="productForm.coverImage" :src="productForm.coverImage" width="96" height="96"
                object-fit="cover" />
              <div v-else class="product-cover-empty">
                <NIcon size="24">
                  <ImageOutline />
                </NIcon>
              </div>
            </div>
            <div class="product-cover-actions">
              <NButton secondary @click="openCoverPicker">
                <template #icon>
                  <NIcon>
                    <CloudUploadOutline />
                  </NIcon>
                </template>
                {{ text.coverImageUpload }}
              </NButton>
              <input ref="coverInput" type="file" accept="image/*" class="hidden-file-input"
                @change="handleCoverPicked" />
              <NInput v-model:value="productForm.coverImage" :placeholder="text.coverImageUrl" />
              <small class="muted">{{ text.coverImageHint }}</small>
            </div>
          </div>
        </div>
        <div class="field-block"><label>{{ text.name }}</label>
          <NInput v-model:value="productForm.name" />
        </div>
        <div class="field-block"><label>{{ text.category }}</label>
          <NSelect v-model:value="productForm.categoryId" :options="categoryOptions" />
        </div>
        <div class="field-block"><label>{{ text.slug }}</label>
          <NInput v-model:value="productForm.slug" />
        </div>
        <div class="field-block"><label>{{ text.type }}</label>
          <NSelect v-model:value="productForm.type" :options="productTypeOptions" />
        </div>
        <div class="field-block"><label>{{ text.deliveryType }}</label>
          <NSelect v-model:value="productForm.deliveryType" :options="deliveryTypeOptions" />
        </div>
        <div class="field-block"><label>{{ text.price }}</label>
          <NInputNumber v-model:value="productForm.price" :show-button="false" />
        </div>
        <div class="field-block"><label>{{ text.wholesalePrice }}</label>
          <NInputNumber v-model:value="productForm.wholesalePrice" :show-button="false" />
        </div>
        <div class="field-block field-block-span-2"><label>{{ text.apiHook }}</label>
          <NInput v-model:value="productForm.apiHook" />
          <small class="muted field-help">{{ text.apiHookHint }}</small>
        </div>
        <div class="field-block">
          <label>{{ text.stock }}</label>
          <NInputNumber v-if="productForm.deliveryType === 'MANUAL'" v-model:value="productForm.manualStock"
            :show-button="false" :min="0" />
          <NInput v-else :value="text.stockAutoHint" disabled />
          <small class="muted">{{ productForm.deliveryType === 'MANUAL' ? text.stockManualHint : text.stockAutoHint
            }}</small>
        </div>
      </div>
      <div class="field-block"><label>{{ text.description }}</label>
        <NInput v-model:value="productForm.description" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
      </div>
      <div class="modal-actions">
        <NButton quaternary @click="closeProductModal"><template #icon>
            <CloseOutline />
          </template>{{ text.cancel }}
        </NButton>
        <NButton type="primary" :loading="loading" @click="submitProduct"><template #icon>
            <SaveOutline />
          </template>{{
            editingProductId ? text.saveProduct : text.createProduct }}</NButton>
      </div>
    </NModal>
  </section>
</template>
