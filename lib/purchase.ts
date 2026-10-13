import { prisma } from './prisma.js';

export type PurchaseProvider = 'internal' | 'etsy';

const DEFAULT_ETSY_SHOP_SLUG = 'babyshirekids';
const ETSY_HOST_PATTERN = /(^|\.)etsy\.com$/i;

let purchaseFieldsReady: Promise<void> | null = null;

export const ensureProductPurchaseFields = async () => {
  if (!purchaseFieldsReady) {
    purchaseFieldsReady = (async () => {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "products"
          ADD COLUMN IF NOT EXISTS "purchase_provider" TEXT NOT NULL DEFAULT 'internal',
          ADD COLUMN IF NOT EXISTS "purchase_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
          ADD COLUMN IF NOT EXISTS "etsy_listing_id" TEXT,
          ADD COLUMN IF NOT EXISTS "external_purchase_url" TEXT
      `);
      await prisma.$executeRawUnsafe(
        'CREATE UNIQUE INDEX IF NOT EXISTS "products_etsy_listing_id_key" ON "products"("etsy_listing_id")',
      );
      await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "products_purchase_provider_idx" ON "products"("purchase_provider")',
      );
    })().catch((error) => {
      purchaseFieldsReady = null;
      throw error;
    });
  }

  await purchaseFieldsReady;
};

const normalizeProvider = (value: unknown): PurchaseProvider =>
  String(value || '').trim().toLowerCase() === 'etsy' ? 'etsy' : 'internal';

const normalizeListingId = (value: unknown) => {
  const listingId = String(value || '').trim();
  return /^\d+$/.test(listingId) ? listingId : '';
};

const getEtsyShopSlug = () => {
  const configured = String(process.env.ETSY_SHOP_SLUG || DEFAULT_ETSY_SHOP_SLUG)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  return configured || DEFAULT_ETSY_SHOP_SLUG;
};

const normalizeEtsyUrl = (value: unknown) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !ETSY_HOST_PATTERN.test(url.hostname)) return '';
    return url.toString();
  } catch {
    return '';
  }
};

export const buildEtsyShareAndSaveUrl = (listingId: unknown) => {
  const normalizedListingId = normalizeListingId(listingId);
  if (!normalizedListingId) return '';
  return `https://${getEtsyShopSlug()}.etsy.com/listing/${normalizedListingId}`;
};

export const getProductPurchaseMetadata = (product: any) => {
  const purchaseProvider = normalizeProvider(product?.purchase_provider);
  const etsyListingId = normalizeListingId(product?.etsy_listing_id);
  const explicitlyEnabled = product?.purchase_enabled !== false;

  let purchaseUrl = '';
  if (purchaseProvider === 'etsy') {
    purchaseUrl = normalizeEtsyUrl(product?.external_purchase_url) || buildEtsyShareAndSaveUrl(etsyListingId);
  }

  const purchaseEnabled = purchaseProvider === 'etsy'
    ? explicitlyEnabled && Boolean(purchaseUrl)
    : explicitlyEnabled;

  return {
    purchaseProvider,
    purchaseEnabled,
    etsyListingId: etsyListingId || null,
    purchaseUrl: purchaseUrl || null,
  };
};
