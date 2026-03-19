import { api } from '@/shared/api/client';

export interface PaymentCreateResult {
  orderNo: string;
  amount: string | number;
  paymentChannelCode?: string;
  paymentUrl?: string | null;
  redirectUrl?: string | null;
  gatewayUrl?: string | null;
  returnUrl?: string | null;
  message?: string;
}

export function createPayment(orderNo: string) {
  return api<PaymentCreateResult>(`/payments/create/${orderNo}`, {
    method: 'POST',
  });
}
