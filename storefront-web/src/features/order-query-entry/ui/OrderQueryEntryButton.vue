<script setup lang="ts">
import { NButton } from 'naive-ui';
import { useRouter } from 'vue-router';
import { APP_ROUTES } from '@/shared/constants/routes';

const router = useRouter();
</script>

<template>
  <NButton tertiary type="primary" round @click="router.push(APP_ROUTES.orderQuery)">
    查询订单
  </NButton>
</template>

