<script setup lang="ts">
import { SearchOutline } from '@vicons/ionicons5';
import { NIcon, NInput } from 'naive-ui';

const value = defineModel<string>('value', { default: '' });

defineProps<{
  placeholder?: string;
}>();

const emit = defineEmits<{
  submit: [];
}>();
</script>

<template>
  <NInput
    class="product-search-input"
    v-model:value="value"
    round
    clearable
    size="large"
    :placeholder="placeholder ?? '输入关键词搜索...'"
    @keyup.enter="emit('submit')"
  >
    <template #prefix>
      <NIcon><SearchOutline /></NIcon>
    </template>
  </NInput>
</template>
