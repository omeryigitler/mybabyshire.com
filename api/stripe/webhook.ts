import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { sendPaymentConfirmedEmail } from '../_lib/email.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' }) : null;

const readRawBody = async (req: VercelRequest) => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const parseJson = (value?: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const sendConfirmationForOrder = async (order: any) => {
  const snapshot = parseJson(order.personalization_data_json);
  await sendPaymentConfirmedEmail({
    to: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    total: Number(order.total_amount) || 0,
    paymentProvider: 'Stripe',
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

  if (!stripe || !webhookSecret) {
    return res.status(500).json({ error: 'Stripe webhook is not configured.' });
  }

  const signature = req.headers['stripe-signature'];

  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ error: 'Missing Stripe signature.' });
  }

  try {
    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      const orderNumber = session.metadata?.orderNumber;

      let updatedOrder = null;

      if (orderId) {
        updatedOrder = await prisma.orders.update({
          where: { id: orderId },
          data: {
            payment_status: 'paid',
            payment_reference: session.id,
            order_status: 'processing',
          },
          include: { items: true },
        });
      } else if (orderNumber) {
        updatedOrder = await prisma.orders.update({
          where: { order_number: orderNumber },
          data: {
            payment_status: 'paid',
            payment_reference: session.id,
            order_status: 'processing',
          },
          include: { items: true },
        });
      }

      if (updatedOrder) {
        await sendConfirmationForOrder(updatedOrder);
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await prisma.orders.update({
          where: { id: orderId },
          data: {
            payment_status: 'pending',
            payment_reference: session.id,
          },
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(400).json({
      error: 'Webhook verification failed',
      details: (error as Error).message,
    });
  }
}
