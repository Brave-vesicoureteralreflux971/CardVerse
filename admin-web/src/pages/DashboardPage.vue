<script setup lang="ts">
import { NCard } from 'naive-ui';
import { useAdminState } from '../composables/useAdminState';
const admin = useAdminState();
</script>
<template>
  <section class="stats-grid">
    <NCard v-for="item in admin.stats.value" :key="item.label" class="stat-card" :bordered="false">
      <p class="muted small">{{ item.label }}</p>
      <strong>{{ item.value }}</strong>
    </NCard>
  </section>
</template>