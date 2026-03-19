import type { Category, Product } from '../../types';
import { api } from '../client';

export function listCategories() {
  return api<Category[]>('/admin/product-categories');
}

export function createCategory(payload: { name: string; sort: number; status: boolean }) {
  return api('/admin/product-categories', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateCategory(id: string, payload: { name: string; sort: number; status: boolean }) {
  return api(`/admin/product-categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function removeCategory(id: string) {
  return api(`/admin/product-categories/${id}`, { method: 'DELETE' });
}

export function listProducts() {
  return api<Product[]>('/admin/products');
}

export function createProduct(payload: unknown) {
  return api('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateProduct(id: string, payload: unknown) {
  return api(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function patchProductStatus(id: string, status: boolean) {
  return api(`/admin/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function batchUpdateProductsStatus(productIds: string[], status: boolean) {
  return api('/admin/products/batch-status', {
    method: 'POST',
    body: JSON.stringify({ productIds, status }),
  });
}

export function removeProduct(id: string) {
  return api(`/admin/products/${id}`, { method: 'DELETE' });
}

export function batchDeleteProducts(productIds: string[]) {
  return api('/admin/products/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ productIds }),
  });
}
