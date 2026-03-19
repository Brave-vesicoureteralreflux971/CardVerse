<script setup lang="ts">
import CouponsPageView from './coupons/CouponsPageView.vue';
import { useAdminState } from '../composables/useAdminState';
const admin = useAdminState();
</script>
<template>
  <CouponsPageView
    v-model:coupon-form="admin.couponForm"
    :loading="admin.loading.value"
    :editing-coupon-id="admin.editingCouponId.value"
    :coupons="admin.coupons.value"
    :products="admin.products.value"
    :selected-coupon-ids="admin.selectedCouponIds.value"
    :save-version="admin.couponSaveVersion.value"
    @save-coupon="admin.saveCoupon"
    @edit-coupon="admin.editCoupon"
    @toggle-coupon="admin.toggleCoupon"
    @delete-coupon="admin.deleteCoupon"
    @reset-coupon="admin.resetCouponEdit"
    @toggle-select="admin.toggleCouponSelection"
    @toggle-select-all="admin.toggleAllCoupons"
    @clear-selection="admin.clearCouponSelection"
    @batch-toggle-coupons="admin.batchToggleCoupons"
    @delete-selected-coupons="admin.deleteSelectedCoupons"
  />
</template>
