import { ETSY_ONLY_MODE, DIRECT_CHECKOUT_MESSAGE, ETSY_SHOP_URL } from '../src/config/commerce.js';
// api/[...path].ts

import express from 'express';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import apiRoutes from '../server/api.js';
import { getPublishedEtsyProducts } from '../lib/etsyCatalog.js';
import { getEtsyLinks } from '../lib/etsy.js';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth.js';
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
app.use((req, res, next) => {
  const path = req.path.replace(/\/+$/, '');
  if (ETSY_ONLY_MODE && ['/api/checkout/create-payment', '/api/paypal/create-order', '/api/paypal-create-order', '/api/cart/sync'].includes(path)) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(409).json({ error: DIRECT_CHECKOUT_MESSAGE, code: 'ETSY_ONLY_CHECKOUT', shopUrl: ETSY_SHOP_URL });
    return;
  }
  next();
});


const getAuthorization = (req: express.Request) => {
  const value = req.headers.authorization;
  return Array.isArray(value) ? value[0] : value;
};

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ensureNewsletterTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'subscribed',
      source TEXT NOT NULL DEFAULT 'storefront',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const newsletterPostHandler = async (req: express.Request, res: express.Response) => {
  try {
    await ensureNewsletterTable();
    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 254);
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });

    await prisma.$executeRaw`
      INSERT INTO newsletter_subscribers (id, email, status, source)
      VALUES (${randomUUID()}, ${email}, 'subscribed', 'storefront')
      ON CONFLICT (email)
      DO UPDATE SET status = 'subscribed', updated_at = NOW()
    `;

    return res.status(200).json({ success: true, message: 'You are subscribed.' });
  } catch (error) {
    console.error('Newsletter signup failed', error);
    return res.status(500).json({ error: 'Newsletter signup is temporarily unavailable.' });
  }
};

const newsletterGetHandler = async (req: express.Request, res: express.Response) => {
  try {
    requireAdmin(getAuthorization(req));
    await ensureNewsletterTable();

    const subscribers = await prisma.$queryRaw<Array<{ id: string; email: string; status: string; source: string; created_at: Date; updated_at: Date }>>`
      SELECT id, email, status, source, created_at, updated_at
      FROM newsletter_subscribers
      ORDER BY created_at DESC
      LIMIT 1000
    `;

    return res.status(200).json(subscribers.map((subscriber) => ({
      id: subscriber.id,
      email: subscriber.email,
      status: subscriber.status,
      source: subscriber.source,
      createdAt: subscriber.created_at,
      updatedAt: subscriber.updated_at,
    })));
  } catch (error) {
    const message = (error as Error).message || 'Newsletter request failed.';
    const unauthorized = message.toLowerCase().includes('unauthorized');
    return res.status(unauthorized ? 401 : 500).json({
      error: unauthorized ? message : 'Newsletter request failed.',
    });
  }
};

const SITE_URL = 'https://www.mybabyshire.com';
const STATIC_SITEMAP_ROUTES = [
  '/',
  '/collections/all',
  '/collections/new-arrivals',
  '/collections/best-sellers',
  '/collections/baby',
  '/collections/toddler',
  '/collections/kids',
  '/collections/adult',
  '/collections/sweatshirts',
  '/track-order',
  '/policies/shipping',
  '/policies/returns',
  '/policies/privacy',
  '/policies/terms',
];

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character] || character));

const sitemapHandler = async (_req: express.Request, res: express.Response) => {
  try {
    const products = await prisma.products.findMany({
      where: { status: 'active' },
      select: { slug: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
    });

    const staticUrls = STATIC_SITEMAP_ROUTES.map((path) => `<url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc></url>`).join('');
    const productUrls = products.map((product) => `<url><loc>${escapeXml(`${SITE_URL}/products/${product.slug}`)}</loc><lastmod>${product.updated_at.toISOString()}</lastmod></url>`).join('');
    const [etsyProducts, links] = await Promise.all([getPublishedEtsyProducts(), getEtsyLinks()]);
    const mapped = new Set(links.map(link => link.listingId));
    const etsyUrls = etsyProducts.filter(product => !mapped.has(product.id.slice(5)))
      .map(product => `<url><loc>${escapeXml(`${SITE_URL}/products/${product.slug}`)}</loc></url>`).join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${productUrls}${etsyUrls}</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Failed to generate sitemap', error);
    return res.status(500).send('Could not generate sitemap');
  }
};

app.post('/api/paypal/create-order', createPayPalOrderHandler);
app.post('/api/paypal-create-order', createPayPalOrderHandler);
app.post('/api/paypal/capture-order', capturePayPalOrderHandler);
app.post('/api/paypal-capture-order', capturePayPalOrderHandler);
app.post('/api/newsletter', newsletterPostHandler);
app.get('/api/newsletter', newsletterGetHandler);
app.get('/api/sitemap', sitemapHandler);
app.get('/sitemap.xml', sitemapHandler);

app.use('/api', apiRoutes);

export default app;
