import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import {
  buildManualTimeline,
  getCarrierCustomerNote,
  getCarrierDisplayName,
  getCarrierTrackingUrl,
  getShipmentStatusLabel,
  getTrackingProviderType,
  mapOrderStatusToShipmentStatus,
  normalizeCarrierKey,
} from '../src/utils/carriers.js';

const prisma = new PrismaClient();

const parseJson = (value?: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const safeQuery = (value: unknown) => String(value || '').trim().slice(0, 80);

const findOrder = async (query: string) => {
  const orderByNumber = await prisma.orders.findFirst({
    where: { order_number: { equals: query, mode: 'insensitive' } },
    include: { items: true },
  });

  if (orderByNumber) return orderByNumber;

  return prisma.orders.findFirst({
    where: { tracking_reference: { equals: query, mode: 'insensitive' } },
    include: { items: true },
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = safeQuery(req.query.query || req.query.order || req.query.tracking);

  if (!query) {
    return res.status(400).json({ error: 'Missing order or tracking reference.' });
  }

  try {
    const order = await findOrder(query);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const snapshot = parseJson(order.personalization_data_json) || {};
    const shippingMethod = snapshot.shippingMethod || null;
    const carrier = snapshot.carrier || shippingMethod?.carrier || 'USPS';
    const trackingNumber = order.tracking_reference || snapshot.trackingNumber || null;
    const shipmentStatus = snapshot.shipmentStatus || mapOrderStatusToShipmentStatus(order.order_status, order.payment_status);
    const trackingUrl = snapshot.trackingUrl || getCarrierTrackingUrl(carrier, trackingNumber);
    const trackingEvents = Array.isArray(snapshot.trackingEvents)
      ? snapshot.trackingEvents
      : buildManualTimeline({
          orderNumber: order.order_number,
          paymentStatus: order.payment_status,
          orderStatus: order.order_status,
          createdAt: order.created_at,
          trackingNumber,
          carrier,
        });

    return res.status(200).json({
      id: order.id,
      orderNumber: order.order_number,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      shipmentStatus,
      shipmentStatusLabel: getShipmentStatusLabel(shipmentStatus),
      shippingMethod: shippingMethod?.label || null,
      shippingService: shippingMethod?.service || null,
      estimatedDelivery: snapshot.estimatedDelivery || shippingMethod?.estimatedDelivery || null,
      carrier: getCarrierDisplayName(carrier),
      carrierKey: normalizeCarrierKey(carrier),
      trackingNumber,
      trackingReference: trackingNumber,
      trackingUrl,
      trackingProviderType: getTrackingProviderType(carrier),
      customerNote: getCarrierCustomerNote(carrier),
      lastUpdated: trackingEvents?.[0]?.timestamp || order.created_at,
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      createdAt: order.created_at,
      shippingCity: snapshot.customer?.city || null,
      shippingState: snapshot.customer?.state || null,
      items: order.items.map((item: any) => ({
        productName: item.product_name_snapshot,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price_snapshot) || 0,
        personalizationData: parseJson(item.personalization_data_json) || {},
      })),
      trackingEvents,
      liveTracking: {
        providerConnected: false,
        providerType: getTrackingProviderType(carrier),
        provider: getCarrierDisplayName(carrier),
        status: shipmentStatus,
        message: trackingUrl ? 'Official carrier tracking is available through the tracking link.' : 'Live carrier API is not connected yet. Updates are managed by Little Wonders.',
        events: [],
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Tracking lookup failed', details: (error as Error).message });
  }
}
