<script setup lang="ts">
import PaymentsPageView from './payments/PaymentsPageView.vue';
import { useAdminState } from '../composables/useAdminState';
const admin = useAdminState();
</script>
<template>
  <PaymentsPageView
    v-model:payment-form="admin.paymentForm"
    :loading="admin.loading.value"
    :editing-payment-id="admin.editingPaymentId.value"
    :save-version="admin.paymentSaveVersion.value"
    :payment-channels="admin.paymentChannels.value"
    @save-payment="admin.savePayment"
    @edit-payment="admin.editPayment"
    @toggle-channel="admin.toggleChannel"
    @delete-payment="admin.deletePayment"
    @reset-payment="admin.resetPaymentEdit"
  />
</template>