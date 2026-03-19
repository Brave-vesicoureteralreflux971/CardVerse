<script setup lang="ts">
import { fetchSiteBootstrap } from '@/entities/site/api/site'
import { getSiteCache, setSiteCache, type SiteBootstrap } from '@/entities/site/model/types'
import { applySiteDocumentMeta } from '@/shared/utils/head'
import SiteFooter from '@/widgets/site-footer/ui/SiteFooter.vue'
import SiteHeader from '@/widgets/site-header/ui/SiteHeader.vue'
import { useMessage } from 'naive-ui'
import { onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'

const message = useMessage()
const site = ref<SiteBootstrap>(
  getSiteCache() ?? {
    siteName: 'CardVerse Store',
    siteUrl: '',
    siteNotice: '',
    siteKeywords: '',
    siteLogo: '',
    supportEmail: '',
    icpNo: '',
    cloudflareTurnstileEnabled: false,
    cloudflareTurnstileSiteKey: '',
  },
)

watch(
  site,
  (value) => {
    applySiteDocumentMeta(value)
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  if (getSiteCache()) {
    applySiteDocumentMeta(site.value)
    return
  }

  try {
    const data = await fetchSiteBootstrap()
    site.value = data
    setSiteCache(data)
    applySiteDocumentMeta(data)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '站点信息加载失败')
  }
})
</script>

<template>
  <div class="storefront-layout">
    <div class="storefront-layout__ambient">
      <span class="storefront-layout__orb storefront-layout__orb--blue"></span>
      <span class="storefront-layout__orb storefront-layout__orb--green"></span>
      <span class="storefront-layout__grid"></span>
    </div>
    <main class="storefront-main">
      <SiteHeader :site-name="site.siteName" :site-logo="site.siteLogo" />
      <RouterView />
      <SiteFooter :site="site" />
    </main>
  </div>
</template>
