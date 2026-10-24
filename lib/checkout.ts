import { prisma } from './prisma.js';
import { getEtsyLinks } from './etsy.js';
import { calculateTax, type TaxBreakdown } from '../src/utils/tax.js';
import { resolveCoupon } from './coupons.js';
import { ensureProductVariantsTable, variantDisplayName } from './variants.js';
import {
  SHIPPING_METHODS,
  resolveShippingMethod as resolveShippingMethodById,
  type ShippingMethod,
} from '../src/utils/shipping.js';

export type CheckoutProvider = 'stripe' | 'paypal';

export { SHIPPING_METHODS };
export type { ShippingMethod };

type VerifiedVariant = {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
};

export type VerifiedCheckoutItem = {
  productId: string;
  name: string;
  description: string;
  imageUrl?: string;
  quantity: number;
  price: number;
  variant: VerifiedVariant | null;
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
  giftMessage: string;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  tax: number;
  taxBreakdown: TaxBreakdown;
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

const parseFieldOptions = (value?: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((option) => String(option)) : [];
  } catch {
    return [];
  }
};

const isEmptyPersonalizationValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
};

const validatePersonalizationForProduct = (
  product: any,
  input: Record<string, unknown>,
): Record<string, unknown> => {
  const fields = Array.isArray(product.personalization_fields)
    ? [...product.personalization_fields].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    : [];

  if (product.personalization_required && fields.length === 0) {
    throw new CheckoutValidationError(
      `${product.name} requires personalization, but its options are not configured. Please contact us before ordering.`,
    );
  }

  const validated: Record<string, unknown> = {};

  for (const field of fields) {
    const key = String(field.field_key || '').trim();
    if (!key) continue;

    const rawValue = input[key];
    const empty = isEmptyPersonalizationValue(rawValue);

    if (field.required && empty) {
      throw new CheckoutValidationError(`${product.name}: ${field.label} is required.`);
    }

    if (empty) continue;

    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

    if (typeof value === 'string' && field.max_length && value.length > Number(field.max_length)) {
      throw new CheckoutValidationError(
        `${product.name}: ${field.label} must be ${field.max_length} characters or fewer.`,
      );
    }

    const options = parseFieldOptions(field.options_json);
    const constrainedTypes = ['select', 'radio', 'color'];
    if (options.length > 0 && constrainedTypes.includes(String(field.field_type || '').toLowerCase())) {
      if (!options.includes(String(value))) {
        throw new CheckoutValidationError(`${product.name}: choose a valid ${field.label}.`);
      }
    }

    validated[key] = value;
  }

  return validated;
};

const getPrimaryImage = (product: any) =>
  product.images?.find((image: any) => image.is_primary) || product.images?.[0] || null;

const resolveShippingMethod = (body: any) => {
  const requestedId = body?.shippingMethodId || body?.shippingId || body?.shippingMethod?.id;
  return resolveShippingMethodById(requestedId);
};

const parseOrderItemSnapshot = (value?: string | null): Record<string, any> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const buildVerifiedCheckout = async (body: any): Promise<VerifiedCheckout> => {
  const customer = sanitizeCustomer(body?.customer || {});
  const rawItems = Array.isArray(body?.items) ? body.items : [];

  if (!rawItems.length) {
    throw new CheckoutValidationError('Your cart is empty.');
  }

  if (rawItems.length > 30) {
    throw new CheckoutValidationError('Too many cart line items.');
  }

  const requestedItems = rawItems.map((item: any) => ({
    productId: sanitizeText(item?.productId, 'Product', 80),
    variantId: String(item?.variantId || '').trim().slice(0, 80) || null,
    quantity: normalizeQuantity(item?.quantity),
    personalizationData: normalizePersonalizationData(item?.personalizationData),
  }));

  await ensureProductVariantsTable();

  const productIds: string[] = Array.from(new Set(requestedItems.map((item) => item.productId)));
  const products = await prisma.products.findMany({
    where: {
      id: { in: productIds },
      status: 'active',
    },
    include: {
      images: true,
      personalization_fields: true,
      variants: { where: { active: true } },
    },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));
  // Etsy-linked native catalog items must never be purchased through Stripe/PayPal.
  // This server-side check prevents stale carts or direct API requests from bypassing the UI.
  const etsyLinkedIds = new Set((await getEtsyLinks()).map(link => link.productId));
  if (requestedItems.some(item => etsyLinkedIds.has(item.productId) || item.productId.startsWith('etsy-'))) {
    throw new CheckoutValidationError('This item must be purchased on Etsy. Open the product listing and use Etsy checkout.');
  }

  const items = requestedItems.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new CheckoutValidationError('One or more products are unavailable. Please refresh your cart.');
    }

    const activeVariants = Array.isArray(product.variants) ? product.variants : [];
    let verifiedVariant: VerifiedVariant | null = null;
    let itemPrice = roundMoney(Number(product.price));
    let itemName = product.name;

    if (activeVariants.length > 0) {
      if (!item.variantId) {
        throw new CheckoutValidationError(`${product.name}: choose a color and size before checkout.`);
      }

      const variant = activeVariants.find((candidate) => candidate.id === item.variantId);
      if (!variant) {
        throw new CheckoutValidationError(`${product.name}: the selected variant is no longer available. Please choose again.`);
      }

      if (Number(variant.stock_quantity) < item.quantity) {
        const label = variantDisplayName(variant);
        throw new CheckoutValidationError(
          Number(variant.stock_quantity) > 0
            ? `${product.name} (${label}) has only ${variant.stock_quantity} in stock.`
            : `${product.name} (${label}) is sold out.`,
        );
      }

      verifiedVariant = {
        id: variant.id,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
      };
      itemPrice = roundMoney(variant.price === null || variant.price === undefined ? Number(product.price) : Number(variant.price));
      itemName = `${product.name} — ${variantDisplayName(variant)}`;
    } else if (item.variantId) {
      throw new CheckoutValidationError(`${product.name}: the selected variant is no longer available. Please refresh your cart.`);
    } else if (Number(product.stock_quantity) > 0 && item.quantity > Number(product.stock_quantity)) {
      throw new CheckoutValidationError(`${product.name} has only ${product.stock_quantity} in stock.`);
    }

    const personalizationData = validatePersonalizationForProduct(product, item.personalizationData);
    const primaryImage = getPrimaryImage(product);

    return {
      productId: product.id,
      name: itemName,
      description: product.description || 'MY BABY SHIRE product',
      imageUrl: primaryImage?.image_url || undefined,
      quantity: item.quantity,
      price: itemPrice,
      variant: verifiedVariant,
      personalizationData,
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const shippingMethod = resolveShippingMethod(body || {});
  const shipping = subtotal > 0 ? roundMoney(shippingMethod.amount) : 0;

  let discount = 0;
  let couponCode: string | null = null;
  try {
    const coupon = await resolveCoupon(body?.couponCode || body?.coupon, subtotal);
    if (coupon) {
      discount = roundMoney(coupon.discount);
      couponCode = coupon.code;
    }
  } catch (couponError) {
    throw new CheckoutValidationError((couponError as Error).message);
  }

  const taxableBase = roundMoney(Math.max(0, subtotal - discount));
  const taxBreakdown = calculateTax(taxableBase, customer.state);
  const tax = roundMoney(taxBreakdown.amount);
  const total = roundMoney(taxableBase + shipping + tax);
  const giftMessage = String(body?.giftMessage || '').trim().slice(0, 500);

  return {
    customer,
    items,
    shippingMethod,
    giftMessage,
    subtotal,
    discount,
    couponCode,
    shipping,
    tax,
    taxBreakdown,
    total,
    currency: 'USD',
  };
};

export const createPendingOrderFromCheckout = async (checkout: VerifiedCheckout, provider: CheckoutProvider) => {
  const orderNumber = createOrderNumber();
  const snapshot = {
    customer: checkout.customer,
    giftMessage: checkout.giftMessage,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    couponCode: checkout.couponCode,
    shipping: checkout.shipping,
    shippingMethod: checkout.shippingMethod,
    tax: checkout.tax,
    taxRate: checkout.taxBreakdown.rate,
    taxLabel: checkout.taxBreakdown.label,
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
          personalization_data_json: JSON.stringify({
            ...item.personalizationData,
            ...(item.variant ? { __variant: item.variant } : {}),
          }),
        })),
      },
    },
    include: { items: true },
  });
};

// Decrement the exact inventory source captured with each paid order item.
// Variant products always track stock at the Color×Size SKU level. Legacy
// products retain the existing convention where product stock 0 is untracked.
export const decrementInventoryForOrder = async (
  items: Array<{ product_id: string; quantity: number | null; personalization_data_json?: string | null }>,
) => {
  await ensureProductVariantsTable();

  for (const item of items) {
    const quantity = Number(item.quantity) || 0;
    if (quantity <= 0) continue;

    const snapshot = parseOrderItemSnapshot(item.personalization_data_json);
    const variantId = String(snapshot?.__variant?.id || '').trim();

    if (variantId) {
      const result = await prisma.product_variants.updateMany({
        where: {
          id: variantId,
          product_id: item.product_id,
          active: true,
          stock_quantity: { gte: quantity },
        },
        data: { stock_quantity: { decrement: quantity } },
      });

      if (result.count !== 1) {
        throw new Error(`Variant inventory could not be decremented for ${variantId}.`);
      }
      continue;
    }

    await prisma.products.updateMany({
      where: { id: item.product_id, stock_quantity: { gte: quantity } },
      data: { stock_quantity: { decrement: quantity } },
    });
  }
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