import type { PaymentChannel } from '../../types';
import { api } from '../client';

export function listPaymentChannels() {
  return api<PaymentChannel[]>('/admin/payment-channels');
}

export function createPaymentChannel(payload: unknown) {
  return api('/admin/payment-channels', { method: 'POST', body: JSON.stringify(payload) });
}

export function updatePaymentChannel(id: string, payload: unknown) {
  return api(`/admin/payment-channels/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function patchPaymentChannelStatus(id: string, status: boolean) {
  return api(`/admin/payment-channels/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function removePaymentChannel(id: string) {
  return api(`/admin/payment-channels/${id}`, { method: 'DELETE' });
}

export function notifyPayment(channelCode: string, payload: unknown) {
  return api(`/payments/notify/${channelCode}`, { method: 'POST', body: JSON.stringify(payload) });
}

