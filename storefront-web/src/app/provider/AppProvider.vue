<script setup lang="ts">
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import { NConfigProvider, NMessageProvider, dateZhCN, zhCN } from 'naive-ui';
import { useTheme } from '@/shared/composables/useTheme';

const theme = useTheme();
const themeOverrides = computed(() => ({
  common: {
    primaryColor: '#1a73e8',
    primaryColorHover: '#1765cc',
    primaryColorPressed: '#1558b0',
    primaryColorSuppl: '#1a73e8',
    borderRadius: '20px',
    borderRadiusSmall: '14px',
    fontFamily: '"Google Sans", "Product Sans", "Segoe UI", "PingFang SC", sans-serif',
  },
  Button: {
    borderRadiusMedium: '999px',
    borderRadiusLarge: '999px',
    fontWeight: '600',
    colorPrimary: '#1a73e8',
    colorPrimaryHover: '#1765cc',
    colorPrimaryPressed: '#1558b0',
    textColorPrimary: '#ffffff',
  },
  Input: {
    borderRadius: '18px',
    boxShadowFocus: '0 0 0 4px rgba(26, 115, 232, 0.12)',
  },
  Card: {
    borderRadius: '28px',
  },
  Tag: {
    borderRadius: '999px',
  },
}));
</script>

<template>
  <NConfigProvider
    :theme="theme.naiveTheme.value"
    :theme-overrides="themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <NMessageProvider>
      <div class="storefront-app-shell" :class="{ dark: theme.isDark.value }">
        <RouterView />
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>
