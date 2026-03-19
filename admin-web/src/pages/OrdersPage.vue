<script setup lang="ts">
import OrdersPageView from './orders/OrdersPageView.vue';
import { useAdminState } from '../composables/useAdminState';

const admin = useAdminState();
</script>

<template>
  <OrdersPageView
    v-model:order-form="admin.orderForm"
    v-model:notify-form="admin.notifyForm"
    v-model:order-query-form="admin.orderQueryForm"
    v-model:order-filter="admin.orderFilter"
    :loading="admin.loading.value"
    :products="admin.products.value"
    :payment-channels="admin.paymentChannels.value"
    :orders="admin.orders.value"
    :last-order="admin.lastOrder.value"
    :queried-order="admin.queriedOrder.value"
    :order-detail="admin.orderDetail.value"
    :selected-order-ids="admin.selectedOrderIds.value"
    :manual-deliver-visible="admin.manualDeliverModalVisible.value"
    :manual-deliver-content="admin.manualDeliverContent.value"
    @create-order="admin.createOrder"
    @send-notify="admin.sendNotify"
    @query-order="admin.runOrderQuery"
    @resend-email="admin.resendEmail"
    @batch-resend-emails="admin.batchResendEmails"
    @open-manual-deliver="admin.openManualDeliver"
    @manual-deliver="admin.manualDeliver"
    @close-manual-deliver="admin.closeManualDeliver"
    @update:manual-deliver-content="admin.manualDeliverContent.value = $event"
    @retry-mail="admin.retryOrderMail"
    @filter-orders="admin.filterOrders"
    @export-orders="admin.exportOrdersCsv"
    @delete-selected-orders="admin.deleteSelectedOrders"
    @toggle-select="admin.toggleOrderSelection"
    @toggle-select-all="admin.toggleAllOrders"
    @clear-selection="admin.clearOrderSelection"
    @view-detail="admin.viewOrderDetail"
    @close-detail="admin.closeOrderDetail"
  />
</template>
