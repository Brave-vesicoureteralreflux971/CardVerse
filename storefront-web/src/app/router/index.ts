import { createRouter, createWebHistory } from 'vue-router';
import StorefrontLayout from '@/layouts/storefront-layout/ui/StorefrontLayout.vue';

const StorefrontPage = () => import('@/pages/storefront/ui/StorefrontPage.vue');
const ProductDetailPage = () => import('@/pages/product-detail/ui/ProductDetailPage.vue');
const OrderQueryPage = () => import('@/pages/order-query/ui/OrderQueryPage.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: StorefrontLayout,
      children: [
        { path: '', name: 'storefront-home', component: StorefrontPage },
        { path: 'products/:slug', name: 'product-detail', component: ProductDetailPage },
        { path: 'order/query', name: 'order-query', component: OrderQueryPage },
      ],
    },
  ],
});

export default router;

