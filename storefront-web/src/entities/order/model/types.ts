export interface OrderQueryPayload {
  queryPassword: string;
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

