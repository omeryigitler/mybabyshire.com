import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../lib/prisma.js';
import { handleEtsyCatalogAdmin } from '../lib/etsyCatalogAdmin.js';

const item = { listing_id: '123', etsy_title: 'Unique rainbow birthday shirt', description: '', price: 22,
  currency_code: 'USD', quantity: 10, image_urls: ['https://i.etsystatic.com/photo.jpg'], active: true,
  published: false, category_id: 'category', custom_title: null, synced_at: new Date() };

test('legacy publishing obeys category, stock, freshness and duplicate safeguards without partial writes', async t => {
  let row = { ...item }; let linked = false; let duplicate = false; let writes = 0;
  t.mock.method(prisma, '$executeRawUnsafe', async () => 0);
  t.mock.method(prisma, '$queryRaw', async (sql: any) => String(sql).includes('FROM etsy_product_links')
    ? linked ? [{ product_id: 'native', etsy_listing_id: '123', etsy_url: '', etsy_title: '' }] : [] : [row]);
  const originalFindMany = prisma.products.findMany;
  prisma.products.findMany = (async () => duplicate ? [{ id: 'native', name: item.etsy_title, status: 'active' }] : []) as any;
  t.after(() => { prisma.products.findMany = originalFindMany; });
  t.mock.method(prisma, '$transaction', async (fn: any) => fn({ $executeRaw: async () => { writes++; } }));
  const invoke = async (body: object) => {
    let code = 0;
    const res = { status(n: number) { code = n; return this; }, json() { return this; } };
    await handleEtsyCatalogAdmin({ method: 'POST', body: { ids: ['123'], published: true, ...body } } as any, res as any, 'catalog-manage');
    return code;
  };
  row = { ...item, category_id: null as any }; assert.equal(await invoke({}), 409);
  row = { ...item, quantity: 0 }; assert.equal(await invoke({}), 409);
  row = { ...item, price: NaN }; assert.equal(await invoke({}), 409);
  row = { ...item, synced_at: new Date('invalid') };
  // Missing API credentials must fail closed instead of publishing invalid timestamps.
  delete process.env.ETSY_API_KEY; delete process.env.ETSY_SHARED_SECRET;
  assert.equal(await invoke({}), 503);
  row = { ...item }; linked = true; assert.equal(await invoke({}), 409);
  linked = false; duplicate = true; assert.equal(await invoke({}), 409);
  assert.equal(writes, 0);
  assert.equal(await invoke({ confirmPossibleDuplicates: true }), 200);
  assert.equal(writes, 1);
});
