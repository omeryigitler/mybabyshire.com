import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../lib/prisma.js';
import handler from '../api/products/[...path].js';

test('Etsy detail responds from safe cached data without waiting for an unavailable upstream', async t => {
  const tasks: Promise<unknown>[] = [];
  const context = Symbol.for('@vercel/request-context');
  (globalThis as any)[context] = { get: () => ({ waitUntil: (task: Promise<unknown>) => tasks.push(task) }) };
  t.after(() => { delete (globalThis as any)[context]; });
  let rejectRefresh!: (reason: Error) => void;
  t.mock.method(prisma, '$executeRawUnsafe', async () => 0);
  t.mock.method(prisma, '$queryRaw', (sql: any) => {
    if (String(sql).includes('INSERT INTO etsy_refresh_leases')) return new Promise((_resolve, reject) => { rejectRefresh = reject; });
    return Promise.resolve([{ listing_id: '123', etsy_title: 'Old title', description: 'Old details', price: 22,
      currency_code: 'USD', quantity: 10, image_urls: ['https://i.etsystatic.com/photo.jpg'], active: true,
      published: true, category_id: 'category', custom_title: null, synced_at: new Date(0) }]);
  });
  t.mock.method(console, 'error', () => {});
  let status = 0; let body: any;
  const response = { status(n: number) { status = n; return this; }, json(value: any) { body = value; return this; } };
  await handler({ method: 'GET', url: '/api/products/etsy-123', query: {} } as any, response as any);
  assert.equal(status, 200);
  assert.equal(body.priceStale, true);
  assert.deepEqual(body.imageUrls, []);
  assert.equal(body.etsyUrl, 'https://www.etsy.com/listing/123');
  assert.equal(tasks.length, 1);
  rejectRefresh(new Error('Etsy temporary outage'));
  await Promise.all(tasks);
  assert.equal(status, 200);
});
