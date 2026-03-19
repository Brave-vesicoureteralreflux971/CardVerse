export const orderStatusMap: Record<string, string> = {
  PENDING: '待支付',
  PAID: '已支付',
  DELIVERED: '已发货',
  FAILED: '异常',
  CLOSED: '已关闭',
  REFUNDED: '已退款',
};

export const cardStatusMap: Record<string, string> = {
  UNUSED: '未售',
  LOCKED: '已锁定',
  SOLD: '已售出',
  INVALID: '已作废',
};

export const couponDiscountTypeMap: Record<string, string> = {
  FIXED: '固定减免',
  PERCENT: '百分比折扣',
};

export const deliveryTypeMap: Record<string, string> = {
  AUTO: '自动发货',
  MANUAL: '手动发货',
};

export const productTypeMap: Record<string, string> = {
  CARD: '卡密类',
  SUBSCRIPTION: '订阅类',
  CUSTOM: '自定义',
};

export const paymentRecordStatusMap: Record<string, string> = {
  PENDING: '待支付',
  SUCCESS: '支付成功',
  FAILED: '支付失败',
};

export const mailSendStatusMap: Record<string, string> = {
  PENDING: '待发送',
  SUCCESS: '发送成功',
  FAILED: '发送失败',
};

export const mailEventCodeMap: Record<string, string> = {
  ORDER_PAID: '订单支付通知',
  ORDER_DELIVERED: '订单发货通知',
  ORDER_RESEND: '订单补发通知',
};

export const mailEventOptions = Object.entries(mailEventCodeMap).map(([value, label]) => ({
  label: `${label} (${value})`,
  value,
}));

export const orderTemplateVariables = [
  { key: 'orderNo', label: '订单号' },
  { key: 'orderName', label: '订单名称' },
  { key: 'email', label: '下单邮箱' },
  { key: 'queryPassword', label: '订单查询密码' },
  { key: 'orderQueryUrl', label: '订单查询链接' },
  { key: 'quantity', label: '购买数量' },
  { key: 'totalPrice', label: '订单总价' },
  { key: 'payPrice', label: '实际支付价格' },
  { key: 'couponCode', label: '优惠码' },
  { key: 'couponDiscountAmount', label: '优惠金额' },
  { key: 'wholesaleDiscountAmount', label: '批发优惠金额' },
  { key: 'paymentChannelCode', label: '支付通道代码' },
  { key: 'paymentChannelName', label: '支付通道名称' },
  { key: 'buyerIp', label: '购买者 IP' },
  { key: 'thirdPartyOrderNo', label: '第三方订单号' },
  { key: 'productName', label: '商品名称' },
  { key: 'productType', label: '商品类型' },
  { key: 'deliveryType', label: '发货方式' },
  { key: 'cardList', label: '卡密列表' },
  { key: 'createdAt', label: '创建时间' },
  { key: 'paidAt', label: '支付时间' },
  { key: 'deliveredAt', label: '发货时间' },
].map((item) => ({
  ...item,
  token: `{{${item.key}}}`,
}));

export const paymentDriverMap: Record<string, string> = {
  MOCK: '模拟支付',
  TOKENPAY: 'TokenPay',
  WXPAY: '微信支付',
};

export function mapLabel(value: string | null | undefined, dict: Record<string, string>) {
  if (!value) {
    return '-';
  }

  return dict[value] ?? value;
}

export function mapCodeLabel(value: string | null | undefined, dict: Record<string, string>) {
  if (!value) {
    return '-';
  }

  const label = dict[value];
  return label ? `${label} (${value})` : value;
}

