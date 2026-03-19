<script setup lang="ts">
import { ContrastOutline, LogOutOutline, SunnyOutline } from '@vicons/ionicons5'
import type { MenuOption } from 'naive-ui'
import { NButton, NIcon, NMenu, NTag } from 'naive-ui'
import { h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminState } from '../../composables/useAdminState'
import { useTheme } from '../../composables/useTheme'
import type { MenuItem } from '../../types'

const props = defineProps<{
  items: MenuItem[]
  username?: string
}>()

const router = useRouter()
const route = useRoute()
const admin = useAdminState()
const theme = useTheme()

const options: MenuOption[] = props.items.map((item) => ({
  label: item.label,
  key: item.path,
  icon: item.icon
    ? () => h(NIcon, null, { default: () => h(item.icon!) })
    : undefined,
}))

function navigate(path: string) {
  router.push(path)
}

function logout() {
  admin.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="desktop-sidebar">
    <div class="drawer-head">
      <p class="eyebrow">Control Room</p>
      <h2>CardVerse Admin</h2>
      <NTag type="info" round>{{ username ?? 'admin' }} / 欢迎您</NTag>
    </div>
    <NMenu :value="route.path" :options="options" @update:value="navigate(String($event))" />
    <div class="menu-footer">
      <NButton quaternary block @click="theme.toggleTheme()">
        <template #icon>
          <NIcon>
            <component :is="theme.isDark.value ? SunnyOutline : ContrastOutline" />
          </NIcon>
        </template>
        {{ theme.isDark.value ? '白天模式' : '夜间模式' }}
      </NButton>
      <NButton secondary block @click="logout">
        <template #icon>
          <NIcon>
            <LogOutOutline />
          </NIcon>
        </template>
        退出
      </NButton>
    </div>
  </aside>
</template>
