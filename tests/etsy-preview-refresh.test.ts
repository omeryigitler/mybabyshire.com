import assert from 'node:assert/strict';
import test from 'node:test';
import { planEtsyPreviewRefresh } from '../lib/etsyPreviewRefresh.js';

test('stale Etsy previews automatically refresh in small batches', () => {
  const inputs = [
    ...Array.from({ length: 120 }, (_, i) => ({ source: 'etsy', id: String(i + 1000), staleData: true })),
    { source: 'site', id: 'any', staleData: true },
    { source: 'etsy', id: '2000', staleData: false },
  ];
  const pages = planEtsyPreviewRefresh(inputs);
  assert.equal(pages.length, 6);
  assert.ok(pages.every(ids => ids.length <= 20));
  assert.equal(pages.flat().length, 120);
  assert.ok(!pages.flat().includes('2000'));
});

test('manual Etsy refresh includes current listings but cannot affect site items', () => {
  const inputs = [
    { source: 'etsy', id: '123', staleData: false },
    { source: 'etsy', id: '456', staleData: true },
    { source: 'etsy', id: '456', staleData: true },
    { source: 'site', id: 'native', staleData: true },
    { source: 'etsy', id: 'bad!', staleData: true },
  ];
  assert.deepEqual(planEtsyPreviewRefresh(inputs, false), [['123', '456']]);
  assert.deepEqual(planEtsyPreviewRefresh(inputs, true), [['456']]);
  assert.deepEqual(planEtsyPreviewRefresh([{ source: 'site', id: 'native' }]), []);
});
