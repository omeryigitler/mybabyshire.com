import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ensureNewsletterTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'subscribed',
      source TEXT NOT NULL DEFAULT 'storefront',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getAuthorization = (req: VercelRequest) => {
  const value = req.headers.authorization;
  return Array.isArray(value) ? value[0] : value;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureNewsletterTable();

    if (req.method === 'POST') {
      const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 254);
      if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });

      await prisma.$executeRaw`
        INSERT INTO newsletter_subscribers (id, email, status, source)
        VALUES (${randomUUID()}, ${email}, 'subscribed', 'storefront')
        ON CONFLICT (email)
        DO UPDATE SET status = 'subscribed', updated_at = NOW()
      `;

      return res.status(200).json({ success: true, message: 'You are subscribed.' });
    }

    if (req.method === 'GET') {
      try {
        requireAdmin(getAuthorization(req));
      } catch (error) {
        return res.status(401).json({ error: (error as Error).message || 'Unauthorized' });
      }

      const subscribers = await prisma.$queryRaw<Array<{ id: string; email: string; status: string; source: string; created_at: Date; updated_at: Date }>>`
        SELECT id, email, status, source, created_at, updated_at
        FROM newsletter_subscribers
        ORDER BY created_at DESC
        LIMIT 1000
      `;

      return res.status(200).json(subscribers.map((subscriber) => ({
        id: subscriber.id,
        email: subscriber.email,
        status: subscriber.status,
        source: subscriber.source,
        createdAt: subscriber.created_at,
        updatedAt: subscriber.updated_at,
      })));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Newsletter request failed', error);
    return res.status(500).json({ error: 'Newsletter signup is temporarily unavailable.' });
  }
}
