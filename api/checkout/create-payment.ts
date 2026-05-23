import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LW-${timestamp}-${random}`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer, items, subtotal, shipping, total, currency = 'USD' } = req.body;

    if (!customer?.name || !customer?.email || !customer?.address || !customer?.city || !customer?.state || !customer?.zip) {
      return res.status(400).json({ error: 'Missing customer shipping details.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your gift bag is empty.' });
    }

    const orderNumber = createOrderNumber();
    const customerSnapshot = {
      customer,
      subtotal: Number(subtotal) || 0,
      shipping: Number(shipping) || 0,
      total: Number(total) || 0,
      currency,
    };

    const order = await prisma.orders.create({
      data: {
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        total_amount: Number(total) || 0,
        currency,
        payment_status: 'pending',
        order_status: 'processing',
        personalization_data_json: JSON.stringify(customerSnapshot),
        items: {
          create: items.map((item: any) => ({
            product_id: item.productId,
            product_name_snapshot: item.name,
            quantity: Number(item.quantity) || 1,
            price_snapshot: Number(item.price) || 0,
            personalization_data_json: JSON.stringify(item.personalizationData || {}),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(200).json({
      success: true,
      orderId: order.order_number,
      databaseId: order.id,
      currency: order.currency,
      subtotal: Number(subtotal) || 0,
      shipping: Number(shipping) || 0,
      total: Number(order.total_amount) || 0,
      message: 'Order created. Stripe payment integration is the next step.',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Checkout setup failed',
      details: (error as Error).message,
    });
  }
}
