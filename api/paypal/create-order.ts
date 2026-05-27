import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { Buffer } from 'node:buffer';
import { calculateCheckoutTotals } from '../../lib/checkoutTotals.js';

const prisma = new PrismaClient();

const getPayPalBaseUrl = () => {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
};

const createOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LW-${timestamp}-${random}`;
};

const getBaseUrl = (req: VercelRequest) => {
  const configuredUrl = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configuredUrl) return configuredUrl;

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer, items, currency = 'USD', shippingMethod } = req.body;

    if (!customer?.name || !customer?.email || !customer?.address || !customer?.city || !customer?.state || !customer?.zip) {
      return res.status(400).json({ error: 'Missing customer shipping details.' });
    }

    const totals = await calculateCheckoutTotals(prisma, items, shippingMethod);
    const orderNumber = createOrderNumber();
    const baseUrl = getBaseUrl(req);
    const customerSnapshot = {
      customer,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      shippingMethod: totals.shippingMethod,
      total: totals.total,
      currency,
      provider: 'paypal',
    };

    const order = await prisma.orders.create({
      data: {
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        total_amount: totals.total,
        currency,
        payment_status: 'pending',
        order_status: 'processing',
        personalization_data_json: JSON.stringify(customerSnapshot),
        items: {
          create: totals.items.map((item) => ({
            product_id: item.productId,
            product_name_snapshot: item.name,
            quantity: item.quantity,
            price_snapshot: item.unitPrice,
            personalization_data_json: JSON.stringify(item.personalizationData || {}),
          })),
        },
      },
      include: { items: true },
    });

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: order.order_number,
            description: `MY BABY SHIRE order ${order.order_number}`,
            amount: {
              currency_code: String(currency).toUpperCase(),
              value: totals.total.toFixed(2),
              breakdown: {
                item_total: { currency_code: String(currency).toUpperCase(), value: totals.subtotal.toFixed(2) },
                shipping: { currency_code: String(currency).toUpperCase(), value: totals.shipping.toFixed(2) },
              },
            },
            items: totals.items.map((item) => ({
              name: String(item.name).slice(0, 127),
              quantity: String(item.quantity),
              unit_amount: { currency_code: String(currency).toUpperCase(), value: item.unitPrice.toFixed(2) },
            })),
          },
        ],
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

    if (!response.ok) {
      throw new Error(data.message || data.name || 'PayPal order could not be created.');
    }

    const approvalUrl = data.links?.find((link: any) => link.rel === 'payer-action' || link.rel === 'approve')?.href;

    await prisma.orders.update({ where: { id: order.id }, data: { payment_reference: data.id } });

    return res.status(200).json({
      success: true,
      orderId: order.order_number,
      databaseId: order.id,
      paypalOrderId: data.id,
      approvalUrl,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      shippingMethod: totals.shippingMethod,
    });
  } catch (error) {
    return res.status(500).json({ error: 'PayPal checkout failed', details: (error as Error).message });
  }
}
