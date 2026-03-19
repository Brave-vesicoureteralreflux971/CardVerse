<script setup lang="ts">
import { TrashOutline } from '@vicons/ionicons5';
import { NButton, NIcon, NPopconfirm } from 'naive-ui';

withDefaults(defineProps<{
  label: string;
  message: string;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
  text?: boolean;
  tertiary?: boolean;
  quaternary?: boolean;
  disabled?: boolean;
}>(), {
  size: 'small',
  type: 'error',
  text: false,
  tertiary: true,
  quaternary: false,
  disabled: false,
});

const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <NPopconfirm @positive-click="emit('confirm')">
    <template #trigger>
      <NButton class="table-action-button table-action-danger" :size="size" :type="type" :text="text" :tertiary="tertiary" :quaternary="quaternary" :disabled="disabled">
        <slot name="icon">
          <NIcon>
            <TrashOutline />
          </NIcon>
        </slot>
        <span>{{ label }}</span>
      </NButton>
    </template>
    {{ message }}
  </NPopconfirm>
</template>
