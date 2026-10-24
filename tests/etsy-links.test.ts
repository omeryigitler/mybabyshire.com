import assert from 'node:assert/strict';
import test from 'node:test';
import { getCanonicalEtsyUrl, normalizeEtsyTitle } from '../lib/etsy.js';

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
