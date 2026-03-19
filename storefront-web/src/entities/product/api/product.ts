import { api } from '@/shared/api/client';
import type { ApiListQuery } from '@/shared/types/common';
import type { ProductItem } from '../model/types';

function toSearchParams(query: ApiListQuery) {
  const params = new URLSearchParams();

  if (query.keyword) {
    params.set('keyword', query.keyword);
  }

  if (query.categoryId) {
    params.set('categoryId', query.categoryId);
  }

  const suffix = params.toString();
  return suffix ? `?${suffix}` : '';
}

export function fetchProducts(query: ApiListQuery = {}) {
  return api<ProductItem[]>(`/products${toSearchParams(query)}`);
}

export function fetchProductBySlug(slug: string) {
  return api<ProductItem>(`/products/${slug}`);
}

