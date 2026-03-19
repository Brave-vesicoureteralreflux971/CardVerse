import { computed, reactive, ref } from 'vue'
import { setApiToken, setUnauthorizedHandler } from '../api/client'
import { getAdminProfile, loginAdmin } from '../api/modules/auth'
import { batchDeleteCards as batchDeleteCardsApi, importCards as importCardsApi, listCards, patchCardStatus, removeCard, updateCard } from '../api/modules/cards'
import { batchDeleteProducts as batchDeleteProductsApi, batchUpdateProductsStatus, createCategory, createProduct, listCategories, listProducts, patchProductStatus, removeCategory, removeProduct, updateCategory, updateProduct } from '../api/modules/catalog'
import { batchDeleteCoupons as batchDeleteCouponsApi, batchUpdateCouponsStatus, createCoupon, listCoupons, removeCoupon, updateCoupon } from '../api/modules/coupons'
import { createMailTemplate, listMailTemplates, removeMailTemplate, retryMailLog, updateMailTemplate } from '../api/modules/mails'
import { batchResendOrderEmails, createOrder as createOrderApi, deleteOrders, getOrderDetail, listOrders, manualDeliverOrder, queryAdminOrder, resendOrderEmail } from '../api/modules/orders'
import { createPaymentChannel, listPaymentChannels, notifyPayment, patchPaymentChannelStatus, removePaymentChannel, updatePaymentChannel } from '../api/modules/payments'
import { listSystemConfigs, saveSystemConfig } from '../api/modules/system'
import { uploadImage } from '../api/modules/upload'
import { buildPaymentConfigJson, parsePaymentConfig, paymentDriverFields } from '../constants/payment-drivers'
import type { Card, Category, Coupon, MailTemplate, Order, PaymentChannel, Product, SystemConfig } from '../types'
import { downloadCsv } from '../utils/csv'
import { STORAGE_KEYS, getStorage, removeStorage, setStorage } from '../utils/storage'
import { showFloatingMessage } from '../utils/ui-message'
import { requireEmail, requireJsonText, requirePositiveNumber, requireSelection, requireText } from '../utils/validators'

const TEXT = {
  statsCategories: '分类',
  statsProducts: '商品',
  statsCards: '卡密',
  statsOrders: '订单',
  actionFailed: '操作失败',
  refreshedCurrent: '当前页面已刷新',
  refreshedAll: '整体数据已刷新',
  inputUsername: '请输入用户名',
  inputPassword: '请输入密码',
  loggedIn: '已进入后台',
  categoryNameRequired: '分类名称不能为空',
  categoryUpdated: '分类已更新',
  categoryCreated: '分类已创建',
  categoryDeleted: '分类已删除',
  productNameRequired: '商品名称不能为空',
  productCategoryRequired: '请选择商品分类',
  productSlugRequired: '商品 Slug 不能为空',
  productPriceRequired: '商品售价必须大于 0',
  productManualStockRequired: '手动发货商品必须填写库存，且不能小于 0',
  productJsonRequired: '其他输入框配置必须是合法 JSON',
  productUpdated: '商品已更新',
  productCreated: '商品已创建',
  productCoverUploaded: '商品缩略图已上传',
  productStatusUpdated: '商品状态已更新',
  productDeleted: '商品已删除',
  chooseProductsFirst: '请先选择商品',
  productsUnlistedPrefix: '已下架 ',
  productsUnlistedSuffix: ' 个商品',
  productsDeletedPrefix: '已删除 ',
  productsDeletedSuffix: ' 个商品',
  selectProduct: '请选择商品',
  inputCards: '请输入卡密内容',
  cardsImported: '卡密已导入',
  cardsFiltered: '卡密筛选已应用',
  cardSecretRequired: '卡密不能为空',
  cardUpdated: '卡密已更新',
  cardDeleted: '卡密已删除',
  cardStatusUpdated: '卡密状态已更新',
  chooseCardsFirst: '请先选择卡密',
  batchCardsUpdatedPrefix: '已批量更新 ',
  batchCardsUpdatedSuffix: ' 条卡密',
  cardsDeletedPrefix: '已删除 ',
  cardsDeletedSuffix: ' 条卡密',

  couponCodeRequired: '优惠码不能为空',
  couponValueRequired: '优惠值必须大于 0',
  couponUpdated: '优惠券已更新',
  couponCreated: '优惠券已创建',
  couponDeleted: '优惠券已删除',
  chooseCouponsFirst: '请先选择优惠券',
  couponsUpdatedPrefix: '已批量更新 ',
  couponsUpdatedSuffix: ' 张优惠券',
  couponsDeletedPrefix: '已删除 ',
  couponsDeletedSuffix: ' 张优惠券',
  emailRequired: '请输入正确的邮箱地址',
  quantityRequired: '购买数量必须大于 0',
  orderCreated: '订单已创建',
  inputOrderNo: '请输入订单号',
  inputChannelCode: '请输入通道代码',
  notifyDone: '支付回调已执行',
  inputQueryPassword: '请输入查询密码',
  queryDone: '订单查询成功',
  detailLoaded: '订单详情已加载',
  orderFiltered: '订单筛选已应用',
  chooseOrdersFirst: '请先选择订单',
  ordersDeletedPrefix: '已删除 ',
  ordersDeletedSuffix: ' 条订单',
  resendQueued: '已写入补发邮件记录',
  resendBatchQueuedPrefix: '已批量补发 ',
  resendBatchQueuedSuffix: ' 条订单邮件',
  manualDelivered: '订单已手动发货',
  manualDeliveryContentRequired: '请填写发货内容',
  mailRetryQueued: '邮件已重新发送',
  paymentNameRequired: '支付渠道名称不能为空',
  paymentCodeRequired: '支付渠道代码不能为空',
  paymentDriverRequired: '支付驱动不能为空',
  paymentJsonRequired: '支付配置必须是合法 JSON',
  paymentUpdated: '支付渠道已更新',
  paymentCreated: '支付渠道已创建',
  paymentStatusUpdated: '支付渠道状态已更新',
  paymentDeleted: '支付渠道已删除',
  mailNameRequired: '模板名称不能为空',
  mailEventRequired: '事件码不能为空',
  mailSubjectRequired: '邮件标题不能为空',
  mailUpdated: '邮件模板已更新',
  mailCreated: '邮件模板已创建',
  mailDeleted: '邮件模板已删除',
  configKeyRequired: '配置键不能为空',
  configSaved: '系统配置已保存',
  configGroupSaved: '配置分组已保存',
  csvOrderNo: '订单号',
  csvProduct: '商品',
  csvEmail: '邮箱',
  csvStatus: '状态',
  csvPayPrice: '支付金额',
  csvPaymentChannel: '支付通道',
  csvCreatedAt: '创建时间',
  csvBatch: '批次',
  csvCardSecret: '卡密',
}

const emptyCategory = () => ({ name: '', sort: 0, status: true })
const emptyProduct = () => ({ name: '', categoryId: '', slug: '', coverImage: '', type: 'CARD', deliveryType: 'AUTO', description: '', apiHook: '', content: '', price: 0, wholesalePrice: null as number | null, minQuantity: 1, maxQuantity: 1, manualStock: 0, status: true })
const emptyCoupon = () => ({ code: '', discountType: 'FIXED', discountValue: 0, minAmount: 0, totalLimit: null as number | null, useLimit: false, startAt: null as string | null, endAt: null as string | null, status: true, productIds: [] as number[] })
const emptyPayment = () => ({ name: '', code: '', driver: 'MOCK', configJson: '{}', configValues: {} as Record<string, string>, notifyUrl: '', returnUrl: '', sort: 0, status: true })
const emptyMail = () => ({ name: '', eventCode: '', subject: '', content: '', status: true })
const emptyConfig = () => ({ configKey: '', configValue: '', groupName: '' })

const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const token = ref(getStorage(STORAGE_KEYS.token) ?? '')
const loggedIn = ref(false)
const profile = ref<Record<string, unknown> | null>(null)
const initialized = ref(false)

const lastOrder = ref<Record<string, unknown> | null>(null)
const queriedOrder = ref<Record<string, unknown> | null>(null)
const orderDetail = ref<Record<string, unknown> | null>(null)
const selectedCardIds = ref<string[]>([])
const selectedCouponIds = ref<string[]>([])
const selectedProductIds = ref<string[]>([])
const selectedOrderIds = ref<string[]>([])
const editingCategoryId = ref('')
const editingProductId = ref('')
const editingCouponId = ref('')
const editingPaymentId = ref('')
const editingMailId = ref('')
const cardImportVersion = ref(0)
const cardEditVersion = ref(0)
const categorySaveVersion = ref(0)
const productSaveVersion = ref(0)
const couponSaveVersion = ref(0)
const paymentSaveVersion = ref(0)
const mailSaveVersion = ref(0)
const configSaveVersion = ref(0)
const manualDeliverModalVisible = ref(false)
const manualDeliverOrderId = ref('')
const manualDeliverContent = ref('')

const loginForm = reactive({ username: '', password: '' })
const cachedLogin = getStorage(STORAGE_KEYS.login)
if (cachedLogin) {
  try {
    Object.assign(loginForm, JSON.parse(cachedLogin))
  } catch {
    // ignore broken cache
  }
}
const categoryForm = reactive(emptyCategory())
const productForm = reactive(emptyProduct())
const cardForm = reactive({ productId: '', batchName: '', remark: '', cards: '' })
const cardEditForm = reactive({ id: '', cardSecret: '', status: 'UNUSED' })
const cardFilter = reactive({ productId: '', status: '' })
const couponForm = reactive(emptyCoupon())
const orderForm = reactive({ productId: '', email: '', quantity: 1, couponCode: '', paymentChannelCode: '' })
const orderFilter = reactive({ keyword: '', email: '', status: '', productId: '', paymentChannelCode: '' })
const notifyForm = reactive({ orderNo: '', channelCode: '', thirdTradeNo: '' })
const orderQueryForm = reactive({ orderNo: '' })
const paymentForm = reactive(emptyPayment())
const mailForm = reactive(emptyMail())
const configForm = reactive(emptyConfig())

const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const cards = ref<Card[]>([])
const coupons = ref<Coupon[]>([])
const orders = ref<Order[]>([])
const paymentChannels = ref<PaymentChannel[]>([])
const mailTemplates = ref<MailTemplate[]>([])
const systemConfigs = ref<SystemConfig[]>([])

const stats = computed(() => [
  { label: TEXT.statsCategories, value: categories.value.length },
  { label: TEXT.statsProducts, value: products.value.length },
  { label: TEXT.statsCards, value: cards.value.length },
  { label: TEXT.statsOrders, value: orders.value.length },
])

function formatFlashText(text: string, type: 'success' | 'error') {
  const normalized = String(text).trim()

  if (!normalized || type !== 'error') {
    return normalized
  }

  const [summary, details] = normalized.split('：', 2)

  if (!details) {
    return normalized
  }

  const lines = details
    .split('；')
    .map((item) => item.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return normalized
  }

  return `${summary}：\n- ${lines.join('\n- ')}`
}

function flash(text: string, type: 'success' | 'error' = 'success') {
  const nextText = formatFlashText(text, type)
  message.value = nextText
  messageType.value = type
  const duration = type === 'error' ? 8000 : 3000
  showFloatingMessage(nextText, type, duration)
  setTimeout(() => {
    if (message.value === nextText) message.value = ''
  }, duration)
}

function toQuery(params: Record<string, string>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value)
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

function clearSession() {
  token.value = ''
  loggedIn.value = false
  profile.value = null
  initialized.value = false
  setApiToken('')
  removeStorage(STORAGE_KEYS.token)
}

function resetCategoryEdit() { editingCategoryId.value = ''; Object.assign(categoryForm, emptyCategory()) }
function resetProductEdit() { editingProductId.value = ''; Object.assign(productForm, emptyProduct()) }
function resetCouponEdit() { editingCouponId.value = ''; Object.assign(couponForm, emptyCoupon()) }
function resetPaymentEdit() { editingPaymentId.value = ''; Object.assign(paymentForm, emptyPayment()) }
function resetMailEdit() { editingMailId.value = ''; Object.assign(mailForm, emptyMail()) }
function closeOrderDetail() { orderDetail.value = null }
function clearCardSelection() { selectedCardIds.value = [] }
function clearCouponSelection() { selectedCouponIds.value = [] }
function clearProductSelection() { selectedProductIds.value = [] }
function clearOrderSelection() { selectedOrderIds.value = [] }
function resetCardEdit() { Object.assign(cardEditForm, { id: '', cardSecret: '', status: 'UNUSED' }) }
function toggleCardSelection(id: string, checked: boolean) { selectedCardIds.value = checked ? Array.from(new Set([...selectedCardIds.value, id])) : selectedCardIds.value.filter((item) => item !== id) }
function toggleAllCards(checked: boolean, ids: string[]) { selectedCardIds.value = checked ? Array.from(new Set([...selectedCardIds.value, ...ids])) : selectedCardIds.value.filter((item) => !ids.includes(item)) }
function toggleCouponSelection(id: string, checked: boolean) { selectedCouponIds.value = checked ? Array.from(new Set([...selectedCouponIds.value, id])) : selectedCouponIds.value.filter((item) => item !== id) }
function toggleAllCoupons(checked: boolean, ids: string[]) { selectedCouponIds.value = checked ? Array.from(new Set([...selectedCouponIds.value, ...ids])) : selectedCouponIds.value.filter((item) => !ids.includes(item)) }
function toggleProductSelection(id: string, checked: boolean) { selectedProductIds.value = checked ? Array.from(new Set([...selectedProductIds.value, id])) : selectedProductIds.value.filter((item) => item !== id) }
function toggleAllProducts(checked: boolean, ids: string[]) { selectedProductIds.value = checked ? Array.from(new Set([...selectedProductIds.value, ...ids])) : selectedProductIds.value.filter((item) => !ids.includes(item)) }
function toggleOrderSelection(id: string, checked: boolean) { selectedOrderIds.value = checked ? Array.from(new Set([...selectedOrderIds.value, id])) : selectedOrderIds.value.filter((item) => item !== id) }
function toggleAllOrders(checked: boolean, ids: string[]) { selectedOrderIds.value = checked ? Array.from(new Set([...selectedOrderIds.value, ...ids])) : selectedOrderIds.value.filter((item) => !ids.includes(item)) }

async function guard(task: () => Promise<void>) {
  loading.value = true
  try {
    await task()
  } catch (error) {
    flash(error instanceof Error ? error.message : TEXT.actionFailed, 'error')
    throw error
  } finally {
    loading.value = false
  }
}

async function loadCategories() { categories.value = await listCategories() }
async function loadProducts() { products.value = await listProducts(); selectedProductIds.value = selectedProductIds.value.filter((id) => products.value.some((item) => item.id === id)) }
async function loadCards() { cards.value = await listCards(toQuery({ productId: cardFilter.productId, status: cardFilter.status })); selectedCardIds.value = selectedCardIds.value.filter((id) => cards.value.some((item) => item.id === id)) }
async function loadCoupons() { coupons.value = await listCoupons(); selectedCouponIds.value = selectedCouponIds.value.filter((id) => coupons.value.some((item) => item.id === id)) }
async function loadOrders() { orders.value = await listOrders(toQuery(orderFilter)); selectedOrderIds.value = selectedOrderIds.value.filter((id) => orders.value.some((item) => item.id === id)) }
async function loadPaymentChannels() { paymentChannels.value = await listPaymentChannels() }
async function loadMailTemplates() { mailTemplates.value = await listMailTemplates() }
async function loadSystemConfigs() { systemConfigs.value = await listSystemConfigs() }

async function loadAll() {
  await Promise.all([loadCategories(), loadProducts(), loadCards(), loadCoupons(), loadOrders(), loadPaymentChannels(), loadMailTemplates(), loadSystemConfigs()])
  initialized.value = true
}

async function initializeSession() {
  if (!token.value) return false
  setApiToken(token.value)
  try {
    profile.value = await getAdminProfile()
    loggedIn.value = true
    if (!initialized.value) {
      await loadAll()
    }
    return true
  } catch {
    clearSession()
    return false
  }
}

async function login() {
  await guard(async () => {
    requireText(loginForm.username, TEXT.inputUsername)
    requireText(loginForm.password, TEXT.inputPassword)
    const auth = await loginAdmin(loginForm)
    token.value = auth.token
    setApiToken(auth.token)
    setStorage(STORAGE_KEYS.token, auth.token)
    setStorage(STORAGE_KEYS.login, JSON.stringify(loginForm))
    profile.value = await getAdminProfile()
    loggedIn.value = true
    await loadAll()
    flash(TEXT.loggedIn)
  })
}

function logout() {
  clearSession()
}

async function saveCategory() {
  await guard(async () => {
    requireText(categoryForm.name, TEXT.categoryNameRequired)
    const payload = { name: categoryForm.name, sort: Number(categoryForm.sort), status: Boolean(categoryForm.status) }
    const isEditing = Boolean(editingCategoryId.value)
    if (isEditing) await updateCategory(editingCategoryId.value, payload)
    else await createCategory(payload)
    resetCategoryEdit()
    await loadCategories()
    categorySaveVersion.value += 1
    flash(isEditing ? TEXT.categoryUpdated : TEXT.categoryCreated)
  })
}

function editCategory(item: Category) {
  editingCategoryId.value = item.id
  Object.assign(categoryForm, { name: item.name, sort: item.sort, status: item.status })
}

async function toggleCategory(item: Category) {
  await guard(async () => {
    await updateCategory(item.id, { name: item.name, sort: item.sort, status: !item.status })
    await loadCategories()
    flash(TEXT.categoryUpdated)
  })
}

async function deleteCategory(id: string) {
  await guard(async () => {
    await removeCategory(id)
    if (editingCategoryId.value === id) resetCategoryEdit()
    await loadCategories()
    flash(TEXT.categoryDeleted)
  })
}

async function saveProduct() {
  await guard(async () => {
    requireText(productForm.name, TEXT.productNameRequired)
    requireSelection(productForm.categoryId, TEXT.productCategoryRequired)
    requireText(productForm.slug, TEXT.productSlugRequired)
    requirePositiveNumber(productForm.price, TEXT.productPriceRequired)
    if (productForm.deliveryType === 'MANUAL') {
      const manualStock = Number(productForm.manualStock)
      if (!Number.isInteger(manualStock) || manualStock < 0) {
        throw new Error(TEXT.productManualStockRequired)
      }
    }

    const payload = {
      name: String(productForm.name).trim(),
      categoryId: Number(productForm.categoryId),
      slug: String(productForm.slug).trim(),
      coverImage: String(productForm.coverImage ?? '').trim() || undefined,
      type: productForm.type || 'CARD',
      deliveryType: productForm.deliveryType || 'AUTO',
      description: String(productForm.description ?? '').trim(),
      apiHook: String(productForm.apiHook ?? '').trim(),
      content: String(productForm.content ?? ''),
      price: Number(productForm.price),
      wholesalePrice: Number(productForm.wholesalePrice ?? 0) > 0 ? Number(productForm.wholesalePrice) : undefined,
      minQuantity: Number(productForm.minQuantity ?? 1),
      maxQuantity: Number(productForm.maxQuantity ?? 1),
      manualStock: productForm.deliveryType === 'MANUAL' ? Number(productForm.manualStock ?? 0) : undefined,
      status: Boolean(productForm.status),
    }

    const isEditing = Boolean(editingProductId.value)
    if (isEditing) await updateProduct(editingProductId.value, payload)
    else await createProduct(payload)
    resetProductEdit()
    await loadProducts()
    productSaveVersion.value += 1
    flash(isEditing ? TEXT.productUpdated : TEXT.productCreated)
  })
}

function editProduct(item: Product) {
  editingProductId.value = item.id
  Object.assign(productForm, { ...emptyProduct(), name: item.name, categoryId: item.categoryId ?? item.category?.id ?? '', slug: item.slug, coverImage: item.coverImage ?? '', type: item.type ?? 'CARD', deliveryType: item.deliveryType ?? 'AUTO', description: item.description ?? '', apiHook: item.apiHook ?? '', content: item.content ?? '', price: Number(item.price), wholesalePrice: Number(item.wholesalePrice ?? 0) > 0 ? Number(item.wholesalePrice) : null, minQuantity: item.minQuantity ?? 1, maxQuantity: item.maxQuantity ?? 1, manualStock: item.manualStock ?? item.stock ?? 0, status: item.status })
}

async function uploadProductCover(file: File) {
  await guard(async () => {
    const result = await uploadImage(file, 'products')
    productForm.coverImage = result.url
    flash(TEXT.productCoverUploaded)
  })
}

async function toggleProduct(item: Product) {
  await guard(async () => {
    await patchProductStatus(item.id, !item.status)
    await loadProducts()
    flash(TEXT.productStatusUpdated)
  })
}

async function deleteProduct(id: string) {
  await guard(async () => {
    await removeProduct(id)
    if (editingProductId.value === id) resetProductEdit()
    await loadProducts()
    flash(TEXT.productDeleted)
  })
}

async function batchUnlistProducts() {
  await guard(async () => {
    requirePositiveNumber(selectedProductIds.value.length, TEXT.chooseProductsFirst)
    const count = selectedProductIds.value.length
    await batchUpdateProductsStatus([...selectedProductIds.value], false)
    clearProductSelection()
    await loadProducts()
    flash(TEXT.productsUnlistedPrefix + count + TEXT.productsUnlistedSuffix)
  })
}

async function deleteSelectedProducts() {
  await guard(async () => {
    requirePositiveNumber(selectedProductIds.value.length, TEXT.chooseProductsFirst)
    const count = selectedProductIds.value.length
    await batchDeleteProductsApi([...selectedProductIds.value])
    clearProductSelection()
    await loadProducts()
    flash(TEXT.productsDeletedPrefix + count + TEXT.productsDeletedSuffix)
  })
}
async function importCards() {
  await guard(async () => {
    requireSelection(cardForm.productId, TEXT.selectProduct)
    requireText(cardForm.cards, TEXT.inputCards)
    await importCardsApi({ productId: Number(cardForm.productId), batchName: cardForm.batchName, remark: cardForm.remark, cards: cardForm.cards.split(/\r?\n/).filter(Boolean) })
    Object.assign(cardForm, { productId: '', batchName: '', remark: '', cards: '' })
    await loadCards()
    cardImportVersion.value += 1
    flash(TEXT.cardsImported)
  })
}

async function filterCards() {
  await guard(async () => {
    await loadCards()
    flash(TEXT.cardsFiltered)
  })
}

function editCard(item: Card) {
  Object.assign(cardEditForm, { id: item.id, cardSecret: item.cardSecret, status: item.status })
}

async function saveCardEdit() {
  await guard(async () => {
    requireText(cardEditForm.cardSecret, TEXT.cardSecretRequired)
    await updateCard(cardEditForm.id, { cardSecret: String(cardEditForm.cardSecret).trim(), status: cardEditForm.status })
    resetCardEdit()
    await loadCards()
    cardEditVersion.value += 1
    flash(TEXT.cardUpdated)
  })
}

async function deleteCard(id: string) {
  await guard(async () => {
    await removeCard(id)
    if (cardEditForm.id === id) resetCardEdit()
    await loadCards()
    flash(TEXT.cardDeleted)
  })
}

async function updateCardStatus(id: string, status: string) {
  await guard(async () => {
    await patchCardStatus(id, status)
    await loadCards()
    flash(TEXT.cardStatusUpdated)
  })
}

async function batchUpdateCardStatus(status: string) {
  await guard(async () => {
    requirePositiveNumber(selectedCardIds.value.length, TEXT.chooseCardsFirst)
    const count = selectedCardIds.value.length
    for (const id of selectedCardIds.value) {
      await patchCardStatus(id, status)
    }
    await loadCards()
    clearCardSelection()
    flash(`${TEXT.batchCardsUpdatedPrefix}${count}${TEXT.batchCardsUpdatedSuffix}`)
  })
}

async function batchDeleteCards() {
  await guard(async () => {
    requirePositiveNumber(selectedCardIds.value.length, TEXT.chooseCardsFirst)
    const count = selectedCardIds.value.length
    await batchDeleteCardsApi([...selectedCardIds.value])
    clearCardSelection()
    await loadCards()
    flash(TEXT.cardsDeletedPrefix + count + TEXT.cardsDeletedSuffix)
  })
}

async function saveCoupon() {
  await guard(async () => {
    requireText(couponForm.code, TEXT.couponCodeRequired)
    requirePositiveNumber(couponForm.discountValue, TEXT.couponValueRequired)
    if (couponForm.useLimit) requirePositiveNumber(couponForm.totalLimit, '可用次数必须大于 0')

    const startAt = couponForm.startAt ? new Date(couponForm.startAt) : null
    const endAt = couponForm.endAt ? new Date(couponForm.endAt) : null
    if (startAt && Number.isNaN(startAt.getTime())) {
      throw new Error('开始时间格式不正确')
    }

    if (endAt && Number.isNaN(endAt.getTime())) {
      throw new Error('结束时间格式不正确')
    }

    if (startAt && endAt && startAt.getTime() > endAt.getTime()) {
      throw new Error('结束时间不能早于开始时间')
    }

    const payload = {
      code: String(couponForm.code).trim(),
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
      minAmount: Number(couponForm.minAmount ?? 0),
      totalLimit: couponForm.useLimit ? Number(couponForm.totalLimit) : undefined,
      startAt: startAt ? startAt.toISOString() : undefined,
      endAt: endAt ? endAt.toISOString() : undefined,
      status: Boolean(couponForm.status),
      productIds: Array.isArray(couponForm.productIds) ? couponForm.productIds.map((item) => Number(item)).filter((item) => item > 0) : [],
    }
    const isEditing = Boolean(editingCouponId.value)
    if (isEditing) await updateCoupon(editingCouponId.value, payload)
    else await createCoupon(payload)
    resetCouponEdit()
    await loadCoupons()
    couponSaveVersion.value += 1
    flash(isEditing ? TEXT.couponUpdated : TEXT.couponCreated)
  })
}

function editCoupon(item: Coupon) {
  editingCouponId.value = item.id
  Object.assign(couponForm, { ...emptyCoupon(), code: item.code, discountType: item.discountType, discountValue: Number(item.discountValue), minAmount: Number(item.minAmount ?? 0), totalLimit: item.totalLimit ? Number(item.totalLimit) : null, useLimit: Boolean(item.totalLimit), startAt: item.startAt ? item.startAt.slice(0, 16) : null, endAt: item.endAt ? item.endAt.slice(0, 16) : null, status: item.status ?? true, productIds: item.couponProducts?.map((row) => Number(row.product.id)).filter((value) => value > 0) ?? [] })
}

async function toggleCoupon(item: Coupon) {
  await guard(async () => {
    await updateCoupon(item.id, {
      code: item.code,
      discountType: item.discountType,
      discountValue: Number(item.discountValue),
      minAmount: Number(item.minAmount ?? 0),
      totalLimit: item.totalLimit ? Number(item.totalLimit) : undefined,
      startAt: item.startAt ?? undefined,
      endAt: item.endAt ?? undefined,
      status: !(item.status ?? true),
      productIds: item.couponProducts?.map((row) => Number(row.product.id)).filter((value) => value > 0) ?? [],
    })
    await loadCoupons()
    flash(TEXT.couponUpdated)
  })
}

async function deleteCoupon(id: string) {
  await guard(async () => {
    await removeCoupon(id)
    if (editingCouponId.value === id) resetCouponEdit()
    await loadCoupons()
    flash(TEXT.couponDeleted)
  })
}

async function batchToggleCoupons(status: boolean) {
  await guard(async () => {
    requirePositiveNumber(selectedCouponIds.value.length, TEXT.chooseCouponsFirst)
    const count = selectedCouponIds.value.length
    await batchUpdateCouponsStatus([...selectedCouponIds.value], status)
    clearCouponSelection()
    await loadCoupons()
    flash(TEXT.couponsUpdatedPrefix + count + TEXT.couponsUpdatedSuffix)
  })
}

async function deleteSelectedCoupons() {
  await guard(async () => {
    requirePositiveNumber(selectedCouponIds.value.length, TEXT.chooseCouponsFirst)
    const count = selectedCouponIds.value.length
    await batchDeleteCouponsApi([...selectedCouponIds.value])
    clearCouponSelection()
    await loadCoupons()
    flash(TEXT.couponsDeletedPrefix + count + TEXT.couponsDeletedSuffix)
  })
}

async function createOrder() {
  await guard(async () => {
    requireSelection(orderForm.productId, TEXT.selectProduct)
    requireEmail(orderForm.email, TEXT.emailRequired)
    requirePositiveNumber(orderForm.quantity, TEXT.quantityRequired)
    requireText(orderForm.paymentChannelCode, TEXT.inputChannelCode)
    lastOrder.value = await createOrderApi({ ...orderForm, productId: Number(orderForm.productId), quantity: Number(orderForm.quantity) })
    notifyForm.orderNo = String(lastOrder.value?.orderNo ?? '')
    notifyForm.channelCode = String(lastOrder.value?.paymentChannelCode ?? orderForm.paymentChannelCode ?? '')
    notifyForm.thirdTradeNo = ''
    await loadOrders()
    flash(TEXT.orderCreated)
  })
}


async function sendNotify() {
  await guard(async () => {
    requireText(notifyForm.orderNo, TEXT.inputOrderNo)
    requireText(notifyForm.channelCode, TEXT.inputChannelCode)
    await notifyPayment(notifyForm.channelCode, { orderNo: notifyForm.orderNo, thirdTradeNo: notifyForm.thirdTradeNo || `MOCK-${Date.now()}` })
    await Promise.all([loadOrders(), loadCards()])
    flash(TEXT.notifyDone)
  })
}

async function runOrderQuery() {
  await guard(async () => {
    requireText(orderQueryForm.orderNo, TEXT.inputOrderNo)
    queriedOrder.value = await queryAdminOrder(orderQueryForm.orderNo)
    flash(TEXT.queryDone)
  })
}

async function viewOrderDetail(id: string) {
  await guard(async () => {
    orderDetail.value = await getOrderDetail(id)
    flash(TEXT.detailLoaded)
  })
}

async function filterOrders() {
  await guard(async () => {
    await loadOrders()
    flash(TEXT.orderFiltered)
  })
}

async function deleteSelectedOrders() {
  await guard(async () => {
    requirePositiveNumber(selectedOrderIds.value.length, TEXT.chooseOrdersFirst)
    const deletingIds = [...selectedOrderIds.value]
    const count = deletingIds.length
    await deleteOrders(deletingIds)
    clearOrderSelection()
    await loadOrders()
    if (orderDetail.value && deletingIds.includes(String(orderDetail.value.id ?? ''))) {
      orderDetail.value = null
    }
    flash(TEXT.ordersDeletedPrefix + count + TEXT.ordersDeletedSuffix)
  })
}

async function resendEmail(id: string) {
  await guard(async () => {
    await resendOrderEmail(id)
    if (orderDetail.value && String(orderDetail.value.id) === id) {
      orderDetail.value = await getOrderDetail(id)
    }
    flash(TEXT.resendQueued)
  })
}

async function batchResendEmails() {
  await guard(async () => {
    requirePositiveNumber(selectedOrderIds.value.length, TEXT.chooseOrdersFirst)
    const resendIds = [...selectedOrderIds.value]
    const count = resendIds.length
    await batchResendOrderEmails(resendIds)
    await loadOrders()
    if (orderDetail.value && resendIds.includes(String(orderDetail.value.id ?? ''))) {
      orderDetail.value = await getOrderDetail(String(orderDetail.value.id))
    }
    clearOrderSelection()
    flash(TEXT.resendBatchQueuedPrefix + count + TEXT.resendBatchQueuedSuffix)
  })
}

function openManualDeliver(id: string) {
  manualDeliverOrderId.value = id
  const currentOrder = orders.value.find((item) => item.id === id)
  const detailMatch = orderDetail.value && String(orderDetail.value.id ?? '') === id ? (orderDetail.value as any) : null
  manualDeliverContent.value = String(detailMatch?.manualDeliveryContent ?? currentOrder?.manualDeliveryContent ?? detailMatch?.product?.content ?? currentOrder?.product?.content ?? '').trim()
  manualDeliverModalVisible.value = true
}

function closeManualDeliver() {
  manualDeliverModalVisible.value = false
  manualDeliverOrderId.value = ''
  manualDeliverContent.value = ''
}

async function manualDeliver() {
  await guard(async () => {
    requireText(manualDeliverContent.value, TEXT.manualDeliveryContentRequired)
    orderDetail.value = (await manualDeliverOrder(manualDeliverOrderId.value, manualDeliverContent.value.trim())) as Record<string, unknown>
    await loadOrders()
    closeManualDeliver()
    flash(TEXT.manualDelivered)
  })
}

async function retryOrderMail(logId: string, orderId?: string) {
  await guard(async () => {
    await retryMailLog(logId)
    if (orderId) {
      orderDetail.value = await getOrderDetail(orderId)
    }
    flash(TEXT.mailRetryQueued)
  })
}

async function savePayment() {
  await guard(async () => {
    const driverFields = paymentDriverFields[paymentForm.driver] ?? []
    for (const field of driverFields) {
      if (field.required) {
        requireText(paymentForm.configValues?.[field.key], `${field.label}不能为空`)
      }
    }
    const configJson = buildPaymentConfigJson(paymentForm.driver, paymentForm.configValues ?? {}, String(paymentForm.configJson ?? '{}'))
    requireJsonText(configJson, TEXT.paymentJsonRequired)
    const payload = { ...paymentForm, configJson, sort: Number(paymentForm.sort) }
    payload.notifyUrl = String(payload.notifyUrl ?? '').trim()
    payload.returnUrl = String(payload.returnUrl ?? '').trim()
    if (!payload.notifyUrl) delete (payload as Record<string, unknown>).notifyUrl
    if (!payload.returnUrl) delete (payload as Record<string, unknown>).returnUrl
    delete (payload as Record<string, unknown>).configValues
    const isEditing = Boolean(editingPaymentId.value)
    if (isEditing) await updatePaymentChannel(editingPaymentId.value, payload)
    else await createPaymentChannel(payload)
    resetPaymentEdit()
    await loadPaymentChannels()
    paymentSaveVersion.value += 1
    flash(isEditing ? TEXT.paymentUpdated : TEXT.paymentCreated)
  })
}

function editPayment(item: PaymentChannel) {
  editingPaymentId.value = item.id
  const configJson = JSON.stringify(item.configJson ?? {})
  Object.assign(paymentForm, { ...emptyPayment(), name: item.name, code: item.code, driver: item.driver, configJson, configValues: parsePaymentConfig(item.configJson ?? {}), notifyUrl: item.notifyUrl ?? '', returnUrl: item.returnUrl ?? '', sort: Number(item.sort ?? 0), status: item.status })
}

async function toggleChannel(item: PaymentChannel) {
  await guard(async () => {
    await patchPaymentChannelStatus(item.id, !item.status)
    await loadPaymentChannels()
    flash(TEXT.paymentStatusUpdated)
  })
}

async function deletePayment(id: string) {
  await guard(async () => {
    await removePaymentChannel(id)
    if (editingPaymentId.value === id) resetPaymentEdit()
    await loadPaymentChannels()
    flash(TEXT.paymentDeleted)
  })
}

async function saveMail() {
  await guard(async () => {
    requireText(mailForm.name, TEXT.mailNameRequired)
    requireText(mailForm.eventCode, TEXT.mailEventRequired)
    requireText(mailForm.subject, TEXT.mailSubjectRequired)
    const payload = { ...mailForm, status: Boolean(mailForm.status) }
    const isEditing = Boolean(editingMailId.value)
    if (isEditing) await updateMailTemplate(editingMailId.value, payload)
    else await createMailTemplate(payload)
    resetMailEdit()
    await loadMailTemplates()
    mailSaveVersion.value += 1
    flash(isEditing ? TEXT.mailUpdated : TEXT.mailCreated)
  })
}

function editMail(item: MailTemplate) {
  editingMailId.value = item.id
  Object.assign(mailForm, { ...emptyMail(), name: item.name, eventCode: item.eventCode, subject: item.subject, content: item.content ?? '', status: item.status })
}

async function toggleMail(item: MailTemplate) {
  await guard(async () => {
    await updateMailTemplate(item.id, { name: item.name, eventCode: item.eventCode, subject: item.subject, content: item.content ?? '', status: !item.status })
    await loadMailTemplates()
    flash(TEXT.mailUpdated)
  })
}

async function deleteMail(id: string) {
  await guard(async () => {
    await removeMailTemplate(id)
    if (editingMailId.value === id) resetMailEdit()
    await loadMailTemplates()
    flash(TEXT.mailDeleted)
  })
}

async function saveConfig() {
  await guard(async () => {
    requireText(configForm.configKey, TEXT.configKeyRequired)
    await saveSystemConfig(configForm)
    Object.assign(configForm, emptyConfig())
    await loadSystemConfigs()
    configSaveVersion.value += 1
    flash(TEXT.configSaved)
  })
}

async function refreshByRoute(path: string) {
  switch (path) {
    case '/catalog':
      await guard(async () => {
        await Promise.all([loadCategories(), loadProducts()])
        flash(TEXT.refreshedCurrent)
      })
      break
    case '/cards':
      await guard(async () => {
        await loadCards()
        flash(TEXT.refreshedCurrent)
      })
      break
    case '/coupons':
      await guard(async () => {
        await loadCoupons()
        flash(TEXT.refreshedCurrent)
      })
      break
    case '/orders':
      await guard(async () => {
        await loadOrders()
        flash(TEXT.refreshedCurrent)
      })
      break
    case '/payments':
      await guard(async () => {
        await loadPaymentChannels()
        flash(TEXT.refreshedCurrent)
      })
      break
    case '/mails':
      await guard(async () => {
        await loadMailTemplates()
        flash(TEXT.refreshedCurrent)
      })
      break
    case '/system':
      await guard(async () => {
        await loadSystemConfigs()
        flash(TEXT.refreshedCurrent)
      })
      break
    default:
      await guard(async () => {
        await loadAll()
        flash(TEXT.refreshedAll)
      })
      break
  }
}

function exportOrdersCsv() {
  downloadCsv(`orders-${Date.now()}.csv`, [
    [TEXT.csvOrderNo, TEXT.csvProduct, TEXT.csvEmail, TEXT.csvStatus, TEXT.csvPayPrice, TEXT.csvPaymentChannel, TEXT.csvCreatedAt],
    ...orders.value.map((item) => [item.orderNo, item.product?.name ?? item.orderName ?? '', item.email, item.status, item.payPrice, item.paymentChannelCode ?? '', item.createdAt ?? '']),
  ])
}

function exportCardsCsv() {
  const selected = selectedCardIds.value.length ? cards.value.filter((item) => selectedCardIds.value.includes(item.id)) : cards.value
  downloadCsv(`cards-${Date.now()}.csv`, [
    [TEXT.csvProduct, TEXT.csvBatch, TEXT.csvStatus, TEXT.csvCardSecret, TEXT.csvOrderNo],
    ...selected.map((item) => [item.product?.name ?? '', item.batch?.batchName ?? '', item.status, item.cardSecret, item.soldOrder?.orderNo ?? '']),
  ])
}

setUnauthorizedHandler(() => clearSession())

export function useAdminState() {
  return {
    loading,
    message,
    messageType,
    token,
    loggedIn,
    profile,
    initialized,
    stats,
    categories,
    products,
    cards,
    coupons,
    orders,
    paymentChannels,
    mailTemplates,
    systemConfigs,
    lastOrder,
    queriedOrder,
    orderDetail,
    selectedCardIds,
    selectedCouponIds,
    selectedProductIds,
    selectedOrderIds,
    editingCategoryId,
    editingProductId,
    editingCouponId,
    editingPaymentId,
    editingMailId,
    cardImportVersion,
    cardEditVersion,
    categorySaveVersion,
    productSaveVersion,
    couponSaveVersion,
    paymentSaveVersion,
    mailSaveVersion,
    configSaveVersion,
    loginForm,
    categoryForm,
    productForm,
    cardForm,
    cardEditForm,
    cardFilter,
    couponForm,
    orderForm,
    orderFilter,
    notifyForm,
    orderQueryForm,
    paymentForm,
    mailForm,
    configForm,
    manualDeliverModalVisible,
    manualDeliverOrderId,
    manualDeliverContent,
    initializeSession,
    loadAll,
    login,
    logout,
    flash,
    resetCategoryEdit,
    resetProductEdit,
    resetCouponEdit,
    resetPaymentEdit,
    resetMailEdit,
    clearCardSelection,
    clearCouponSelection,
    clearProductSelection,
    clearOrderSelection,
    resetCardEdit,
    closeOrderDetail,
    openManualDeliver,
    closeManualDeliver,
    toggleCardSelection,
    toggleAllCards,
    toggleCouponSelection,
    toggleAllCoupons,
    toggleProductSelection,
    toggleAllProducts,
    toggleOrderSelection,
    toggleAllOrders,
    saveCategory,
    editCategory,
    toggleCategory,
    deleteCategory,
    saveProduct,
    editProduct,
    toggleProduct,
    deleteProduct,
    batchUnlistProducts,
    deleteSelectedProducts,
    uploadProductCover,
    importCards,
    filterCards,
    editCard,
    saveCardEdit,
    deleteCard,
    updateCardStatus,
    batchUpdateCardStatus,
    batchDeleteCards,
    saveCoupon,
    editCoupon,
    toggleCoupon,
    deleteCoupon,
    batchToggleCoupons,
    deleteSelectedCoupons,
    createOrder,
    sendNotify,
    runOrderQuery,
    viewOrderDetail,
    filterOrders,
    deleteSelectedOrders,
    resendEmail,
    batchResendEmails,
    manualDeliver,
    retryOrderMail,
    savePayment,
    editPayment,
    toggleChannel,
    deletePayment,
    saveMail,
    editMail,
    toggleMail,
    deleteMail,
    saveConfig,
    refreshByRoute,
    exportOrdersCsv,
    exportCardsCsv,
  }
}









