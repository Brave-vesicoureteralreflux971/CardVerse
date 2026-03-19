import { computed, ref } from 'vue';
import type { CategoryItem } from '@/entities/category/model/types';

export function useProductSearch() {
  const keyword = ref('');
  const activeCategoryId = ref('');

  const categoryOptions = ref<CategoryItem[]>([]);
  const normalizedKeyword = computed(() => keyword.value.trim());

  return {
    keyword,
    activeCategoryId,
    categoryOptions,
    normalizedKeyword,
  };
}

