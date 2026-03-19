import { PaymentChannel, Prisma } from '@prisma/client';

export type PaymentOrderContext = {
  id: bigint;
  orderNo: string;
  email: string;
  payPrice: Prisma.Decimal;
  paymentChannelCode: string | null;
};

export type PaymentNotifyPayload = Record<string, unknown>;

export interface PaymentDriver {
  readonly code: string;
  createPayment(order: PaymentOrderContext, channel: PaymentChannel): Promise<unknown>;
  handleNotify(channel: PaymentChannel, payload: PaymentNotifyPayload): Promise<unknown>;
}
