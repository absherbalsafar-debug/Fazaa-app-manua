export type PaymentGatewayId = "jeeb" | "floosk" | "jawali" | "mobily_money_internet" | "my_wallet" | "cash";
export type GatewayIntegrationStatus = "ready_for_connection" | "pending_configuration";
export type PaymentGatewayDescriptor = {
  wallet: PaymentGatewayId;
  displayName: string;
  logoUrl: string;
  integrationStatus: GatewayIntegrationStatus;
  checkoutMode: "api" | "manual";
  apiBaseUrlConfigured: boolean;
  merchantConfigured: boolean;
  connectionNote: string;
};

type GatewayConfig = {
  wallet: PaymentGatewayId;
  displayName: string;
  logoUrl: string;
  baseUrlEnv: string;
  merchantEnv: string;
  apiKeyEnv: string;
  webhookSecretEnv: string;
};

const GATEWAY_CONFIGS: GatewayConfig[] = [
  { wallet: "jeeb", displayName: "جيب", logoUrl: "/manus-storage/jaib_127bada4.png", baseUrlEnv: "JEEB_API_BASE_URL", merchantEnv: "JEEB_MERCHANT_ID", apiKeyEnv: "JEEB_API_KEY", webhookSecretEnv: "JEEB_WEBHOOK_SECRET" },
  { wallet: "floosk", displayName: "فلوسك", logoUrl: "/manus-storage/floosak_55a9486b.png", baseUrlEnv: "FLOOSAK_API_BASE_URL", merchantEnv: "FLOOSAK_MERCHANT_ID", apiKeyEnv: "FLOOSAK_API_KEY", webhookSecretEnv: "FLOOSAK_WEBHOOK_SECRET" },
  { wallet: "jawali", displayName: "جوالي", logoUrl: "/manus-storage/jawali_bd9f624a.png", baseUrlEnv: "JAWALI_API_BASE_URL", merchantEnv: "JAWALI_MERCHANT_ID", apiKeyEnv: "JAWALI_API_KEY", webhookSecretEnv: "JAWALI_WEBHOOK_SECRET" },
  { wallet: "mobily_money_internet", displayName: "موبايلي موني إنترنت", logoUrl: "/manus-storage/mobily-mony-internet_8bd92564.png", baseUrlEnv: "MOBILY_MONEY_API_BASE_URL", merchantEnv: "MOBILY_MONEY_MERCHANT_ID", apiKeyEnv: "MOBILY_MONEY_API_KEY", webhookSecretEnv: "MOBILY_MONEY_WEBHOOK_SECRET" },
  { wallet: "my_wallet", displayName: "محفظتي", logoUrl: "/manus-storage/my-wallet_77ba7845.png", baseUrlEnv: "MY_WALLET_API_BASE_URL", merchantEnv: "MY_WALLET_MERCHANT_ID", apiKeyEnv: "MY_WALLET_API_KEY", webhookSecretEnv: "MY_WALLET_WEBHOOK_SECRET" },
  { wallet: "cash", displayName: "كاش", logoUrl: "/manus-storage/cash_7ceda4f1.png", baseUrlEnv: "CASH_API_BASE_URL", merchantEnv: "CASH_MERCHANT_ID", apiKeyEnv: "CASH_API_KEY", webhookSecretEnv: "CASH_WEBHOOK_SECRET" },
];

function configured(config: GatewayConfig) {
  return Boolean(process.env[config.baseUrlEnv] && process.env[config.merchantEnv] && process.env[config.apiKeyEnv]);
}

export function getPaymentGatewayDescriptors(): PaymentGatewayDescriptor[] {
  return GATEWAY_CONFIGS.map((config) => {
    const isConfigured = configured(config);
    return {
      wallet: config.wallet,
      displayName: config.displayName,
      logoUrl: config.logoUrl,
      integrationStatus: "ready_for_connection",
      checkoutMode: isConfigured ? "api" : "manual",
      apiBaseUrlConfigured: Boolean(process.env[config.baseUrlEnv]),
      merchantConfigured: Boolean(process.env[config.merchantEnv]),
      connectionNote: isConfigured
        ? "بوابة الدفع المباشر جاهزة للتشغيل بعد اختبار الاتصال."
        : "المحفظة جاهزة؛ يتبقى إدخال رابط API وبيانات التاجر الرسمية.",
    };
  });
}

export function getPaymentGatewayConfig(wallet: PaymentGatewayId) {
  const config = GATEWAY_CONFIGS.find((item) => item.wallet === wallet);
  if (!config) return null;
  return {
    wallet: config.wallet,
    baseUrl: process.env[config.baseUrlEnv] ?? "",
    merchantId: process.env[config.merchantEnv] ?? "",
    apiKey: process.env[config.apiKeyEnv] ?? "",
    webhookSecret: process.env[config.webhookSecretEnv] ?? "",
  };
}

export function isPaymentGatewayConfigured(wallet: PaymentGatewayId) {
  const config = getPaymentGatewayConfig(wallet);
  return Boolean(config?.baseUrl && config.merchantId && config.apiKey);
}
