import type { Order } from '../../types';
import { api } from '../client';

export function listOrders(query = '') {
  return api<Order[]>(`/admin/orders${query}`);
}

export function getOrderDetail(id: string) {
  return api<Record<string, unknown>>(`/admin/orders/${id}`);
}

export function queryAdminOrder(orderNo: string) {
  return api<Record<string, unknown>>(`/admin/orders/query/${orderNo}`);
}

export function resendOrderEmail(id: string) {
  return api(`/admin/orders/${id}/resend-email`, { method: 'POST' });
}

export function batchResendOrderEmails(orderIds: string[]) {
  return api('/admin/orders/batch-resend-email', {
    method: 'POST',
    body: JSON.stringify({ orderIds }),
  });
}

export function manualDeliverOrder(id: string, deliveryContent: string) {
  return api(`/admin/orders/${id}/manual-deliver`, { method: 'POST', body: JSON.stringify({ deliveryContent }) });
}

export function deleteOrders(orderIds: string[]) {
  return api('/admin/orders/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ orderIds }),
  });
}

export function createOrder(payload: unknown) {
  return api<Record<string, unknown>>('/orders', { method: 'POST', body: JSON.stringify(payload) });
}

export function queryOrder(orderNo: string, queryPassword: string) {
  return api<Record<string, unknown>>(`/orders/${orderNo}/query`, { method: 'POST', body: JSON.stringify({ queryPassword }) });
}
