// Single source of truth for shipping options, shared by the storefront
// checkout UI and the server-side checkout/order logic.

export type ShippingMethod = {
  id: string;
  label: string;
  description: string;
  carrier: string;
  service: string;
  estimatedDelivery: string;
  amount: number;
};

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'us-standard',
    label: 'Standard Shipping',
    description: 'Reliable gift-ready delivery for most US addresses.',
    carrier: 'USPS',
    service: 'Ground Advantage',
    estimatedDelivery: '3-5 business days',
    amount: 6.95,
  },
  {
    id: 'us-priority',
    label: 'Priority Shipping',
    description: 'Faster delivery for time-sensitive gifts.',
    carrier: 'USPS',
    service: 'Priority Mail',
    estimatedDelivery: '2-3 business days',
    amount: 12.95,
  },
];

export const resolveShippingMethod = (requestedId?: string | null): ShippingMethod =>
  SHIPPING_METHODS.find((method) => method.id === String(requestedId || '').trim()) || SHIPPING_METHODS[0];
