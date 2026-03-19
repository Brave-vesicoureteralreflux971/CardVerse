<script setup lang="ts">
import { computed } from 'vue';
import { NPagination, NSelect, NSpace, NTag } from 'naive-ui';

const props = withDefaults(
  defineProps<{
    page: number;
    pageSize: number;
    total: number;
    pageSizeOptions?: number[];
  }>(),
  {
    pageSizeOptions: () => [10, 20, 50, 100],
  },
);

const emit = defineEmits<{
  'update:page': [value: number];
  'update:pageSize': [value: number];
}>();

const options = computed(() => props.pageSizeOptions.map((item) => ({ label: `${item} / 页`, value: item })));
</script>

<template>
  <div class="pager">
    <NTag type="default" round>共 {{ total }} 条</NTag>
    <NSpace align="center" wrap>
      <NSelect :value="pageSize" :options="options" class="pager-select" @update:value="emit('update:pageSize', Number($event)); emit('update:page', 1)" />
      <NPagination :page="page" :page-size="pageSize" :item-count="total" simple @update:page="emit('update:page', $event)" />
    </NSpace>
  </div>
</template>
