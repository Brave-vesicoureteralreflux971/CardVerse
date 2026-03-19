<script setup lang="ts">
import { NCard } from 'naive-ui';
import { useRouter } from 'vue-router';
import type { ProductItem } from '@/entities/product/model/types';
import { APP_ROUTES } from '@/shared/constants/routes';
import { resolveAssetUrl } from '@/shared/utils/asset';
import { formatPrice } from '@/shared/utils/format';

const props = defineProps<{
  product: ProductItem;
}>();

const router = useRouter();

function openDetail() {
  router.push(APP_ROUTES.productDetail(props.product.slug));
}
</script>

<template>
  <NCard class="product-card" :bordered="false" hoverable @click="openDetail">
    <div class="product-card__media">
      <img
        v-if="product.coverImage"
        :src="resolveAssetUrl(product.coverImage)"
        :alt="product.name"
        class="product-card__image"
      />
      <div v-else class="product-card__placeholder">{{ product.name.slice(0, 1).toUpperCase() }}</div>
    </div>
    <div class="product-card__body">
      <div class="product-card__meta">
        <span class="product-card__category">{{ product.category?.name || '精选商品' }}</span>
        <span class="product-card__stock">库存 {{ product.stock }}</span>
      </div>
      <p class="product-card__name">{{ product.name }}</p>
      <div class="product-card__footer">
        <p class="product-card__price">{{ formatPrice(product.price) }}</p>
        <span class="product-card__cta">查看详情</span>
      </div>
    </div>
  </NCard>
</template>
