import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { Buffer } from 'node:buffer';
import { sendPaymentConfirmedEmail } from '../_lib/email.js';

const prisma = new PrismaClient();

const getPayPalBaseUrl = () => {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
};

const getPayPalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to Vercel.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'PayPal access token could not be created.');
  }

  return data.access_token as string;
};

const sendPayPalConfirmationEmail = async (order: any) => {
  await sendPaymentConfirmedEmail({
    to: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    total: Number(order.total_amount) || 0,
    paymentProvider: 'PayPal',
    items: order.items?.map((item: any) => ({
      productName: item.product_name_snapshot,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price_snapshot) || 0,
    })) || [],
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, orderNumber } = req.body;

    if (!token || !orderNumber) {
      return res.status(400).json({ error: 'Missing PayPal token or order reference.' });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(token)}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.name || 'PayPal payment could not be captured.');
    }

    const isCompleted = data.status === 'COMPLETED';

    const updatedOrder = await prisma.orders.update({
      where: { order_number: orderNumber },
      data: {
        payment_status: isCompleted ? 'paid' : 'pending',
        order_status: 'processing',
        payment_reference: data.id || token,
      },
      include: { items: true },
    });

    if (isCompleted) {
      await sendPayPalConfirmationEmail(updatedOrder);
    }

    return res.status(200).json({
      success: true,
      status: data.status,
      orderNumber,
      paypalOrderId: data.id || token,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'PayPal capture failed',
      details: (error as Error).message,
    });
  }
}
