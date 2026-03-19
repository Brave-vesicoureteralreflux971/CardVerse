<script setup lang="ts">
import { NEmpty, NSpin } from 'naive-ui';
import type { ProductItem } from '@/entities/product/model/types';
import ProductCard from './ProductCard.vue';

defineProps<{
  loading: boolean;
  products: ProductItem[];
}>();
</script>

<template>
  <section class="product-grid-block">
    <section class="product-grid-panel">
      <div class="product-grid-panel__header">
        <div>
          <h2>Browse products</h2>
          <p>精选数字商品卡片，按分类筛选后可直接进入下单流程。</p>
        </div>
        <span class="product-grid-panel__count">{{ products.length }} items</span>
      </div>
      <div v-if="loading" class="product-grid__loading">
        <NSpin size="large" />
      </div>
      <NEmpty v-else-if="!products.length" description="暂无商品" class="product-grid__empty" />
      <div v-else class="product-grid">
        <ProductCard v-for="item in products" :key="item.id" :product="item" />
      </div>
    </section>
  </section>
</template>
