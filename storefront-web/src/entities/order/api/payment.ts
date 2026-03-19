import { api } from '@/shared/api/client';
import type { PaymentChannelItem } from '../model/payment';

export function fetchPublicPaymentChannels() {
  return api<PaymentChannelItem[]>('/payment-channels/public');
}

