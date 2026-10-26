import { randomUUID } from 'node:crypto';
import { prisma } from './prisma.js';
import { ETSY_ONLY_MODE } from '../src/config/commerce.js';
import { getEtsyListings, getEtsyLinks, etsyIsConfigured, type EtsyListing } from './etsy.js';
import { normalizeCatalogTitle } from './etsyMatching.js';

const JOB = 'etsy-only-2026-10';
const MAX_PAGES = 5;
let checkedAt = 0;

// Deliberately stricter than manual suggestions: whole titles only, globally 1:1.
export function exactTransitionMatches(
  products: Array<{ id: string; name: string }>,
  listings: EtsyListing[],
  links: Array<{ productId: string; listingId: string }>,
) {
  const matches: Array<{ productId: string; productName: string; listing: EtsyListing }> = [];
  for (const product of products) {
    const title = normalizeCatalogTitle(product.name);
    if (title.length < 18 || title.split(' ').length < 4) continue;
    if (products.filter(p => normalizeCatalogTitle(p.name) === title).length !== 1) continue;
    const candidates = listings.filter(l => normalizeCatalogTitle(l.title) === title);
    if (candidates.length !== 1) continue;
    const listing = candidates[0];
    if (links.some(l => l.productId === product.id || l.listingId === listing.listingId)) continue;
    matches.push({ productId: product.id, productName: product.name, listing });
  }
  return matches;
}

async function ensureTransitionTable() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS etsy_transition_runs (
    id TEXT PRIMARY KEY, lease_token TEXT NOT NULL, lease_until TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ, report JSONB
  )`);
}

export async function readEtsyTransitionReport() {
  await ensureTransitionTable();
  return prisma.$queryRaw`SELECT completed_at, report FROM etsy_transition_runs WHERE id = ${JOB}`;
}

// One migration, protected across serverless instances. Never changes product content,
// publication, existing links, orders, payment sessions or provider credentials.
export async function runEtsyTransitionOnce() {
  if (!ETSY_ONLY_MODE || !etsyIsConfigured() || Date.now() - checkedAt < 60_000) return;
  checkedAt = Date.now();
  await ensureTransitionTable();
  const token = randomUUID();
  const claimed = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO etsy_transition_runs (id, lease_token, lease_until)
    VALUES (${JOB}, ${token}, NOW() + INTERVAL '5 minutes')
    ON CONFLICT (id) DO UPDATE SET lease_token = EXCLUDED.lease_token, lease_until = EXCLUDED.lease_until
    WHERE etsy_transition_runs.completed_at IS NULL AND etsy_transition_runs.lease_until < NOW()
    RETURNING id
  `;
  if (!claimed.length) return;
  const [products, links, orders] = await Promise.all([
    prisma.products.findMany({ where: { status: 'active' }, select: { id: true, name: true } }),
    getEtsyLinks(),
    prisma.orders.groupBy({ by: ['payment_status'], _count: { _all: true } }),
  ]);
  const listings: EtsyListing[] = [];
  let total = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await getEtsyListings(page * 100);
    if (page > 0 && data.total !== total) throw new Error('Etsy catalog changed during transition; retry later.');
    total = data.total;
    if (total > MAX_PAGES * 100) throw new Error('Etsy transition requires manual review for catalogs over 500 listings.');
    listings.push(...data.listings);
    if (listings.length >= total) break;
    if (!data.listings.length) throw new Error('Incomplete Etsy transition snapshot.');
  }
  if (new Set(listings.map(l => l.listingId)).size !== total || listings.length !== total) {
    throw new Error('Incomplete or duplicate Etsy transition snapshot.');
  }
  const matches = exactTransitionMatches(products, listings, links);
  const report = await prisma.$transaction(async tx => {
    // A stale worker must never commit after another worker has acquired its lease.
    const owned = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM etsy_transition_runs WHERE id = ${JOB} AND lease_token = ${token}
        AND completed_at IS NULL AND lease_until > NOW() FOR UPDATE
    `;
    if (!owned.length) throw new Error('Etsy transition lease expired.');
    let created = 0;
    for (const match of matches) {
      created += await tx.$executeRaw`
        INSERT INTO etsy_product_links (product_id, etsy_listing_id, etsy_url, etsy_title)
        SELECT id, ${match.listing.listingId}, ${match.listing.url}, ${match.listing.title}
        FROM products WHERE id = ${match.productId} AND name = ${match.productName} AND status = 'active'
        ON CONFLICT DO NOTHING
      `;
    }
    const finalLinks = await tx.$queryRaw<Array<{ product_id: string }>>`SELECT product_id FROM etsy_product_links`;
    const linked = new Set(finalLinks.map(l => l.product_id));
    const result = {
      activeLegacyProducts: products.length, activeEtsyListings: total, createdLinks: created,
      linkedProducts: products.filter(p => linked.has(p.id)).length,
      unmatchedProducts: products.filter(p => !linked.has(p.id)),
      existingOrdersByPaymentStatus: orders.map(o => ({ status: o.payment_status, count: o._count._all })),
      completedAt: new Date().toISOString(),
    };
    await tx.$executeRaw`UPDATE etsy_transition_runs SET completed_at = NOW(), report = CAST(${JSON.stringify(result)} AS jsonb)
      WHERE id = ${JOB} AND lease_token = ${token}`;
    return result;
  }, { timeout: 20_000 });
  // Aggregates only; no customer data, credentials or order identifiers.
  console.info('Etsy transition complete', JSON.stringify({ ...report, unmatchedProducts: report.unmatchedProducts.length }));
}
