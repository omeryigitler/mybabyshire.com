import { pathToFileURL } from 'node:url';

// Explicit owner request: permanently remove the 94 products and 14 orders
// archived by the Etsy-only release. No Etsy catalog or upstream API writes.
export const PURGE_JOB = 'purge-authorized-legacy-commerce-2026-10-26';
export const PURGE_SQL = `DO $purge$
DECLARE product_count integer; order_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(741926, 261026);
  IF EXISTS (SELECT 1 FROM commerce_cleanup_runs WHERE id = 'purge-authorized-legacy-commerce-2026-10-26') THEN
    RETURN;
  END IF;
  LOCK TABLE commerce_archive, products, orders IN SHARE ROW EXCLUSIVE MODE;
  IF NOT EXISTS (
    SELECT 1 FROM commerce_cleanup_runs
    WHERE id = 'etsy-storefront-cleanup-2026-10-26'
      AND report->>'productsArchived' = '94' AND report->>'ordersArchived' = '14'
  ) THEN RAISE EXCEPTION 'Expected original archive report missing; nothing deleted'; END IF;

  CREATE TEMP TABLE purge_product_ids ON COMMIT DROP AS
    SELECT p.id FROM products p JOIN commerce_archive a ON a.record_id = p.id AND a.kind = 'product'
    WHERE p.status = 'archived' AND p.created_at <= '2026-10-26T08:59:06Z'::timestamptz;
  CREATE TEMP TABLE purge_order_ids ON COMMIT DROP AS
    SELECT o.id FROM orders o JOIN commerce_archive a ON a.record_id = o.id AND a.kind = 'order'
    WHERE o.created_at <= '2026-10-26T08:59:06Z'::timestamptz;
  SELECT count(*) INTO product_count FROM purge_product_ids;
  SELECT count(*) INTO order_count FROM purge_order_ids;
  IF product_count <> 94 OR order_count <> 14 THEN
    RAISE EXCEPTION 'Archive changed: expected 94 products/14 orders, got %/%; nothing deleted', product_count, order_count;
  END IF;
  IF EXISTS (
    SELECT 1 FROM order_items WHERE product_id IN (SELECT id FROM purge_product_ids)
      AND order_id NOT IN (SELECT id FROM purge_order_ids)
  ) THEN RAISE EXCEPTION 'A retained order references an archived product; nothing deleted'; END IF;

  DELETE FROM order_items WHERE order_id IN (SELECT id FROM purge_order_ids);
  DELETE FROM orders WHERE id IN (SELECT id FROM purge_order_ids);
  GET DIAGNOSTICS order_count = ROW_COUNT;
  DELETE FROM cart_items WHERE product_id IN (SELECT id FROM purge_product_ids);
  -- Product images, variants, fields, reviews and local Etsy link rows cascade.
  DELETE FROM products WHERE id IN (SELECT id FROM purge_product_ids);
  GET DIAGNOSTICS product_count = ROW_COUNT;
  IF product_count <> 94 OR order_count <> 14 THEN
    RAISE EXCEPTION 'Unexpected deletion count; rolling back';
  END IF;
  DELETE FROM commerce_archive WHERE
    (kind = 'product' AND record_id IN (SELECT id FROM purge_product_ids)) OR
    (kind = 'order' AND record_id IN (SELECT id FROM purge_order_ids));
  INSERT INTO commerce_cleanup_runs(id, report) VALUES (
    'purge-authorized-legacy-commerce-2026-10-26',
    jsonb_build_object('productsDeleted', product_count, 'ordersDeleted', order_count)
  );
END $purge$;`;

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.info('Legacy purge skipped outside production.');
    return;
  }
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const report = await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '10s'");
      await tx.$executeRawUnsafe(PURGE_SQL);
      return tx.$queryRaw`SELECT report FROM commerce_cleanup_runs WHERE id = ${PURGE_JOB}`;
    }, { timeout: 30000 });
    console.info('Authorized legacy purge verified:', JSON.stringify(report));
  } finally { await prisma.$disconnect(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error('Legacy purge failed:', error.message); process.exitCode = 1; });
}
