import type { Coupon } from '../../types';
import { api } from '../client';

export function listCoupons() {
  return api<Coupon[]>('/admin/coupons');
}

export function createCoupon(payload: unknown) {
  return api('/admin/coupons', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateCoupon(id: string, payload: unknown) {
  return api(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function batchUpdateCouponsStatus(couponIds: string[], status: boolean) {
  return api('/admin/coupons/batch-status', {
    method: 'POST',
    body: JSON.stringify({ couponIds, status }),
  });
}

export function removeCoupon(id: string) {
  return api(`/admin/coupons/${id}`, { method: 'DELETE' });
}

export function batchDeleteCoupons(couponIds: string[]) {
  return api('/admin/coupons/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ couponIds }),
  });
}
