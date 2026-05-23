import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development';

const requireAdmin = (authorization?: string) => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing token');
  }

  const token = authorization.split(' ')[1];
  return jwt.verify(token, JWT_SECRET);
};

const parseJson = (value?: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const mapOrder = (order: any) => {
  const snapshot = parseJson(order.personalization_data_json);

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    totalAmount: Number(order.total_amount),
    currency: order.currency,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    paymentReference: order.payment_reference,
    trackingReference: order.tracking_reference,
    customer: snapshot?.customer || null,
    subtotal: snapshot?.subtotal || null,
    shipping: snapshot?.shipping || null,
    createdAt: order.created_at,
    items: order.items.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name_snapshot,
      quantity: item.quantity,
      price: Number(item.price_snapshot),
      personalizationData: parseJson(item.personalization_data_json) || {},
    })),
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req.headers.authorization);
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orders = await prisma.orders.findMany({
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json(orders.map(mapOrder));
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch orders',
      details: (error as Error).message,
    });
  }
}
