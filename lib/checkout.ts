import { prisma } from './prisma.js';

export type CheckoutProvider = 'stripe' | 'paypal';

export type ShippingMethod = {
  id: string;
  label: string;
  description: string;
  carrier: string;
  service: string;
  estimatedDelivery: string;
  amount: number;
};

export type VerifiedCheckoutItem = {
  productId: string;
  name: string;
  description: string;
  imageUrl?: string;
  quantity: number;
  price: number;
  personalizationData: Record<string, unknown>;
};

export type VerifiedCheckout = {
  customer: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  items: VerifiedCheckoutItem[];
  shippingMethod: ShippingMethod;
  subtotal: number;
  shipping: number;
  total: number;
  currency: 'USD';
};

export class CheckoutValidationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'CheckoutValidationError';
    this.statusCode = statusCode;
  }
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'us-standard',
    label: 'Standard Shipping',
    description: 'Reliable gift-ready delivery for most US addresses.',
    carrier: 'USPS',
    service: 'Ground Advantage',
    estimatedDelivery: '3-5 business days',
    amount: 6.95,
  },
  {
    id: 'us-priority',
    label: 'Priority Shipping',
    description: 'Faster delivery for time-sensitive gifts.',
    carrier: 'USPS',
    service: 'Priority Mail',
    estimatedDelivery: '2-3 business days',
    amount: 12.95,
  },
];

export const isCheckoutValidationError = (error: unknown): error is CheckoutValidationError =>
  error instanceof CheckoutValidationError;

export const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export const toCents = (amount: number) => Math.round(roundMoney(amount) * 100);

export const createOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LW-${timestamp}-${random}`;
};

export const getBaseUrl = (req: { headers: Record<string, any> }) => {
  const configuredUrl = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configuredUrl) return configuredUrl;

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
};

export const getAbsoluteImageUrl = (imageUrl: string | undefined, baseUrl: string) => {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  if (imageUrl.startsWith('/')) return `${baseUrl}${imageUrl}`;
  return undefined;
};

const sanitizeText = (value: unknown, label: string, maxLength: number) => {
  const text = String(value || '').trim();
  if (!text) throw new CheckoutValidationError(`${label} is required.`);
  if (text.length > maxLength) throw new CheckoutValidationError(`${label} is too long.`);
  return text;
};

const sanitizeCustomer = (customer: any): VerifiedCheckout['customer'] => {
  const email = sanitizeText(customer?.email, 'Email', 180).toLowerCase();
  const zip = sanitizeText(customer?.zip, 'ZIP code', 16);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CheckoutValidationError('Please enter a valid email address.');
  }

  if (!/^\d{5}(-\d{4})?$/.test(zip)) {
    throw new CheckoutValidationError('Please enter a valid US ZIP code.');
  }

  return {
    name: sanitizeText(customer?.name, 'Customer name', 120),
    email,
    address: sanitizeText(customer?.address, 'Address', 220),
    city: sanitizeText(customer?.city, 'City', 120),
    state: sanitizeText(customer?.state, 'State', 40).toUpperCase(),
    zip,
  };
};

const normalizeQuantity = (value: unknown) => {
  const quantity = Math.floor(Number(value || 1));
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new CheckoutValidationError('Invalid item quantity.');
  }
  if (quantity > 25) {
    throw new CheckoutValidationError('Please contact us for orders over 25 units of one item.');
  }
  return quantity;
};

const normalizePersonalizationData = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const json = JSON.stringify(value);
  if (json.length > 5000) {
    throw new CheckoutValidationError('Personalization details are too long.');
  }
  return value as Record<string, unknown>;
};

const getPrimaryImage = (product: any) =>
  product.images?.find((image: any) => image.is_primary) || product.images?.[0] || null;

const resolveShippingMethod = (body: any) => {
  const requestedId = String(body?.shippingMethodId || body?.shippingId || body?.shippingMethod?.id || 'us-standard').trim();
  return SHIPPING_METHODS.find((method) => method.id === requestedId) || SHIPPING_METHODS[0];
};

export const buildVerifiedCheckout = async (body: any): Promise<VerifiedCheckout> => {
  const customer = sanitizeCustomer(body?.customer || {});
  const rawItems = Array.isArray(body?.items) ? body.items : [];

  if (!rawItems.length) {
    throw new CheckoutValidationError('Your gift bag is empty.');
  }

  if (rawItems.length > 30) {
    throw new CheckoutValidationError('Too many cart line items.');
  }

  const requestedItems = rawItems.map((item: any) => ({
    productId: sanitizeText(item?.productId, 'Product', 80),
    quantity: normalizeQuantity(item?.quantity),
    personalizationData: normalizePersonalizationData(item?.personalizationData),
  }));

  const productIds: string[] = Array.from(new Set(requestedItems.map((item) => item.productId)));
  const products = await prisma.products.findMany({
    where: {
      id: { in: productIds },
      status: 'active',
    },
    include: { images: true },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  const items = requestedItems.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new CheckoutValidationError('One or more products are unavailable. Please refresh your cart.');
    }

    if (Number(product.stock_quantity) > 0 && item.quantity > Number(product.stock_quantity)) {
      throw new CheckoutValidationError(`${product.name} has only ${product.stock_quantity} in stock.`);
    }

    const primaryImage = getPrimaryImage(product);

    return {
      productId: product.id,
      name: product.name,
      description: product.description || 'Personalized MY BABY SHIRE gift',
      imageUrl: primaryImage?.image_url || undefined,
      quantity: item.quantity,
      price: roundMoney(Number(product.price)),
      personalizationData: item.personalizationData,
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const shippingMethod = resolveShippingMethod(body || {});
  const shipping = subtotal > 0 ? roundMoney(shippingMethod.amount) : 0;
  const total = roundMoney(subtotal + shipping);

  return {
    customer,
    items,
    shippingMethod,
    subtotal,
    shipping,
    total,
    currency: 'USD',
  };
};

export const createPendingOrderFromCheckout = async (checkout: VerifiedCheckout, provider: CheckoutProvider) => {
  const orderNumber = createOrderNumber();
  const snapshot = {
    customer: checkout.customer,
    subtotal: checkout.subtotal,
    shipping: checkout.shipping,
    shippingMethod: checkout.shippingMethod,
    total: checkout.total,
    currency: checkout.currency,
    provider,
  };

  return prisma.orders.create({
    data: {
      order_number: orderNumber,
      customer_name: checkout.customer.name,
      customer_email: checkout.customer.email,
      total_amount: checkout.total,
      currency: checkout.currency,
      payment_status: 'pending',
      order_status: 'processing',
      personalization_data_json: JSON.stringify(snapshot),
      items: {
        create: checkout.items.map((item) => ({
          product_id: item.productId,
          product_name_snapshot: item.name,
          quantity: item.quantity,
          price_snapshot: item.price,
          personalization_data_json: JSON.stringify(item.personalizationData || {}),
        })),
      },
    },
    include: { items: true },
  });
};

const getPayPalPurchaseUnit = (captureData: any, orderNumber: string) => {
  const purchaseUnits = Array.isArray(captureData?.purchase_units) ? captureData.purchase_units : [];
  return purchaseUnits.find((unit: any) => String(unit?.reference_id || '').toUpperCase() === orderNumber.toUpperCase());
};

const getPayPalCapturedAmount = (purchaseUnit: any) => {
  const captures = Array.isArray(purchaseUnit?.payments?.captures) ? purchaseUnit.payments.captures : [];
  const completedCapture = captures.find((capture: any) => capture?.status === 'COMPLETED') || captures[0];
  return completedCapture?.amount || purchaseUnit?.amount || null;
};

export const verifyPayPalCaptureForOrder = (order: any, captureData: any, token: string) => {
  const paypalOrderId = String(captureData?.id || token || '').trim();

  if (!order) {
    throw new CheckoutValidationError('Order not found.', 404);
  }

  if (order.payment_reference && order.payment_reference !== token && order.payment_reference !== paypalOrderId) {
    throw new CheckoutValidationError('PayPal token does not match this order.', 409);
  }

  const purchaseUnit = getPayPalPurchaseUnit(captureData, order.order_number);
  if (!purchaseUnit) {
    throw new CheckoutValidationError('PayPal payment does not match this order reference.', 409);
  }

  const amount = getPayPalCapturedAmount(purchaseUnit);
  const capturedValue = Number(amount?.value);
  const expectedValue = Number(order.total_amount);

  if (!Number.isFinite(capturedValue) || roundMoney(capturedValue) !== roundMoney(expectedValue)) {
    throw new CheckoutValidationError('PayPal payment amount does not match this order.', 409);
  }

  if (String(amount?.currency_code || '').toUpperCase() !== String(order.currency || 'USD').toUpperCase()) {
    throw new CheckoutValidationError('PayPal payment currency does not match this order.', 409);
  }

  return {
    paypalOrderId,
    isCompleted: captureData?.status === 'COMPLETED',
  };
};
