<script setup lang="ts">
import { RouterView } from 'vue-router';
import { NConfigProvider, NMessageProvider, dateZhCN, zhCN } from 'naive-ui';
import { useTheme } from './composables/useTheme';

const theme = useTheme();
</script>

<template>
  <NConfigProvider :theme="theme.naiveTheme.value" :locale="zhCN" :date-locale="dateZhCN">
    <NMessageProvider>
      <div class="app-shell" :class="{ dark: theme.isDark.value }">
        <RouterView />
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>
