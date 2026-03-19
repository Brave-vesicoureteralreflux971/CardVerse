import { api } from '@/shared/api/client';
import type { CategoryItem } from '../model/types';

export function fetchPublicCategories() {
  return api<CategoryItem[]>('/product-categories/public');
}

