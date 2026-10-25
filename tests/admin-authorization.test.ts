import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createAdminToken, requireAdmin } from '../lib/auth.js';
import { handleEtsyAdmin } from '../lib/etsyAdmin.js';

process.env.JWT_SECRET = 'test-only-secret-not-used-outside-tests';
const sign = (claims: object, options = {}) => jwt.sign(claims, process.env.JWT_SECRET!, { expiresIn: '1h', ...options });

test('only a signed admin identity can pass the shared admin guard', () => {
  assert.equal(requireAdmin('Bearer ' + createAdminToken('admin@example.test')).role, 'admin');
  for (const claims of [
    { id: 'customer', email: 'member@example.test', role: 'customer', type: 'member' },
    { provider: 'google-member' },
    { provider: 'google-admin' },
    { role: 'admin' },
    { id: 'customer', email: 'member@example.test', role: 'admin', type: 'member' },
  ]) assert.throws(() => requireAdmin('Bearer ' + sign(claims)));
  assert.throws(() => requireAdmin(undefined));
  assert.throws(() => requireAdmin('Bearer ' + sign({ id: 'a', email: 'a', role: 'admin' }, { expiresIn: -1 })));
  assert.throws(() => requireAdmin('Bearer ' + jwt.sign({ id: 'a', email: 'a', role: 'admin' }, 'different-key')));
});

test('customer credentials are rejected before Etsy administration touches the database', async () => {
  const req = { method: 'POST', headers: { authorization: 'Bearer ' + sign({ id: 'customer', email: 'member@example.test', role: 'customer', type: 'member' }) }, body: { ids: ['123'], published: true } };
  let status = 0; let body: any;
  const res = { setHeader() {}, status(code: number) { status = code; return this; }, json(value: any) { body = value; return this; } };
  await handleEtsyAdmin(req as any, res as any, 'catalog-manage');
  assert.equal(status, 401);
  assert.match(body.error, /authentication/);
});
