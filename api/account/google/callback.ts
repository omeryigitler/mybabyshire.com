import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

const redirectError = (res: VercelResponse, message: string) => {
  return res.redirect(`/account/login?auth_error=${encodeURIComponent(message)}`);
};

const createSuccessHtml = (token: string) => {
  const tokenJson = JSON.stringify(token);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>MY BABY SHIRE Account</title></head><body><script>localStorage.setItem('mybabyshire-member-token-v1', ${tokenJson}); window.location.replace('/account');</script></body></html>`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return redirectError(res, 'Google sign-in is not configured yet.');
    }

    if (!process.env.JWT_SECRET) {
      return redirectError(res, 'JWT_SECRET is missing in Vercel.');
    }

    if (req.query.error) {
      return redirectError(res, `Google sign-in was cancelled or failed: ${String(req.query.error)}`);
    }

    const code = String(req.query.code || '');
    const state = String(req.query.state || '');

    if (!code || !state) {
      return redirectError(res, 'Missing Google sign-in response.');
    }

    const decodedState = jwt.verify(state, process.env.JWT_SECRET) as { provider?: string };
    if (decodedState.provider !== 'google-member') {
      return redirectError(res, 'Invalid Google sign-in state.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getRedirectUri(req),
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.id_token) {
      return redirectError(res, tokenData.error_description || tokenData.error || 'Google token exchange failed.');
    }

    const profileResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`);
    const profile = await profileResponse.json();

    if (!profileResponse.ok) {
      return redirectError(res, 'Google profile verification failed.');
    }

    const email = String(profile.email || '').trim().toLowerCase();
    const emailVerified = profile.email_verified === true || profile.email_verified === 'true';
    const name = String(profile.name || email.split('@')[0] || 'Customer').trim();

    if (profile.aud !== process.env.GOOGLE_CLIENT_ID || !emailVerified || !email) {
      return redirectError(res, 'Google account could not be verified.');
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    const user = existingUser
      ? await prisma.users.update({
          where: { email },
          data: { name: existingUser.name || name, role: existingUser.role || 'customer' },
        })
      : await prisma.users.create({
          data: {
            name,
            email,
            password_hash: `google-oauth:${String(profile.sub || 'member')}`,
            role: 'customer',
          },
        });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role || 'customer', type: 'member' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(createSuccessHtml(token));
  } catch (error) {
    return redirectError(res, (error as Error).message || 'Google member sign-in failed.');
  }
}
