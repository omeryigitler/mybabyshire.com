import test from 'node:test';
import assert from 'node:assert/strict';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import express from 'express';
import app from '../api/[...path].js';
import router from '../server/api.js';
import { buildVerifiedCheckout, createPendingOrderFromCheckout } from '../lib/checkout.js';
import { exactTransitionMatches } from '../lib/etsyTransition.js';

for (const [name, application] of [['Vercel', app], ['standalone', express().use(express.json()).use('/api', router)]] as const) {
  test(`${name}: all payment creation aliases reject before DB access; old capture route remains available`, async t => {
    const dispatch = (path: string) => new Promise<{ status: number; body: any }>((resolve, reject) => {
      const req = Object.assign(new IncomingMessage(new Socket()), { method: 'POST', url: path, body: {} });
      const res = new ServerResponse(req);
      res.end = ((body: any) => { resolve({ status: res.statusCode, body: JSON.parse(String(body)) }); return res; }) as any;
      application(req as any, res as any, reject);
    });
    for (const path of ['/api/checkout/create-payment', '/api/paypal/create-order', '/api/paypal-create-order', '/api/paypal-create-order/', '/api/cart/sync']) {
      const response = await dispatch(path);
      assert.equal(response.status, 409, path);
      assert.equal(response.body.code, 'ETSY_ONLY_CHECKOUT');
    }
    for (const path of ['/api/paypal/capture-order', '/api/paypal-capture-order']) {
      const response = await dispatch(path);
      assert.equal(response.status, 400, 'Old capture handler must still validate missing parameters');
    }
  });
}

test('shared checkout functions cannot bypass Etsy-only mode', async () => {
  await assert.rejects(buildVerifiedCheckout({}), (e: any) => e.statusCode === 409);
  await assert.rejects(createPendingOrderFromCheckout({} as any, 'stripe'), (e: any) => e.statusCode === 409);
});

test('transition links only globally unique whole titles, never prefixes or ambiguous products', () => {
  const title = 'Personalized One Today First Birthday Shirt';
  const listing = { listingId: '10', title, url: 'https://www.etsy.com/listing/10', state: 'active' };
  const products = [{ id: 'one', name: title }];
  assert.equal(exactTransitionMatches(products, [listing], []).length, 1);
  assert.equal(exactTransitionMatches(products, [{ ...listing, title: title + ', Dinosaur' }], []).length, 0);
  assert.equal(exactTransitionMatches([...products, { id: 'two', name: title }], [listing], []).length, 0);
  assert.equal(exactTransitionMatches(products, [listing, { ...listing, listingId: '20' }], []).length, 0);
  assert.equal(exactTransitionMatches(products, [listing], [{ productId: 'different', listingId: '10' }]).length, 0);
  assert.equal(exactTransitionMatches(products, [listing], [{ productId: 'one', listingId: '20' }]).length, 0);
});
