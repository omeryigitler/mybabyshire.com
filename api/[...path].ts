// api/[...path].ts

import express from 'express';
import { Buffer } from 'node:buffer';
import apiRoutes from '../server/api.js';
import { prisma } from '../lib/prisma.js';
import {
  buildVerifiedCheckout,
  createPendingOrderFromCheckout,
  getBaseUrl,
  isCheckoutValidationError,
  verifyPayPalCaptureForOrder,
} from '../lib/checkout.js';
import { sendPaymentConfirmedEmail } from '../lib/email.js';

const app = express();

app.use(express.json({ limit: '25mb' }));

const getPayPalBaseUrl = () => process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

const getPayPalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to Vercel.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'PayPal access token could not be created.');
  return data.access_token as string;
};

const createPayPalOrderHandler = async (req: express.Request, res: express.Response) => {
  try {
    const checkout = await buildVerifiedCheckout(req.body);
    const order = await createPendingOrderFromCheckout(checkout, 'paypal');
    const baseUrl = getBaseUrl(req);

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: order.order_number,
          description: `MY BABY SHIRE order ${order.order_number}`,
          amount: {
            currency_code: checkout.currency,
            value: checkout.total.toFixed(2),
            breakdown: {
              item_total: { currency_code: checkout.currency, value: checkout.subtotal.toFixed(2) },
              shipping: { currency_code: checkout.currency, value: checkout.shipping.toFixed(2) },
            },
          },
          items: checkout.items.map((item) => ({
            name: String(item.name).slice(0, 127),
            quantity: String(item.quantity),
            unit_amount: { currency_code: checkout.currency, value: item.price.toFixed(2) },
          })),
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'MY BABY SHIRE',
              locale: 'en-US',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW',
              return_url: `${baseUrl}/paypal-success?order=${encodeURIComponent(order.order_number)}`,
              cancel_url: `${baseUrl}/payment-cancel?order=${encodeURIComponent(order.order_number)}`,
            },
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.name || 'PayPal order could not be created.');

    const approvalUrl = data.links?.find((link: any) => link.rel === 'payer-action' || link.rel === 'approve')?.href;
    await prisma.orders.update({ where: { id: order.id }, data: { payment_reference: data.id } });

    return res.status(200).json({ success: true, orderId: order.order_number, databaseId: order.id, paypalOrderId: data.id, approvalUrl, shippingMethod: checkout.shippingMethod });
  } catch (error) {
    if (isCheckoutValidationError(error)) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error('PayPal checkout failed', error);
    return res.status(500).json({ error: 'PayPal checkout failed. Please try again.' });
  }
};

const capturePayPalOrderHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { token, orderNumber } = req.body;
    if (!token || !orderNumber) return res.status(400).json({ error: 'Missing PayPal token or order reference.' });

    const accessToken = await getPayPalAccessToken();
    const existingOrder = await prisma.orders.findUnique({
      where: { order_number: String(orderNumber) },
      include: { items: true },
    });

    if (!existingOrder) return res.status(404).json({ error: 'Order not found.' });

    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(token)}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.name || 'PayPal payment could not be captured.');

    const { isCompleted, paypalOrderId } = verifyPayPalCaptureForOrder(existingOrder, data, String(token));
    const updatedOrder = await prisma.orders.update({
      where: { order_number: existingOrder.order_number },
      data: { payment_status: isCompleted ? 'paid' : 'pending', order_status: 'processing', payment_reference: paypalOrderId },
      include: { items: true },
    });

    if (isCompleted) {
      await sendPaymentConfirmedEmail({
        to: updatedOrder.customer_email,
        customerName: updatedOrder.customer_name,
        orderNumber: updatedOrder.order_number,
        total: Number(updatedOrder.total_amount) || 0,
        paymentProvider: 'PayPal',
        items: updatedOrder.items?.map((item: any) => ({
          productName: item.product_name_snapshot,
          quantity: Number(item.quantity) || 1,
          price: Number(item.price_snapshot) || 0,
        })) || [],
      });
    }

    return res.status(200).json({ success: true, status: data.status, orderNumber: existingOrder.order_number, paypalOrderId });
  } catch (error) {
    if (isCheckoutValidationError(error)) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error('PayPal capture failed', error);
    return res.status(500).json({ error: 'PayPal capture failed. Please try again.' });
  }
};

app.post('/api/paypal/create-order', createPayPalOrderHandler);
app.post('/api/paypal-create-order', createPayPalOrderHandler);
app.post('/api/paypal/capture-order', capturePayPalOrderHandler);
app.post('/api/paypal-capture-order', capturePayPalOrderHandler);

app.use('/api', apiRoutes);

export default app;
