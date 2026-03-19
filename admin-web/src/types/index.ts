import type { Component } from 'vue';
export type { SystemConfig, SystemConfigInput } from './system';

export type SectionKey =
  | 'dashboard'
  | 'catalog'
  | 'cards'
  | 'coupons'
  | 'orders'
  | 'payments'
  | 'mails'
  | 'system';

export type Category = { id: string; name: string; sort: number; status: boolean };
export type Product = {
  id: string;
  name: string;
  slug: string;
  coverImage?: string | null;
  type?: string;
  deliveryType?: string;
  description?: string;
  apiHook?: string;
  content?: string;
  price: string;
  wholesalePrice?: string | null;
  minQuantity?: number;
  maxQuantity?: number;
  manualStock?: number | null;
  stock?: number;
  status: boolean;
  categoryId?: string;
  category?: { id?: string; name: string };
};
export type Card = {
  id: string;
  status: string;
  cardSecret: string;
  productId?: string;
  product?: { id?: string; name: string; deliveryType?: string; content?: string | null };
  mailLogs?: Array<{ id: string; sendStatus: string; eventCode: string; sentAt?: string | null; errorMessage?: string | null }>;
  paymentRecords?: Array<Record<string, unknown>>;
  batch?: { batchName: string };
  soldOrder?: { orderNo: string } | null;
};
export type Coupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: string;
  minAmount?: string | null;
  totalLimit?: number | null;
  usedCount: number;
  startAt?: string | null;
  endAt?: string | null;
  status?: boolean;
  couponProducts?: Array<{ product: { id?: string; name: string } }>;
};
export type PaymentRecord = {
  id: string;
  status: string;
  amount?: string;
  thirdTradeNo?: string | null;
  paidAt?: string | null;
  paymentChannel?: { id?: string; name?: string; code?: string } | null;
};
export type OrderDeliveryRecord = {
  id: string;
  deliveryType: string;
  content: string;
  createdAt?: string | null;
};

export type Order = {
  id: string;
  orderNo: string;
  orderName?: string;
  email: string;
  status: string;
  totalPrice?: string;
  couponDiscountAmount?: string | null;
  wholesaleDiscountAmount?: string | null;
  payPrice: string;
  paymentChannelCode?: string | null;
  thirdPartyOrderNo?: string | null;
  queryPasswordPlain?: string | null;
  manualDeliveryContent?: string | null;
  createdAt?: string;
  paidAt?: string | null;
  product?: { id?: string; name: string; deliveryType?: string; content?: string | null; type?: string; status?: boolean };
  mailLogs?: Array<{ id: string; sendStatus: string; eventCode: string; sentAt?: string | null; errorMessage?: string | null }>;
  paymentRecords?: PaymentRecord[];
  orderCards?: Array<{ id?: string; cardSnapshot: string; card?: { cardSecret?: string | null } }>;
  deliveryRecords?: OrderDeliveryRecord[];
};
export type PaymentChannel = {
  id: string;
  name: string;
  code: string;
  driver: string;
  configJson?: unknown;
  notifyUrl?: string | null;
  returnUrl?: string | null;
  sort?: number;
  status: boolean;
};
export type MailTemplate = {
  id: string;
  name: string;
  eventCode: string;
  subject: string;
  content?: string;
  status: boolean;
};
export type MenuItem = { key: SectionKey; label: string; path: string; icon?: Component };

