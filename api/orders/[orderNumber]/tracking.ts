import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const parseJson = (value?: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orderNumber = String(req.query.orderNumber || '').trim();

  if (!orderNumber) {
    return res.status(400).json({ error: 'Missing order reference.' });
  }

  try {
    const order = await prisma.orders.findUnique({
      where: { order_number: orderNumber },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const snapshot = parseJson(order.personalization_data_json);

    return res.status(200).json({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      trackingReference: order.tracking_reference,
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      createdAt: order.created_at,
      shippingCity: snapshot?.customer?.city || '',
      shippingState: snapshot?.customer?.state || '',
      items: order.items.map((item) => ({
        productName: item.product_name_snapshot,
        quantity: item.quantity,
        price: Number(item.price_snapshot),
        personalizationData: parseJson(item.personalization_data_json) || {},
      })),
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Tracking lookup failed',
      details: (error as Error).message,
    });
  }
}
