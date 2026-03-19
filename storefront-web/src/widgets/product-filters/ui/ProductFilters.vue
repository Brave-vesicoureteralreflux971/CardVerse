<script setup lang="ts">
import type { CategoryItem } from '@/entities/category/model/types';
import CategoryFilterTabs from '@/features/category-filter/ui/CategoryFilterTabs.vue';
import ProductSearchInput from '@/features/product-search/ui/ProductSearchInput.vue';

const keyword = defineModel<string>('keyword', { default: '' });
const activeCategoryId = defineModel<string>('activeCategoryId', { default: '' });

defineProps<{
  categories: CategoryItem[];
}>();

const emit = defineEmits<{
  submit: [];
}>();
</script>

<template>
  <section class="product-filters-row">
    <div class="product-filters-panel">
      <div class="product-filters-panel__group">
        <span class="product-filters-panel__label">分类导航</span>
        <CategoryFilterTabs v-model:active-value="activeCategoryId" :categories="categories" />
      </div>
      <div class="product-filters-search">
        <span class="product-filters-panel__label">搜索商品</span>
        <ProductSearchInput v-model:value="keyword" @submit="emit('submit')" />
      </div>
    </div>
  </section>
</template>
