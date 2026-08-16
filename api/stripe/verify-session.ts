import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { prisma } from '../../lib/prisma.js';
import { roundMoney } from '../../lib/checkout.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured.' });
  }

  const sessionId = String(req.query.session_id || '').trim();
  const orderNumber = String(req.query.order || '').trim();

  if (!sessionId || !orderNumber) {
    return res.status(400).json({ error: 'Missing Stripe session or order reference.' });
  }

  try {
    const [session, order] = await Promise.all([
      stripe.checkout.sessions.retrieve(sessionId),
      prisma.orders.findUnique({ where: { order_number: orderNumber } }),
    ]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const metadataOrderId = String(session.metadata?.orderId || '');
    const metadataOrderNumber = String(session.metadata?.orderNumber || '');

    if (
      session.id !== order.payment_reference ||
      metadataOrderId !== order.id ||
      metadataOrderNumber !== order.order_number
    ) {
      return res.status(409).json({ error: 'Stripe session does not match this order.' });
    }

    const paidAmount = Number(session.amount_total || 0) / 100;
    const expectedAmount = Number(order.total_amount || 0);
    const paidCurrency = String(session.currency || '').toUpperCase();
    const expectedCurrency = String(order.currency || 'USD').toUpperCase();

    if (roundMoney(paidAmount) !== roundMoney(expectedAmount) || paidCurrency !== expectedCurrency) {
      return res.status(409).json({ error: 'Stripe payment amount or currency does not match this order.' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(409).json({
        error: 'Stripe has not confirmed this payment yet.',
        paymentStatus: session.payment_status,
      });
    }

    return res.status(200).json({
      confirmed: true,
      orderNumber: order.order_number,
      paymentStatus: session.payment_status,
      fulfillmentStatus: order.payment_status,
    });
  } catch (error) {
    console.error('Stripe session verification failed', error);
    return res.status(500).json({
      error: 'Stripe payment could not be verified. Please refresh this page in a moment.',
    });
  }
}
