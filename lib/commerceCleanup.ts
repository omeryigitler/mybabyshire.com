import { prisma } from './prisma.js';

const JOB = 'etsy-storefront-cleanup-2026-10-26';
// Fixed release cutoff: products/orders created after this request are never archived.
const CUTOFF = '2026-10-26T08:59:06Z';
let ready: Promise<void> | null = null;

export function ensureCommerceCleanup(): Promise<void> {
  if (!ready) ready = clean().catch(error => { ready = null; throw error; });
  return ready;
}

async function clean() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS commerce_archive (
    kind TEXT NOT NULL, record_id TEXT NOT NULL, previous_status TEXT,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(kind, record_id)
  )`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS commerce_cleanup_runs (
    id TEXT PRIMARY KEY, completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), report JSONB
  )`);
  const report = await prisma.$transaction(async tx => {
    const claimed = await tx.$queryRaw<Array<{id: string}>>`
      INSERT INTO commerce_cleanup_runs(id) VALUES (${JOB}) ON CONFLICT DO NOTHING RETURNING id
    `;
    if (!claimed.length) return null;
    const products = await tx.$executeRaw`
      INSERT INTO commerce_archive(kind, record_id, previous_status)
      SELECT 'product', id, status FROM products WHERE created_at <= CAST(${CUTOFF} AS timestamptz)
      ON CONFLICT DO NOTHING
    `;
    await tx.$executeRaw`UPDATE products SET status = 'archived'
      WHERE id IN (SELECT record_id FROM commerce_archive WHERE kind = 'product')`;
    const orders = await tx.$executeRaw`
      INSERT INTO commerce_archive(kind, record_id, previous_status)
      SELECT 'order', id, order_status FROM orders WHERE created_at <= CAST(${CUTOFF} AS timestamptz)
      ON CONFLICT DO NOTHING
    `;
    // Orders, payments, line items and provider callbacks are preserved unchanged.
    // Etsy catalog rows and publication states are deliberately never touched.
    const result = { productsArchived: products, ordersArchived: orders, cutoff: CUTOFF };
    await tx.$executeRaw`UPDATE commerce_cleanup_runs SET report = CAST(${JSON.stringify(result)} AS jsonb) WHERE id = ${JOB}`;
    return result;
  }, { timeout: 20000 });
  if (report) console.info('Commerce cleanup complete', JSON.stringify(report));
}

export async function archivedIds(kind: 'order' | 'product') {
  await ensureCommerceCleanup();
  const rows = await prisma.$queryRaw<Array<{record_id: string}>>`
    SELECT record_id FROM commerce_archive WHERE kind = ${kind}
  `;
  return rows.map(row => row.record_id);
}

export async function restoreArchivedRecord(kind: 'order' | 'product', id: string) {
  await ensureCommerceCleanup();
  return prisma.$transaction(async tx => {
    const records = await tx.$queryRaw<Array<{record_id: string}>>`
      DELETE FROM commerce_archive WHERE kind = ${kind} AND record_id = ${id} RETURNING record_id
    `;
    if (!records.length) return false;
    if (kind === 'product') await tx.products.update({ where: { id }, data: { status: 'draft' } });
    return true;
  });
}
