<script setup lang="ts">
import CatalogPageView from './catalog/CatalogPageView.vue';
import { useAdminState } from '../composables/useAdminState';
const admin = useAdminState();
</script>
<template>
  <CatalogPageView
    v-model:category-form="admin.categoryForm"
    v-model:product-form="admin.productForm"
    :loading="admin.loading.value"
    :editing-category-id="admin.editingCategoryId.value"
    :editing-product-id="admin.editingProductId.value"
    :category-save-version="admin.categorySaveVersion.value"
    :product-save-version="admin.productSaveVersion.value"
    :categories="admin.categories.value"
    :products="admin.products.value"
    :selected-product-ids="admin.selectedProductIds.value"
    @save-category="admin.saveCategory"
    @edit-category="admin.editCategory"
    @toggle-category="admin.toggleCategory"
    @delete-category="admin.deleteCategory"
    @reset-category="admin.resetCategoryEdit"
    @save-product="admin.saveProduct"
    @edit-product="admin.editProduct"
    @toggle-product="admin.toggleProduct"
    @delete-product="admin.deleteProduct"
    @reset-product="admin.resetProductEdit"
    @upload-cover="admin.uploadProductCover"
    @toggle-product-select="admin.toggleProductSelection"
    @toggle-all-products="admin.toggleAllProducts"
    @clear-product-selection="admin.clearProductSelection"
    @batch-unlist-products="admin.batchUnlistProducts"
    @delete-selected-products="admin.deleteSelectedProducts"
  />
</template>
