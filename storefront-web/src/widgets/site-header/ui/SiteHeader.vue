<script setup lang="ts">
import AppLogo from '@/shared/components/AppLogo.vue'
import { useTheme } from '@/shared/composables/useTheme'
import { APP_ROUTES } from '@/shared/constants/routes'
import { DocumentTextOutline, HomeOutline, MoonOutline, SunnyOutline } from '@vicons/ionicons5'
import { NButton, NIcon } from 'naive-ui'
import { useRouter } from 'vue-router'

const props = defineProps<{
  siteName: string
  siteLogo?: string
}>()

const router = useRouter()
const theme = useTheme()
</script>

<template>
  <header class="site-header">
    <button class="site-header__left site-header__brand" type="button" @click="router.push(APP_ROUTES.home)">
      <AppLogo :site-name="props.siteName" :site-logo="props.siteLogo" />
    </button>
    <div class="site-header__right">
      <NButton class="site-header__home" tertiary round @click="router.push(APP_ROUTES.home)">
        <template #icon>
          <NIcon>
            <HomeOutline />
          </NIcon>
        </template>
        商品列表
      </NButton>
      <NButton class="site-header__query" secondary round type="primary" @click="router.push(APP_ROUTES.orderQuery)">
        <template #icon>
          <NIcon>
            <DocumentTextOutline />
          </NIcon>
        </template>
        查询订单
      </NButton>
      <NButton class="site-header__theme" quaternary circle @click="theme.toggleTheme()">
        <template #icon>
          <NIcon>
            <component :is="theme.isDark.value ? SunnyOutline : MoonOutline" />
          </NIcon>
        </template>
      </NButton>
    </div>
  </header>
</template>
