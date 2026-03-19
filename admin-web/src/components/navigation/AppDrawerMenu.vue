<script setup lang="ts">
import { CloseOutline, ContrastOutline, LogOutOutline, SunnyOutline } from '@vicons/ionicons5'
import type { MenuOption } from 'naive-ui'
import { NButton, NDrawer, NDrawerContent, NIcon, NMenu, NTag } from 'naive-ui'
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminState } from '../../composables/useAdminState'
import { useTheme } from '../../composables/useTheme'
import type { MenuItem } from '../../types'

const props = defineProps<{
  show: boolean
  items: MenuItem[]
  username?: string
}>()

const emit = defineEmits<{ 'update:show': [value: boolean] }>()
const router = useRouter()
const route = useRoute()
const admin = useAdminState()
const theme = useTheme()

const options = computed<MenuOption[]>(() => props.items.map((item) => ({
  label: item.label,
  key: item.path,
  icon: item.icon ? () => h(NIcon, null, { default: () => h(item.icon!) }) : undefined,
})))

function navigate(path: string) {
  emit('update:show', false)
  router.push(path)
}

function logout() {
  emit('update:show', false)
  admin.logout()
  router.push('/login')
}
</script>

<template>
  <NDrawer :show="show" :width="248" placement="left" @update:show="emit('update:show', $event)">
    <NDrawerContent title="CardVerse Admin" closable>
      <div class="drawer-head">
        <p class="eyebrow">Control Room</p>
        <NTag type="info" round>{{ username ?? 'admin' }} / 欢迎您</NTag>
      </div>
      <NMenu :value="route.path" :options="options" @update:value="navigate(String($event))" />
      <template #footer>
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
          <NButton block quaternary @click="emit('update:show', false)">
            <template #icon>
              <NIcon>
                <CloseOutline />
              </NIcon>
            </template>
            关闭菜单
          </NButton>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
