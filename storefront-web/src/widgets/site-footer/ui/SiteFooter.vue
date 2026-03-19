<script setup lang="ts">
import type { SiteBootstrap } from '@/entities/site/model/types'
import { NText } from 'naive-ui'

defineProps<{
  site: SiteBootstrap
}>()
</script>

<template>
  <footer class="site-footer card-surface">
    <div class="site-footer__inner">
      <NText depth="3">{{ site.siteName || 'CardVerse Store' }}</NText>
      <NText depth="3">联系邮箱：{{ site.supportEmail || '-' }}</NText>
      <NText depth="3">备案号：{{ site.icpNo || '-' }}</NText>
    </div>
  </footer>
</template>
