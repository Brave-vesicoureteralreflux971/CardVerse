<script setup lang="ts">
import { CheckmarkCircle } from '@vicons/ionicons5';
import { NButton, NIcon, NSpace } from 'naive-ui';
import type { CategoryItem } from '@/entities/category/model/types';

const activeValue = defineModel<string>('activeValue', { default: '' });

defineProps<{
  categories: CategoryItem[];
}>();
</script>

<template>
  <NSpace class="category-filter-tabs" :wrap="true" size="small">
    <NButton class="category-filter-button" :type="activeValue === '' ? 'primary' : 'default'" round @click="activeValue = ''">
      <template v-if="activeValue === ''" #icon>
        <NIcon><CheckmarkCircle /></NIcon>
      </template>
      全部
    </NButton>
    <NButton
      v-for="item in categories"
      :key="item.id"
      class="category-filter-button"
      :type="activeValue === item.id ? 'primary' : 'default'"
      round
      @click="activeValue = item.id"
    >
      {{ item.name }}
    </NButton>
  </NSpace>
</template>
