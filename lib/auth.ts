import jwt from 'jsonwebtoken';
import { createHash, timingSafeEqual } from 'node:crypto';

const DEVELOPMENT_JWT_SECRET = 'fallback-secret-development';
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;

type LoginAttempt = {
  count: number;
  firstFailureAt: number;
  lockedUntil?: number;
};

const loginAttempts = new Map<string, LoginAttempt>();

export class AuthRateLimitError extends Error {
  statusCode = 429;

  constructor() {
    super('Too many failed login attempts. Please wait and try again.');
    this.name = 'AuthRateLimitError';
  }
}

export const getJwtSecret = () => {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) return configuredSecret;

  const isProductionRuntime =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production';

  if (isProductionRuntime) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return DEVELOPMENT_JWT_SECRET;
};

const constantTimeEqual = (left: string, right: string) => {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
};

export const getLoginRateLimitKey = (email?: string, ip?: string | string[]) => {
  const ipAddress = Array.isArray(ip) ? ip[0] : ip;
  return `${String(email || '').trim().toLowerCase()}|${String(ipAddress || 'unknown').trim()}`;
};

export const assertAdminLoginAllowed = (key: string) => {
  const attempt = loginAttempts.get(key);
  const now = Date.now();

  if (!attempt) return;

  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    throw new AuthRateLimitError();
  }

  if (now - attempt.firstFailureAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
  }
};

export const recordFailedAdminLogin = (key: string) => {
  const now = Date.now();
  const current = loginAttempts.get(key);
  const attempt =
    current && now - current.firstFailureAt <= LOGIN_WINDOW_MS
      ? current
      : { count: 0, firstFailureAt: now };

  attempt.count += 1;

  if (attempt.count >= MAX_FAILED_LOGINS) {
    attempt.lockedUntil = now + LOGIN_LOCK_MS;
  }

  loginAttempts.set(key, attempt);
};

export const clearAdminLoginAttempts = (key: string) => {
  loginAttempts.delete(key);
};

export const getAdminCredentials = () => ({
  email: process.env.ADMIN_EMAIL?.trim(),
  password: process.env.ADMIN_PASSWORD,
});

export const hasConfiguredAdminCredentials = () => {
  const { email, password } = getAdminCredentials();
  return Boolean(email && password);
};

export const isConfiguredAdminLogin = (email?: string, password?: string) => {
  const adminCredentials = getAdminCredentials();

  if (!adminCredentials.email || !adminCredentials.password || !email || !password) {
    return false;
  }

  return (
    constantTimeEqual(email.trim().toLowerCase(), adminCredentials.email.toLowerCase()) &&
    constantTimeEqual(password, adminCredentials.password)
  );
};

export const createAdminToken = (email = getAdminCredentials().email || 'admin') => {
  return jwt.sign({ id: 'admin1', email, role: 'admin' }, getJwtSecret(), {
    expiresIn: '1d',
  });
};

export const requireAdmin = (authorization?: string) => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing token');
  }

  const token = authorization.split(' ')[1];
  return jwt.verify(token, getJwtSecret());
};
