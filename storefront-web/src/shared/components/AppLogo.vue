<script setup lang="ts">
import { resolveAssetUrl } from '@/shared/utils/asset';

defineProps<{
  siteName: string;
  siteLogo?: string;
}>();
</script>

<template>
  <div class="site-brand">
    <img v-if="siteLogo" :src="resolveAssetUrl(siteLogo)" :alt="siteName" class="site-brand__logo-image" />
    <div v-else class="site-brand__logo-fallback">{{ siteName.slice(0, 1).toUpperCase() }}</div>
    <div class="site-brand__copy">
      <strong class="site-brand__name">{{ siteName }}</strong>
      <span class="site-brand__hint">Consumer storefront</span>
    </div>
  </div>
</template>

