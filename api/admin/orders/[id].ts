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

const allowedOrderStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
const allowedPaymentStatuses = ['pending', 'paid', 'refunded'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req.headers.authorization);
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = String(req.query.id || '');

  if (!id) {
    return res.status(400).json({ error: 'Missing order id.' });
  }

  try {
    const { orderStatus, paymentStatus, trackingReference } = req.body;

    if (orderStatus && !allowedOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }

    if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status.' });
    }

    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: {
        order_status: orderStatus,
        payment_status: paymentStatus,
        tracking_reference: trackingReference || null,
      },
    });

    return res.status(200).json({
      id: updatedOrder.id,
      orderNumber: updatedOrder.order_number,
      orderStatus: updatedOrder.order_status,
      paymentStatus: updatedOrder.payment_status,
      trackingReference: updatedOrder.tracking_reference,
    });
  } catch (error) {
    return res.status(400).json({
      error: 'Failed to update order',
      details: (error as Error).message,
    });
  }
}
