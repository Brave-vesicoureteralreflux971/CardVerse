<script setup lang="ts">
import { ChatboxEllipsesOutline } from '@vicons/ionicons5';
import { NButton, NIcon, NText } from 'naive-ui';

defineProps<{
  notice?: string;
}>();
</script>

<template>
  <section class="notice-bar-row">
    <div class="notice-bar">
      <div class="notice-bar__badge">
        <NIcon><ChatboxEllipsesOutline /></NIcon>
        <span>公告</span>
      </div>
      <NText depth="3" class="notice-bar__text">
        {{ notice || '欢迎来到本站，选择需要的商品后即可进入下单页面。' }}
      </NText>
    </div>
  </section>
</template>
