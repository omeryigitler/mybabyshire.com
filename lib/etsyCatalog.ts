import { prisma } from './prisma.js';
import { getEtsyShopId, getVerifiedEtsyListing } from './etsy.js';

const ROOT = 'https://api.etsy.com/v3/application';
const validId = (id: string) => /^\d{1,20}$/.test(id);
const isMissingTable = (error: any) => error?.code === 'P2010' && error?.meta?.code === '42P01' || error?.code === '42P01';

export type EtsyCatalogRecord = {
  listing_id: string;
  etsy_title: string;
  description: string;
  price: number | string;
  currency_code: string;
  quantity: number;
  image_urls: string[] | string;
  active: boolean;
  published: boolean;
  category_id: string | null;
  custom_title: string | null;
  synced_at: Date | string;
  category_name?: string | null;
  category_slug?: string | null;
};

export const decodeEtsyText = (value: unknown): string =>
  String(value ?? '').replace(/&#(x[0-9a-f]+|[0-9]+);|&(amp|quot|apos|lt|gt|nbsp);/gi, (match, numeric: string, named: string) => {
    if (named) return ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' } as Record<string, string>)[named.toLowerCase()] || match;
    const code = numeric.toLowerCase().startsWith('x') ? parseInt(numeric.slice(1), 16) : parseInt(numeric, 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : match;
  });

export const moneyFromEtsy = (value: any): { price: number; currency: string } | null => {
  const amount = Number(value?.amount);
  const divisor = Number(value?.divisor);
  if (!Number.isFinite(amount) || !Number.isFinite(divisor) || divisor <= 0) return null;
  const price = amount / divisor;
  const currency = String(value?.currency_code || '').toUpperCase();
  if (!Number.isFinite(price) || price < 0 || !/^[A-Z]{3}$/.test(currency)) return null;
  return { price, currency };
};

export const etsyImageUrls = (value: any): string[] => {
  const images = Array.isArray(value?.images) ? value.images : Array.isArray(value?.Images) ? value.Images : [];
  return images
    .slice()
    .sort((a: any, b: any) => Number(a.rank || 0) - Number(b.rank || 0))
    .map((image: any) => String(image.url_570xN || image.url_fullxfull || ''))
    .filter((url: string) => /^https:\/\/(?:i\.)?etsystatic\.com\//i.test(url))
    .slice(0, 8);
};

export const mapEtsyApiItem = (item: any, shopId: number) => {
  const id = String(item?.listing_id ?? '');
  const money = moneyFromEtsy(item?.price);
  if (!validId(id) || Number(item?.shop_id) !== shopId || item?.state !== 'active' || !money) return null;
  return {
    listingId: id,
    title: decodeEtsyText(item?.title).trim().slice(0, 500),
    description: decodeEtsyText(item?.description).slice(0, 20000),
    price: money.price,
    currency: money.currency,
    quantity: Math.max(0, Number(item?.quantity) || 0),
    images: etsyImageUrls(item),
    url: `https://www.etsy.com/listing/${id}`,
  };
};

const etsyRequest = async (path: string) => {
  const key = process.env.ETSY_API_KEY;
  const secret = process.env.ETSY_SHARED_SECRET;
  if (!key || !secret) throw new Error('Etsy credentials are missing.');
  const response = await fetch(ROOT + path, {
    headers: { 'x-api-key': `${key}:${secret}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Etsy catalog API HTTP ${response.status}`);
  return response.json();
};

export async function fetchEtsyDetails(ids: string[]) {
  if (ids.length === 0 || ids.length > 100 || ids.some(id => !validId(id))) throw new Error('Invalid Etsy listing selection.');
  const shopId = await getEtsyShopId();
  const data = await etsyRequest(`/listings/batch?listing_ids=${ids.join(',')}&includes=Images`);
  const items = (Array.isArray(data?.results) ? data.results : [])
    .map((item: any) => mapEtsyApiItem(item, shopId))
    .filter(Boolean) as NonNullable<ReturnType<typeof mapEtsyApiItem>>[];
  return items;
}

export async function ensureEtsyCatalogTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS etsy_catalog_items (
      listing_id TEXT PRIMARY KEY,
      etsy_title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC(14, 2) NOT NULL,
      currency_code VARCHAR(3) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      published BOOLEAN NOT NULL DEFAULT FALSE,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      custom_title TEXT,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function readManagedEtsyCatalog(): Promise<EtsyCatalogRecord[]> {
  try {
    return await prisma.$queryRaw<EtsyCatalogRecord[]>`
      SELECT e.listing_id, e.etsy_title, e.description, e.price, e.currency_code,
        e.quantity, e.image_urls, e.active, e.published, e.category_id, e.custom_title,
        e.synced_at, c.name AS category_name, c.slug AS category_slug
      FROM etsy_catalog_items e LEFT JOIN categories c ON c.id = e.category_id
      ORDER BY e.imported_at DESC
    `;
  } catch (err: any) {
    if (isMissingTable(err)) return [];
    throw err;
  }
}

type EtsyItem = NonNullable<ReturnType<typeof mapEtsyApiItem>>;
const updateRecord = async (item: EtsyItem) =>
  prisma.$executeRaw`
    INSERT INTO etsy_catalog_items
    (listing_id, etsy_title, description, price, currency_code, quantity, image_urls, active, published, synced_at)
    VALUES (${item.listingId}, ${item.title}, ${item.description}, ${item.price},
      ${item.currency}, ${item.quantity}, CAST(${JSON.stringify(item.images)} AS jsonb),
      TRUE, FALSE, NOW())
    ON CONFLICT (listing_id) DO UPDATE SET
      etsy_title = EXCLUDED.etsy_title, description = EXCLUDED.description,
      price = EXCLUDED.price, currency_code = EXCLUDED.currency_code,
      quantity = EXCLUDED.quantity, image_urls = EXCLUDED.image_urls,
      active = TRUE, synced_at = NOW()
  `;

export async function importCatalogIds(ids: string[]) {
  if (!ids.length || ids.length > 25 || new Set(ids).size !== ids.length || ids.some(id => !validId(id))) {
    throw new Error('Choose 1 to 25 distinct Etsy listing IDs.');
  }
  await ensureEtsyCatalogTable();
  const active = await fetchEtsyDetails(ids);
  const accepted = active.filter(item => item.images.length > 0);
  for (const item of accepted) await updateRecord(item);
  return { imported: accepted.length, skipped: ids.length - accepted.length, items: accepted };
}

// One verified sync page of at most 100 previously imported listings.
// Missing/inactive listings are disabled without deleting their local configuration.
export async function syncCatalogBatch(ids: string[]) {
  if (!ids.length || ids.length > 100 || ids.some(id => !validId(id))) throw new Error('Invalid sync batch.');
  const items = await fetchEtsyDetails(ids);
  const found = new Set(items.map(item => item.listingId));
  for (const item of items) await updateRecord(item);
  let unavailable = 0;
  let unverified = 0;
  for (const id of ids) {
    if (found.has(id)) continue;
    // An incomplete batch response is not proof of an inactive listing.
    // Only deactivate when Etsy explicitly confirms a listing cannot be accessed
    // or is no longer active. All other failures leave the current state intact.
    try {
      await getVerifiedEtsyListing(id);
      unverified++;
    } catch (error) {
      const message = String((error as Error).message || '');
      if (/HTTP 404|not an active listing/i.test(message)) {
        await prisma.$executeRaw`UPDATE etsy_catalog_items SET active = FALSE, synced_at = NOW() WHERE listing_id = ${id}`;
        unavailable++;
      } else {
        throw error;
      }
    }
  }
  return { refreshed: items.length, unavailable, unverified };
}

// Uses a short-lived server instance lock to avoid overlapping Etsy API reads.
let refreshInFlight: Promise<void> | null = null;
let lastAttempt = 0;
export async function refreshPublishedEtsyWhenDue(): Promise<void> {
  const now = Date.now();
  if (refreshInFlight) return refreshInFlight;
  if (now - lastAttempt < 60_000) return;
  let due: { listing_id: string }[];
  try {
    due = await prisma.$queryRaw<{ listing_id: string }[]>`
      SELECT listing_id FROM etsy_catalog_items
      WHERE published = TRUE AND synced_at < NOW() - INTERVAL '4 hours'
      ORDER BY listing_id
      LIMIT 20
    `;
  } catch (err: any) {
    if (isMissingTable(err)) return;
    throw err;
  }
  if (!due.length) return;
  lastAttempt = now;
  refreshInFlight = (async () => {
    for (let offset = 0; offset < due.length; offset += 100) {
      await syncCatalogBatch(due.slice(offset, offset + 100).map(item => item.listing_id));
    }
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

const listImages = (value: any): string[] => {
  if (Array.isArray(value)) return value.filter((s): s is string => typeof s === 'string');
  try { const parsed = JSON.parse(String(value)); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
};

export const isEtsyPriceStale = (syncedAt: Date | string, now = Date.now()) => {
  const verified = new Date(syncedAt).getTime();
  return !Number.isFinite(verified) || now - verified >= 4 * 60 * 60 * 1000;
};

export const toStoreEtsyProduct = (item: EtsyCatalogRecord) => {
  const images = listImages(item.image_urls);
  const name = item.custom_title || item.etsy_title;
  const priceStale = isEtsyPriceStale(item.synced_at);
  return {
    id: `etsy-${item.listing_id}`,
    slug: `etsy-${item.listing_id}`,
    name,
    description: item.description,
    price: priceStale ? 0 : Number(item.price),
    priceStale,
    salePrice: null,
    priceCurrency: item.currency_code,
    source: 'etsy',
    etsyUrl: `https://www.etsy.com/listing/${item.listing_id}`,
    imageUrl: images[0] || '',
    hoverImageUrl: images[1] || '',
    categoryId: item.category_id,
    categoryName: item.category_name || null,
    categorySlug: item.category_slug || null,
    stockQuantity: item.quantity,
    variants: [],
    personalizationRequired: false,
    personalizationFields: [],
    status: 'active',
    featured: false, newArrival: false, bestseller: false,
  };
};

export async function getPublishedEtsyProducts() {
  // Keep approved products in the catalog while Etsy is temporarily unreachable.
  // A stale price is NEVER shown: toStoreEtsyProduct sets priceStale and 0,
  // and the storefront directs the buyer to Etsy for the current price.
  try {
    const rows = await prisma.$queryRaw<EtsyCatalogRecord[]>`
      SELECT e.listing_id, e.etsy_title, e.description, e.price, e.currency_code,
        e.quantity, e.image_urls, e.active, e.published, e.category_id, e.custom_title,
        e.synced_at, c.name AS category_name, c.slug AS category_slug
      FROM etsy_catalog_items e
      LEFT JOIN categories c ON c.id = e.category_id
      WHERE e.active = TRUE AND e.published = TRUE AND e.quantity > 0
      ORDER BY e.imported_at DESC
    `;
    return rows.filter(item => listImages(item.image_urls).length > 0).map(toStoreEtsyProduct);
  } catch (err: any) {
    if (isMissingTable(err)) return [];
    throw err;
  }
}
