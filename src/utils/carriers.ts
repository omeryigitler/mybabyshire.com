export type TrackingProviderType = 'external_link' | 'api' | 'manual';

export type ShipmentStatus =
  | 'pending_payment'
  | 'paid'
  | 'order_confirmed'
  | 'preparing_shipment'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delayed'
  | 'exception'
  | 'cancelled';

export interface TrackingEvent {
  id?: string | number;
  status: string;
  description: string;
  location?: string | null;
  timestamp: string;
}

interface CarrierConfig {
  key: string;
  displayName: string;
  providerType: TrackingProviderType;
  aliases: string[];
  trackingUrl: (trackingNumber?: string | null) => string | null;
  customerNote: string;
}

const compact = (value: unknown) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const encodeTrackingNumber = (trackingNumber?: string | null) => encodeURIComponent(String(trackingNumber || '').trim());

export const CARRIER_CONFIGS: Record<string, CarrierConfig> = {
  usps: {
    key: 'usps',
    displayName: 'USPS',
    providerType: 'external_link',
    aliases: ['usps', 'united states postal service', 'postal service', 'ground advantage', 'priority mail'],
    trackingUrl: (trackingNumber) => {
      const number = encodeTrackingNumber(trackingNumber);
      return number ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${number}` : 'https://tools.usps.com/go/TrackConfirmAction_input';
    },
    customerNote: 'USPS tracking updates are available through the official USPS tracking page.',
  },
  ups: {
    key: 'ups',
    displayName: 'UPS',
    providerType: 'external_link',
    aliases: ['ups', 'united parcel service'],
    trackingUrl: (trackingNumber) => {
      const number = encodeTrackingNumber(trackingNumber);
      return number ? `https://www.ups.com/track?tracknum=${number}` : 'https://www.ups.com/track';
    },
    customerNote: 'UPS tracking updates are available through the official UPS tracking page.',
  },
  fedex: {
    key: 'fedex',
    displayName: 'FedEx',
    providerType: 'external_link',
    aliases: ['fedex', 'fedex express'],
    trackingUrl: (trackingNumber) => {
      const number = encodeTrackingNumber(trackingNumber);
      return number ? `https://www.fedex.com/fedextrack/?trknbr=${number}` : 'https://www.fedex.com/fedextrack/';
    },
    customerNote: 'FedEx tracking updates are available through the official FedEx tracking page.',
  },
  dhl: {
    key: 'dhl',
    displayName: 'DHL',
    providerType: 'external_link',
    aliases: ['dhl', 'dhl express'],
    trackingUrl: (trackingNumber) => {
      const number = encodeTrackingNumber(trackingNumber);
      return number ? `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${number}` : 'https://www.dhl.com/us-en/home/tracking.html';
    },
    customerNote: 'DHL tracking updates are available through the official DHL tracking page.',
  },
  easypost: {
    key: 'easypost',
    displayName: 'EasyPost',
    providerType: 'api',
    aliases: ['easypost', 'easy post'],
    trackingUrl: () => null,
    customerNote: 'Live carrier tracking can be connected later through EasyPost.',
  },
  aftership: {
    key: 'aftership',
    displayName: 'AfterShip',
    providerType: 'api',
    aliases: ['aftership', 'after ship'],
    trackingUrl: () => null,
    customerNote: 'Live carrier tracking can be connected later through AfterShip.',
  },
};

export const SHIPMENT_STATUS_OPTIONS: Array<{ value: ShipmentStatus; label: string }> = [
  { value: 'pending_payment', label: 'Payment Pending' },
  { value: 'paid', label: 'Order Confirmed' },
  { value: 'order_confirmed', label: 'Order Confirmed' },
  { value: 'preparing_shipment', label: 'Preparing Shipment' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'exception', label: 'Exception' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function normalizeCarrierKey(carrier?: string | null) {
  const value = compact(carrier);
  if (!value) return '';

  const match = Object.values(CARRIER_CONFIGS).find((config) => {
    const names = [config.key, config.displayName, ...config.aliases].map(compact);
    return names.includes(value);
  });

  return match?.key || value;
}

export function getCarrierDisplayName(carrier?: string | null) {
  const key = normalizeCarrierKey(carrier);
  return CARRIER_CONFIGS[key]?.displayName || String(carrier || 'Manual Carrier').trim();
}

export function getTrackingProviderType(carrier?: string | null): TrackingProviderType {
  const key = normalizeCarrierKey(carrier);
  return CARRIER_CONFIGS[key]?.providerType || 'manual';
}

export function getCarrierTrackingUrl(carrier?: string | null, trackingNumber?: string | null) {
  const key = normalizeCarrierKey(carrier);
  return CARRIER_CONFIGS[key]?.trackingUrl(trackingNumber) || null;
}

export function getShipmentStatusLabel(status?: string | null) {
  const normalized = String(status || '').trim().toLowerCase();
  const option = SHIPMENT_STATUS_OPTIONS.find((item) => item.value === normalized);
  if (option) return option.label;
  return String(status || 'Preparing Shipment').replace(/_/g, ' ');
}

export function getCarrierCustomerNote(carrier?: string | null) {
  const key = normalizeCarrierKey(carrier);
  return CARRIER_CONFIGS[key]?.customerNote || 'Tracking updates are managed manually by the Little Wonders team.';
}

export function mapOrderStatusToShipmentStatus(orderStatus?: string | null, paymentStatus?: string | null): ShipmentStatus {
  if (paymentStatus !== 'paid') return 'pending_payment';
  if (orderStatus === 'delivered') return 'delivered';
  if (orderStatus === 'shipped') return 'shipped';
  if (orderStatus === 'cancelled') return 'cancelled';
  return 'preparing_shipment';
}

export function buildManualTimeline(params: { orderNumber: string; paymentStatus?: string | null; orderStatus?: string | null; createdAt?: string | Date | null; trackingNumber?: string | null; carrier?: string | null }) {
  const createdAt = params.createdAt ? new Date(params.createdAt).toISOString() : new Date().toISOString();
  const events = [
    {
      status: params.paymentStatus === 'paid' ? 'order_confirmed' : 'pending_payment',
      description: params.paymentStatus === 'paid' ? `Order ${params.orderNumber} was confirmed.` : `Order ${params.orderNumber} is waiting for payment confirmation.`,
      timestamp: createdAt,
    },
  ];

  if (params.paymentStatus === 'paid') {
    events.unshift({ status: 'preparing_shipment', description: 'Your gift is being prepared by the Little Wonders team.', timestamp: new Date().toISOString() });
  }

  if (params.orderStatus === 'shipped') {
    events.unshift({ status: 'shipped', description: `${getCarrierDisplayName(params.carrier)} received the shipment information.`, timestamp: new Date().toISOString() });
  }

  if (params.orderStatus === 'delivered') {
    events.unshift({ status: 'delivered', description: 'Your order has been marked as delivered.', timestamp: new Date().toISOString() });
  }

  return events;
}
