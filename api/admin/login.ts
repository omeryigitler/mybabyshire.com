import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertAdminLoginAllowed,
  clearAdminLoginAttempts,
  createAdminToken,
  getLoginRateLimitKey,
  hasConfiguredAdminCredentials,
  isConfiguredAdminLogin,
  recordFailedAdminLogin,
} from '../../lib/auth.js';
import { handleMemberAccountRequest } from '../../lib/memberAccount.js';
import { handleAdminGoogleRequest } from '../../lib/adminGoogle.js';

const getRequestIp = (req: VercelRequest) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') return forwardedFor.split(',')[0]?.trim();
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') return realIp;
  return 'unknown';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authMode = String(req.query.authMode || '');

  if (req.method === 'GET' && authMode === 'admin-google') {
    return handleAdminGoogleRequest(req, res);
  }

  if (req.method === 'GET') {
    return handleMemberAccountRequest(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  const loginKey = getLoginRateLimitKey(email, getRequestIp(req));

  try {
    assertAdminLoginAllowed(loginKey);
  } catch (error) {
    return res.status(429).json({ error: (error as Error).message });
  }

  if (!hasConfiguredAdminCredentials()) {
    return res.status(500).json({ error: 'Admin credentials are not configured.' });
  }

  if (isConfiguredAdminLogin(email, password)) {
    clearAdminLoginAttempts(loginKey);
    const token = createAdminToken(email);

    return res.status(200).json({
      token,
      user: {
        email,
        role: 'admin',
      },
    });
  }

  recordFailedAdminLogin(loginKey);
  return res.status(401).json({ error: 'Invalid credentials' });
}
