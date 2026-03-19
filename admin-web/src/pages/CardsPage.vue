<script setup lang="ts">
import CardsPageView from './cards/CardsPageView.vue';
import { useAdminState } from '../composables/useAdminState';

const admin = useAdminState();
</script>

<template>
  <CardsPageView
    v-model:card-form="admin.cardForm"
    v-model:card-edit-form="admin.cardEditForm"
    v-model:card-filter="admin.cardFilter"
    :loading="admin.loading.value"
    :products="admin.products.value"
    :cards="admin.cards.value"
    :selected-card-ids="admin.selectedCardIds.value"
    :import-version="admin.cardImportVersion.value"
    :edit-version="admin.cardEditVersion.value"
    @import-cards="admin.importCards"
    @filter-cards="admin.filterCards"
    @edit-card="admin.editCard"
    @save-card-edit="admin.saveCardEdit"
    @delete-card="admin.deleteCard"
    @reset-card-edit="admin.resetCardEdit"
    @update-status="admin.updateCardStatus"
    @toggle-select="admin.toggleCardSelection"
    @toggle-select-all="admin.toggleAllCards"
    @clear-selection="admin.clearCardSelection"
    @batch-update-status="admin.batchUpdateCardStatus"
    @batch-delete-cards="admin.batchDeleteCards"
    @export-cards="admin.exportCardsCsv"
  />
</template>
