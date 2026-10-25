import assert from 'node:assert/strict';
import test from 'node:test';
import { getEtsyHomeProducts, getHomeNewArrivals } from '../src/utils/catalogVisibility.js';
import type { Product } from '../src/store/useStore.js';

const product = (id: string, opts: Partial<Product> = {}): Product => ({
  id, name: id, description: '', price: 20, imageUrl: 'https://example.com/image.jpg', ...opts,
});

test('a new Etsy publication appears on the homepage without editorial flags', () => {
  const native = Array.from({ length: 94 }, (_, i) => product(String(i), { source: 'native', newArrival: i < 20 }));
  const newEtsy = product('etsy-4579951371', { source: 'etsy', newArrival: false });
  const all = [...native, newEtsy];
  assert.deepEqual(getEtsyHomeProducts(all).map(p => p.id), ['etsy-4579951371']);
  assert.equal(getHomeNewArrivals(all)[0].id, newEtsy.id);
  assert.equal(getHomeNewArrivals(all).length, 8);
});

test('home spotlight never shows drafts (storefront API supplies only published products)', () => {
  const all = [product('first', { source: 'etsy' }), product('native', { source: 'native' })];
  assert.deepEqual(getEtsyHomeProducts(all).map(p => p.id), ['first']);
  assert.equal(getHomeNewArrivals(all)[0].id, 'first');
  assert.equal(getEtsyHomeProducts([], 4).length, 0);
});
