import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../lib/prisma.js';
import handler from '../api/products/index.js';
import detail from '../api/products/[...path].js';
import { handleSitePreview } from '../lib/sitePreview.js';
import { canBuyDirect } from '../src/config/commerce.js';

const item = { listing_id: '123', etsy_title: 'Etsy birthday shirt', description: '', price: 22,
  currency_code: 'USD', quantity: 10, image_urls: ['https://i.etsystatic.com/photo.jpg'], active: true,
  published: true, category_id: 'category', custom_title: null, synced_at: new Date() };
const response = () => ({ code: 0, body: null as any, status(n: number) { this.code = n; return this; }, json(b: any) { this.body = b; return this; } });

test('Etsy-only catalog reads no native products and hides legacy detail URLs', async t => {
  const tasks: Promise<unknown>[] = [];
  const context = Symbol.for('@vercel/request-context');
  (globalThis as any)[context] = { get: () => ({ waitUntil: (p: Promise<unknown>) => tasks.push(p) }) };
  t.after(() => { delete (globalThis as any)[context]; });
  t.mock.method(prisma, '$executeRawUnsafe', async () => 0);
  t.mock.method(prisma, '$transaction', async () => null);
  t.mock.method(prisma, '$queryRaw', async (sql: any) => String(sql).includes('SELECT e.listing_id, e.etsy_title') ? [item] : []);
  const original = prisma.products.findMany;
  prisma.products.findMany = (async () => { throw new Error('Native catalog must not be queried'); }) as any;
  t.after(() => { prisma.products.findMany = original; });
  const res = response();
  await handler({ method: 'GET' } as any, res as any);
  assert.equal(res.code, 200); assert.deepEqual(res.body.map((p: any) => p.id), ['etsy-123']);
  assert.equal(res.body[0].etsyUrl, 'https://www.etsy.com/listing/123');
  await Promise.all(tasks);
  const old = response();
  await detail({ method: 'GET', url: '/api/products/old-native-product', query: {} } as any, old as any);
  assert.equal(old.code, 404);
});

test('Etsy unpublish is reversible and never deletes or updates the upstream listing', async t => {
  t.mock.method(prisma, '$executeRawUnsafe', async () => 0);
  t.mock.method(prisma, '$queryRaw', async () => [{ ...item, synced_at: new Date(0) }]);
  const writes: string[] = [];
  t.mock.method(prisma, '$transaction', async (fn: any) => fn({ $executeRaw: async (sql: any) => { writes.push(String(sql)); return 1; } }));
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unpublishing must not call Etsy'); });
  const res = response();
  await handleSitePreview({ method: 'POST', body: { source: 'etsy', ids: ['123'], operation: 'unpublish' } } as any, res as any);
  assert.equal(res.code, 200); assert.equal(writes.length, 1);
  assert.match(writes[0], /SET published = FALSE/); assert.doesNotMatch(writes[0], /DELETE/);
});

test('native drafts cannot be published while only Etsy is enabled', async () => {
  const res = response();
  await handleSitePreview({ method: 'POST', body: { source: 'site', ids: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'], operation: 'publish' } } as any, res as any);
  assert.equal(res.code, 409);
});

test('future dual mode enables local inventory without treating Etsy imports as local stock', () => {
  assert.equal(canBuyDirect({}, 'etsy'), false);
  assert.equal(canBuyDirect({}, 'dual'), true);
  assert.equal(canBuyDirect({ source: 'etsy' }, 'dual'), false);
});
