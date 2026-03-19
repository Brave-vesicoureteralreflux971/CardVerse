export type PaymentConfigFieldOption = {
  label: string;
  value: string;
};

export type PaymentConfigField = {
  key: string;
  label: string;
  type?: 'text' | 'password' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  hint?: string;
  options?: PaymentConfigFieldOption[];
};

const tokenPayCurrencyOptions: PaymentConfigFieldOption[] = [
  { label: 'TRX', value: 'TRX' },
  { label: 'USDT TRC20', value: 'USDT_TRC20' },
  { label: 'ETH', value: 'EVM_ETH_ETH' },
  { label: 'USDT ERC20', value: 'EVM_ETH_USDT_ERC20' },
  { label: 'USDC ERC20', value: 'EVM_ETH_USDC_ERC20' },
  { label: 'BNB', value: 'EVM_BSC_BNB' },
  { label: 'USDT BEP20', value: 'EVM_BSC_USDT_BEP20' },
  { label: 'USDC BEP20', value: 'EVM_BSC_USDC_BEP20' },
  { label: 'POL', value: 'EVM_Polygon_POL' },
  { label: 'USDT Polygon', value: 'EVM_Polygon_USDT_ERC20' },
  { label: 'USDC Polygon', value: 'EVM_Polygon_USDC_ERC20' },
];

export const paymentDriverOptions = [
  { label: '模拟支付 (MOCK)', value: 'MOCK' },
  { label: 'TokenPay (TOKENPAY)', value: 'TOKENPAY' },
  { label: '微信支付 (WXPAY)', value: 'WXPAY' },
];

export const paymentDriverFields: Record<string, PaymentConfigField[]> = {
  MOCK: [],
  TOKENPAY: [
    {
      key: 'baseUrl',
      label: '接口地址',
      required: true,
      placeholder: '例如 https://pay.example.com',
      hint: 'TokenPay 服务地址，不需要包含 /CreateOrder。',
    },
    {
      key: 'secretKey',
      label: '签名密钥',
      type: 'password',
      required: true,
    },
    {
      key: 'currency',
      label: '币种',
      type: 'select',
      required: true,
      hint: '请直接选择 TokenPay 支持的标准币种参数，不要手填别名。',
      options: tokenPayCurrencyOptions,
    },
  ],
  WXPAY: [
    {
      key: 'appId',
      label: '应用 AppId',
      required: true,
    },
    {
      key: 'mchId',
      label: '商户号 MchId',
      required: true,
    },
    {
      key: 'mode',
      label: '支付模式',
      placeholder: '默认 NATIVE，可选 JSAPI / APP',
    },
    {
      key: 'apiV3Key',
      label: 'APIv3 Key',
      type: 'password',
      required: true,
    },
    {
      key: 'serialNo',
      label: '商户证书序列号',
      required: true,
    },
    {
      key: 'privateKey',
      label: '商户私钥',
      type: 'textarea',
      required: true,
    },
    {
      key: 'platformCert',
      label: '平台证书',
      type: 'textarea',
      hint: '如果你后续采用平台证书验签，可直接放在这里。',
    },
  ],
};

export function parsePaymentConfig(value: unknown) {
  if (!value) {
    return {} as Record<string, string>;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, item]) => {
      acc[key] = item == null ? '' : String(item);
      return acc;
    }, {});
  }

  return {} as Record<string, string>;
}

export function buildPaymentConfigJson(
  driver: string,
  configValues: Record<string, string>,
  rawJson: string,
) {
  const fields = paymentDriverFields[driver];
  if (!fields) {
    return rawJson || '{}';
  }

  const payload = fields.reduce<Record<string, string>>((acc, field) => {
    const value = String(configValues[field.key] ?? '').trim();
    if (value) {
      acc[field.key] = value;
    }
    return acc;
  }, {});

  return JSON.stringify(payload);
}
