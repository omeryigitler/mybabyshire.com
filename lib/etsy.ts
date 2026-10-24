import { prisma } from './prisma.js';

// Server-only Etsy integration. No Etsy credentials or OAuth tokens are returned to clients.
const API_ROOT = 'https://api.etsy.com/v3/application';
const SHOP_NAME = 'babyshirekids';
const PAGE_SIZE = 100;
const MAX_OFFSET = 12000;
let cachedShop: { shopId: number; expiresAt: number } | null = null;

export type EtsyListing = { listingId: string; title: string; url: string; state: string };
export type EtsyLink = { productId: string; listingId: string; url: string; title: string };

export const etsyIsConfigured = () => Boolean(process.env.ETSY_API_KEY && process.env.ETSY_SHARED_SECRET);
export const normalizeEtsyTitle = (name: string) =>
  name.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

const validListingId = (value: unknown) => /^\d{1,20}$/.test(String(value ?? ''));
const externalError = (status: number) => {
  if (status === 401 || status === 403) return new Error('Etsy rejected API access. Check your approved app credentials and access permissions.');
  if (status === 429) return new Error('Etsy API rate limit reached. Try again shortly.');
  return new Error(`Etsy API request failed (HTTP ${status}).`);
};

async function etsyGet(path: string): Promise<any> {
  if (!etsyIsConfigured()) throw new Error('ETSY_API_KEY and ETSY_SHARED_SECRET must be set in Vercel.');
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { 'x-api-key': `${process.env.ETSY_API_KEY}:${process.env.ETSY_SHARED_SECRET}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
    cache: 'no-store',
  });
  if (!response.ok) throw externalError(response.status);
  return response.json();
}

export async function getEtsyShopId(): Promise<number> {
  if (cachedShop && Date.now() < cachedShop.expiresAt) return cachedShop.shopId;
  const data = await etsyGet(`/shops?shop_name=${encodeURIComponent(SHOP_NAME)}&limit=100`);
  const shop = (Array.isArray(data?.results) ? data.results : []).find(
    (candidate: any) => String(candidate.shop_name || '').toLowerCase() === SHOP_NAME,
  );
  const id = Number(shop?.shop_id);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('The configured Etsy shop could not be verified.');
  cachedShop = { shopId: id, expiresAt: Date.now() + 10 * 60 * 1000 };
  return id;
}

export const getCanonicalEtsyUrl = (listingId: unknown) =>
  validListingId(listingId) ? `https://www.etsy.com/listing/${String(listingId)}` : null;

export async function getEtsyListings(offset: number) {
  if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET || offset % PAGE_SIZE !== 0) {
    throw new Error('Invalid Etsy page offset.');
  }
  const shopId = await getEtsyShopId();
  // This is the public active-listings endpoint; private listings need a separate OAuth scope.
  const data = await etsyGet(`/shops/${shopId}/listings/active?limit=${PAGE_SIZE}&offset=${offset}`);
  const listings: EtsyListing[] = (Array.isArray(data?.results) ? data.results : [])
    .filter((item: any) => validListingId(item.listing_id) && Number(item.shop_id) === shopId)
    .map((item: any) => ({
      listingId: String(item.listing_id),
      title: String(item.title || '').trim(),
      url: getCanonicalEtsyUrl(item.listing_id)!,
      state: 'active',
    }));
  const total = Number(data?.count);
  return { shopName: SHOP_NAME, shopId, offset, limit: PAGE_SIZE, total: Number.isSafeInteger(total) && total >= 0 ? total : listings.length, listings };
}

export async function getVerifiedEtsyListing(listingId: unknown): Promise<EtsyListing> {
  if (!validListingId(listingId)) throw new Error('Invalid Etsy listing ID.');
  const id = String(listingId);
  const shopId = await getEtsyShopId();
  const listing = await etsyGet(`/listings/${id}`);
  if (String(listing?.listing_id) !== id || Number(listing?.shop_id) !== shopId || listing?.state !== 'active') {
    throw new Error('Listing is not an active listing in babyshirekids.');
  }
  return { listingId: id, title: String(listing.title || '').trim(), state: 'active', url: getCanonicalEtsyUrl(id)! };
}

export async function createEtsyLinksTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS etsy_product_links (
      product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
      etsy_listing_id TEXT NOT NULL UNIQUE,
      etsy_url TEXT NOT NULL,
      etsy_title TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

type StoredLink = { product_id: string; etsy_listing_id: string; etsy_url: string; etsy_title: string };
const toLink = (row: StoredLink): EtsyLink => ({
  productId: row.product_id, listingId: row.etsy_listing_id, url: row.etsy_url, title: row.etsy_title,
});
const isMissingTable = (error: unknown) => {
  const err = error as { code?: string; meta?: { code?: string } };
  return err?.code === '42P01' || err?.meta?.code === '42P01';
};

export async function getEtsyLinks(): Promise<EtsyLink[]> {
  try {
    const rows = await prisma.$queryRaw<StoredLink[]>`SELECT product_id, etsy_listing_id, etsy_url, etsy_title FROM etsy_product_links`;
    return rows.map(toLink);
  } catch (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
}

export async function getProductEtsyUrl(productId: string): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<{ etsy_url: string }[]>`
      SELECT etsy_url FROM etsy_product_links WHERE product_id = ${productId} LIMIT 1
    `;
    return rows[0]?.etsy_url || null;
  } catch (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
}

export async function saveEtsyLink(productId: string, listing: EtsyListing): Promise<boolean> {
  const result = await prisma.$executeRaw`
    INSERT INTO etsy_product_links(product_id, etsy_listing_id, etsy_url, etsy_title)
    VALUES (${productId}, ${listing.listingId}, ${listing.url}, ${listing.title})
    ON CONFLICT (product_id) DO NOTHING
  `;
  return result === 1;
}

export async function removeEtsyLink(productId: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM etsy_product_links WHERE product_id = ${productId}`;
}
