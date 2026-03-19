<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { NButton, NIcon } from 'naive-ui';
import { MenuOutline, RefreshOutline } from '@vicons/ionicons5';
import { getMenuIcon, menu } from '../constants/menu';
import { useAdminState } from '../composables/useAdminState';
import { useResponsive } from '../composables/useResponsive';
import AppDrawerMenu from '../components/navigation/AppDrawerMenu.vue';
import AppSidebarMenu from '../components/navigation/AppSidebarMenu.vue';

const route = useRoute();
const router = useRouter();
const drawerOpen = ref(false);
const admin = useAdminState();
const responsive = useResponsive();
const title = computed(() => menu.find((item) => item.path === route.path)?.label ?? '后台');
const titleIcon = computed(() => getMenuIcon(route.path));

onMounted(async () => {
  if (!admin.initialized.value) {
    try {
      await admin.loadAll();
    } catch {
      router.push('/login');
    }
  }
});
</script>

<template>
  <div class="app-layout" :class="{ 'with-sidebar': !responsive.isMobile.value }">
    <AppSidebarMenu v-if="!responsive.isMobile.value" :items="menu" :username="String(admin.profile.value?.username ?? 'admin')" />
    <AppDrawerMenu v-else v-model:show="drawerOpen" :items="menu" :username="String(admin.profile.value?.username ?? 'admin')" />
    <main class="content single-column">
      <header class="topbar sticky-bar">
        <div class="topbar-actions left-actions">
          <NButton v-if="responsive.isMobile.value" tertiary @click="drawerOpen = true">
            <template #icon><NIcon><MenuOutline /></NIcon></template>
            菜单
          </NButton>
          <div class="title-wrap">
            <p class="eyebrow">Administration</p>
            <div class="title-row">
              <NIcon v-if="titleIcon" size="22"><component :is="titleIcon" /></NIcon>
              <h1>{{ title }}</h1>
            </div>
          </div>
        </div>
        <div class="topbar-actions">
          <NButton tertiary type="primary" :loading="admin.loading.value" @click="admin.refreshByRoute(route.path)">
            <template #icon><NIcon><RefreshOutline /></NIcon></template>
            刷新当前页面
          </NButton>
        </div>
      </header>
      <RouterView />
    </main>
  </div>
</template>
