import test from 'node:test';
import assert from 'node:assert/strict';
import { etsyRequest } from '../lib/etsyHttp.js';
process.env.ETSY_API_KEY = 'test-key'; process.env.ETSY_SHARED_SECRET = 'test-secret';

test('retries a temporary Etsy outage once with server-side credentials', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url: any, options: any) => {
    assert.equal(options.headers['x-api-key'], 'test-key:test-secret');
    return ++calls === 1 ? new Response('', { status: 503 }) : Response.json({ results: [] });
  });
  assert.deepEqual(await etsyRequest('/listings/batch?listing_ids=123'), { results: [] });
  assert.equal(calls, 2);
});

test('long rate limits and authentication failures do not create retry storms or expose secrets', async t => {
  for (const status of [429, 401, 403]) {
    let calls = 0;
    const mock = t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response('private remote error', { status, headers: { 'retry-after': '60' } }); });
    await assert.rejects(etsyRequest('/shops'), error => !String(error).includes('test-secret') && !String(error).includes('private remote'));
    assert.equal(calls, 1); mock.mock.restore();
  }
});
