import { api } from '@/shared/api/client';

export interface CreateOrderPayload {
  productId: number;
  email: string;
  quantity?: number;
  couponCode?: string;
  paymentChannelCode?: string;
  cfTurnstileToken?: string;
}

export interface CreateOrderResult {
  id: string;
  orderNo: string;
  email: string;
  payPrice: string | number;
  paymentChannelCode?: string;
  queryPassword: string;
  requiresPayment?: boolean;
  message?: string;
}

export interface OrderQueryPayload {
  queryPassword: string;
  cfTurnstileToken?: string;
}

export interface OrderQueryResult {
  orderNo: string;
  orderName?: string;
  status: string;
  email: string;
  payPrice: string | number;
  paymentChannelCode?: string;
  deliveredAt?: string;
  createdAt?: string;
  product?: {
    name?: string;
  };
  paymentRecords?: Array<{
    id: string;
    thirdTradeNo?: string | null;
    paidAt?: string | null;
    paymentChannel?: {
      name?: string;
    } | null;
  }>;
  mailLogs?: Array<{
    id: string;
    eventCode?: string;
    sendStatus?: string;
    errorMessage?: string | null;
    sentAt?: string | null;
    createdAt?: string;
  }>;
  deliveryRecords?: Array<{
    id: string;
    deliveryType?: string;
    content: string;
    createdAt?: string | null;
  }>;
  orderCards?: Array<{
    id: string;
    cardSnapshot: string;
  }>;
}

export function createOrder(payload: CreateOrderPayload) {
  return api<CreateOrderResult>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function queryOrder(orderNo: string, payload: OrderQueryPayload) {
  return api<OrderQueryResult>(`/orders/${orderNo}/query`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
