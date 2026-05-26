import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const getBaseUrl = (req: VercelRequest) => {
  const configuredUrl = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configuredUrl) return configuredUrl;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
};

const getRedirectUri = (req: VercelRequest) => {
  const configuredRedirect = process.env.GOOGLE_MEMBER_REDIRECT_URI?.replace(/\/$/, '');
  if (configuredRedirect) return configuredRedirect;
  return `${getBaseUrl(req)}/api/account/google/callback`;
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`/account/login?auth_error=${encodeURIComponent('Google sign-in is not configured yet.')}`);
  }

  if (!process.env.JWT_SECRET) {
    return res.redirect(`/account/login?auth_error=${encodeURIComponent('JWT_SECRET is missing in Vercel.')}`);
  }

  const state = jwt.sign(
    { provider: 'google-member', createdAt: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '10m' },
  );

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
