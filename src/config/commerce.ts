// Switch to dual only in a reviewed release after shipping, tax and payments are ready.
export type SalesChannelMode = 'etsy' | 'dual';
export const SALES_CHANNEL_MODE: SalesChannelMode = 'etsy' as SalesChannelMode;
export const ETSY_ONLY_MODE = SALES_CHANNEL_MODE === 'etsy';
export const ETSY_SHOP_URL = 'https://babyshirekids.etsy.com/';
export const ETSY_PURCHASES_URL = 'https://www.etsy.com/your/purchases';
export const DIRECT_CHECKOUT_MESSAGE = 'Website checkout is currently unavailable. Please purchase through our Etsy shop.';
export const canBuyDirect = (product: {source?: string}, mode: SalesChannelMode = SALES_CHANNEL_MODE) =>
  mode === 'dual' && product.source !== 'etsy';
