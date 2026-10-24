import assert from 'node:assert/strict';
import test from 'node:test';
import { getCanonicalEtsyUrl, normalizeEtsyTitle } from '../lib/etsy.js';
import { makeEtsyCatalogCsv } from '../src/utils/etsyCsv.js';
import { titleMatchType, suggestUniqueTitleMatches } from '../lib/etsyMatching.js';

test('normalizes exact product titles without making fuzzy guesses', () => {
  assert.equal(normalizeEtsyTitle('  Bébé   Shirt — Blue! '), 'bebe shirt blue');
  assert.equal(normalizeEtsyTitle('Custom T-Shirt'), 'custom t shirt');
  assert.notEqual(normalizeEtsyTitle('Custom T-Shirt'), normalizeEtsyTitle('Custom T-Shirt XL'));
});

test('constructs only safe Etsy listing destinations', () => {
  assert.equal(getCanonicalEtsyUrl('123456789'), 'https://www.etsy.com/listing/123456789');
  assert.equal(getCanonicalEtsyUrl('12345/../evil'), null);
  assert.equal(getCanonicalEtsyUrl('https://evil.example/123'), null);
  assert.equal(getCanonicalEtsyUrl('123?redirect=https://evil.example'), null);
  assert.equal(getCanonicalEtsyUrl(''), null);
});

test('exports all Etsy URLs as Excel-friendly, formula-safe CSV', () => {
  const csv = makeEtsyCatalogCsv([
    { listingId: '123', title: '=SUM(1,2)', url: 'https://www.etsy.com/listing/123', productName: 'A "custom" shirt' },
    { listingId: '124', title: 'Baby Shirt', url: 'https://www.etsy.com/listing/124', productName: '' },
  ]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('"A ""custom"" shirt"'));
  assert.ok(csv.includes('https://www.etsy.com/listing/124'));
  assert.equal(csv.split('\r\n').filter(Boolean).length, 3);
});
