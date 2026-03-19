<script setup lang="ts">
import { fetchPublicCategories } from '@/entities/category/api/category'
import type { CategoryItem } from '@/entities/category/model/types'
import { fetchProducts } from '@/entities/product/api/product'
import type { ProductItem } from '@/entities/product/model/types'
import { fetchSiteBootstrap } from '@/entities/site/api/site'
import { setSiteCache, type SiteBootstrap } from '@/entities/site/model/types'
import ProductFilters from '@/widgets/product-filters/ui/ProductFilters.vue'
import ProductGrid from '@/widgets/product-grid/ui/ProductGrid.vue'
import { useMessage } from 'naive-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const keyword = ref('')
const activeCategoryId = ref('')
const categories = ref<CategoryItem[]>([])
const loading = ref(false)
const products = ref<ProductItem[]>([])
const soldProductCount = ref(0)
const site = ref<SiteBootstrap>({
  siteName: 'CardVerse Store',
  siteUrl: '',
  siteNotice: '',
  siteKeywords: '',
  siteLogo: '',
  supportEmail: '',
  icpNo: '',
  cloudflareTurnstileEnabled: false,
  cloudflareTurnstileSiteKey: '',
})

const heroNoticeHtml = computed(
  () =>
    site.value.siteNotice?.trim() ||
    '<p>欢迎来到本站，选择需要的商品后即可进入下单页面。</p>',
)

async function loadBootstrap() {
  const [siteData, categoryData] = await Promise.all([
    fetchSiteBootstrap(),
    fetchPublicCategories(),
  ])

  setSiteCache(siteData)
  site.value = siteData
  categories.value = categoryData
}

async function loadProducts() {
  loading.value = true

  try {
    products.value = await fetchProducts({
      keyword: keyword.value.trim() || undefined,
      categoryId: activeCategoryId.value || undefined,
    })
  } catch (error) {
    message.error(error instanceof Error ? error.message : '商品加载失败')
  } finally {
    loading.value = false
  }
}

function syncFromRoute() {
  keyword.value = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  activeCategoryId.value = typeof route.query.categoryId === 'string' ? route.query.categoryId : ''
}

function syncToRoute() {
  router.replace({
    path: '/',
    query: {
      ...(keyword.value.trim() ? { keyword: keyword.value.trim() } : {}),
      ...(activeCategoryId.value ? { categoryId: activeCategoryId.value } : {}),
    },
  })
}

watch(activeCategoryId, async () => {
  syncToRoute()
  await loadProducts()
})

onMounted(async () => {
  syncFromRoute()
  await loadBootstrap()
  await loadProducts()
})
</script>

<template>
  <section class="storefront-page stack-lg">
    <section class="storefront-hero">
      <div class="storefront-hero__content">
        <div class="storefront-hero__heading">
          <section class="storefront-hero__notice-panel">
            <span class="storefront-hero__notice-badge">公告</span>
            <div class="storefront-hero__notice-rich" v-html="heroNoticeHtml"></div>
          </section>
        </div>
        <div class="storefront-hero__highlights">
          <article class="hero-highlight-card hero-highlight-card--primary">
            <span>在售商品</span>
            <strong>{{ products.length || 0 }}</strong>
            <p>当前可直接浏览并下单的商品数量</p>
          </article>
          <article class="hero-highlight-card">
            <span>已售商品</span>
            <strong>{{ soldProductCount }}</strong>
            <p>暂未接入真实销量统计，后续可替换</p>
          </article>
          <article class="hero-highlight-card">
            <span>服务体验</span>
            <strong>24/7</strong>
            <p>下单后可立即通过订单查询查看状态</p>
          </article>
        </div>
      </div>
      <ProductFilters v-model:keyword="keyword" v-model:active-category-id="activeCategoryId" :categories="categories"
        @submit="syncToRoute(); loadProducts()" />
    </section>
    <ProductGrid :loading="loading" :products="products" />
  </section>
</template>
