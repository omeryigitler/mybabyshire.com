import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createAdminToken } from './auth.js';

const prisma = new PrismaClient();
const MEMBER_TOKEN_KEY = 'mybabyshire-member-token-v1';
const ADMIN_TOKEN_KEY = 'mybabyshire-admin-token-v1';

const baseUrl = (req: VercelRequest) => {
  const configured = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configured) return configured;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
};

const redirectUri = (req: VercelRequest) => {
  return process.env.GOOGLE_MEMBER_REDIRECT_URI?.replace(/\/$/, '') || `${baseUrl(req)}/api/account/google/callback`;
};

const adminEmails = () => [process.env.ADMIN_EMAIL, process.env.GOOGLE_ADMIN_EMAILS]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const isAdminEmail = (email: string) => adminEmails().includes(email.trim().toLowerCase());

const fail = (res: VercelResponse, message: string) => {
  return res.redirect(`/login?auth_error=${encodeURIComponent(message)}`);
};

const loginHtml = (token: string, role: 'member' | 'admin') => {
  const tokenKey = role === 'admin' ? ADMIN_TOKEN_KEY : MEMBER_TOKEN_KEY;
  const removeKey = role === 'admin' ? MEMBER_TOKEN_KEY : ADMIN_TOKEN_KEY;
  const target = role === 'admin' ? '/admin' : '/account';
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body><script>localStorage.setItem('${tokenKey}', ${JSON.stringify(token)}); localStorage.removeItem('${removeKey}'); localStorage.removeItem('little-wonders-admin-token-v2'); window.location.replace('${target}');</script></body></html>`;
};

const memberFromRequest = (req: VercelRequest) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing.');
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET) as any;
  if (!decoded?.id || decoded.type !== 'member') return null;
  return decoded as { id: string; email: string; name?: string; role?: string };
};

const addressPayload = (body: any) => ({
  label: String(body.label || 'Home').trim() || 'Home',
  full_name: String(body.fullName || body.full_name || '').trim(),
  phone: String(body.phone || '').trim() || null,
  address_line1: String(body.addressLine1 || body.address_line1 || '').trim(),
  address_line2: String(body.addressLine2 || body.address_line2 || '').trim() || null,
  city: String(body.city || '').trim(),
  state: String(body.state || '').trim() || null,
  postal_code: String(body.postalCode || body.postal_code || '').trim(),
  country: String(body.country || 'US').trim().toUpperCase() || 'US',
  is_default: Boolean(body.isDefault || body.is_default),
});

const mapAddress = (address: any) => ({
  id: address.id,
  label: address.label,
  fullName: address.full_name,
  phone: address.phone,
  addressLine1: address.address_line1,
  addressLine2: address.address_line2,
  city: address.city,
  state: address.state,
  postalCode: address.postal_code,
  country: address.country,
  isDefault: address.is_default,
});

export async function handleMemberAccountRequest(req: VercelRequest, res: VercelResponse) {
  const route = String(req.query.accountRoute || '');

  if (route === 'me') {
    try {
      const member = memberFromRequest(req);
      if (!member) return res.status(401).json({ error: 'Unauthorized' });
      const user = await prisma.users.findUnique({ where: { id: member.id }, include: { profile: true, addresses: { orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }] }, payment_methods: { orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }] } } });
      if (!user) return res.status(404).json({ error: 'Member not found' });
      return res.status(200).json({ member: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.created_at, phone: user.profile?.phone || '', addresses: user.addresses.map(mapAddress), paymentMethods: user.payment_methods.map((method: any) => ({ id: method.id, brand: method.brand, last4: method.last4, expMonth: method.exp_month, expYear: method.exp_year, isDefault: method.is_default })) } });
    } catch (error) {
      return res.status(500).json({ error: 'Member profile could not be loaded', details: (error as Error).message });
    }
  }

  if (route === 'profile' && req.method === 'POST') {
    try {
      const member = memberFromRequest(req);
      if (!member) return res.status(401).json({ error: 'Unauthorized' });
      const name = String(req.body.name || '').trim();
      const phone = String(req.body.phone || '').trim();
      if (!name) return res.status(400).json({ error: 'Name is required.' });
      const user = await prisma.users.update({ where: { id: member.id }, data: { name } });
      await prisma.user_profiles.upsert({ where: { user_id: member.id }, update: { phone }, create: { user_id: member.id, phone } });
      return res.status(200).json({ member: { id: user.id, name: user.name, email: user.email, phone } });
    } catch (error) {
      return res.status(500).json({ error: 'Member profile could not be saved', details: (error as Error).message });
    }
  }

  if (route === 'addresses' && req.method === 'POST') {
    try {
      const member = memberFromRequest(req);
      if (!member) return res.status(401).json({ error: 'Unauthorized' });
      const data = addressPayload(req.body);
      if (!data.full_name || !data.address_line1 || !data.city || !data.postal_code || !data.country) return res.status(400).json({ error: 'Full name, address, city, postal code and country are required.' });
      if (data.is_default) await prisma.user_addresses.updateMany({ where: { user_id: member.id }, data: { is_default: false } });
      const address = await prisma.user_addresses.create({ data: { ...data, user_id: member.id } });
      return res.status(200).json({ address: mapAddress(address) });
    } catch (error) {
      return res.status(500).json({ error: 'Address could not be saved', details: (error as Error).message });
    }
  }

  if (route === 'orders') {
    try {
      const member = memberFromRequest(req);
      if (!member) return res.status(401).json({ error: 'Unauthorized' });
      const orders = await prisma.orders.findMany({ where: { customer_email: { equals: member.email, mode: 'insensitive' } }, include: { items: true }, orderBy: { created_at: 'desc' } });
      return res.status(200).json({ orders: orders.map((order: any) => ({ id: order.id, orderNumber: order.order_number, orderStatus: order.order_status, paymentStatus: order.payment_status, totalAmount: Number(order.total_amount), currency: order.currency, createdAt: order.created_at, trackingReference: order.tracking_reference, items: order.items.map((item: any) => ({ id: item.id, productName: item.product_name_snapshot, quantity: Number(item.quantity) || 1, price: Number(item.price_snapshot) || 0 })) })) });
    } catch (error) {
      return res.status(500).json({ error: 'Member orders could not be loaded', details: (error as Error).message });
    }
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return fail(res, 'Google sign-in is not configured.');
  if (!process.env.JWT_SECRET) return fail(res, 'JWT_SECRET is missing.');

  if (!req.query.code && !req.query.error) {
    const state = jwt.sign({ provider: 'google-member', createdAt: Date.now() }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri(req), response_type: 'code', scope: 'openid email profile', prompt: 'select_account', state });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }

  try {
    if (req.query.error) return fail(res, `Google sign-in failed: ${String(req.query.error)}`);
    const code = String(req.query.code || '');
    const state = String(req.query.state || '');
    if (!code || !state) return fail(res, 'Missing Google response.');
    const decodedState = jwt.verify(state, process.env.JWT_SECRET) as { provider?: string };
    if (decodedState.provider !== 'google-member') return fail(res, 'Invalid Google state.');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri(req), grant_type: 'authorization_code' }) });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.id_token) return fail(res, tokenData.error_description || tokenData.error || 'Google token failed.');

    const profileResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`);
    const profile = await profileResponse.json();
    const email = String(profile.email || '').trim().toLowerCase();
    const verified = profile.email_verified === true || profile.email_verified === 'true';
    if (!profileResponse.ok || profile.aud !== process.env.GOOGLE_CLIENT_ID || !verified || !email) return fail(res, 'Google account could not be verified.');

    if (isAdminEmail(email)) {
      const adminToken = createAdminToken(email);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(loginHtml(adminToken, 'admin'));
    }

    const name = String(profile.name || email.split('@')[0] || 'Customer').trim();
    const existing = await prisma.users.findUnique({ where: { email } });
    const user = existing ? await prisma.users.update({ where: { email }, data: { name: existing.name || name, role: existing.role || 'customer' } }) : await prisma.users.create({ data: { name, email, password_hash: `google-oauth:${String(profile.sub || 'member')}`, role: 'customer' } });
    const memberToken = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'customer', type: 'member' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(loginHtml(memberToken, 'member'));
  } catch (error) {
    return fail(res, (error as Error).message || 'Google member sign-in failed.');
  }
}
