import type { VercelRequest, VercelResponse } from '@vercel/node';

type ShippingMethod = {
  id: string;
  label: string;
  description: string;
  carrier: string;
  service: string;
  estimatedDelivery: string;
  amount: number;
};

const shippingMethods: ShippingMethod[] = [
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

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    methods: shippingMethods,
    note: 'Rates are static for now and ready to be replaced with Shippo, EasyPost, USPS, UPS, or FedEx API rates later.',
  });
}

export { shippingMethods };
