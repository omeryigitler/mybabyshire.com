import { ETSY_ONLY_MODE } from '../../src/config/commerce.js';
import { waitUntil } from '@vercel/functions';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import apiRoutes from '../../server/api.js';
import { prisma } from '../../lib/prisma.js';
import { mapProductForStorefront } from '../../lib/products.js';
import { getProductEtsyUrl } from '../../lib/etsy.js';
import { getPublishedEtsyProducts, refreshPublishedEtsyWhenDue } from '../../lib/etsyCatalog.js';
import { ensureProductVariantsTable } from '../../lib/variants.js';

const legacyApp = express();
legacyApp.use(express.json({ limit: '25mb' }));
legacyApp.use('/api', apiRoutes);

const pathParts = (req: VercelRequest) => {
  try {
    const pathname = new URL(req.url || '/', 'https://mybabyshire.local').pathname;
    const marker = '/api/products/';
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex >= 0) {
      return pathname
        .slice(markerIndex + marker.length)
        .split('/')
        .map((part) => decodeURIComponent(part))
        .filter(Boolean);
    }
  } catch {
    // Fall through to the query representation used by local adapters.
  }

  const value = req.query.path;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split('/').filter(Boolean);
  return [];
};

const getApprovedReviewSummary = async (productId: string) => {
  try {
    const aggregate = await prisma.product_reviews.aggregate({
      where: { product_id: productId, status: 'approved' },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      average: Math.round(Number(aggregate._avg.rating || 0) * 10) / 10,
      count: aggregate._count._all,
    };
  } catch (error) {
    console.error('Failed to load product review summary', error);
    return { average: 0, count: 0 };
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const parts = pathParts(req);

  if (req.method === 'GET' && parts.length === 1) {
    const slug = parts[0];
    if (/^etsy-[0-9]{1,20}$/.test(slug)) {
      try {
        waitUntil(refreshPublishedEtsyWhenDue().catch(error => console.error('Etsy refresh failed', error)));
        const item = (await getPublishedEtsyProducts()).find(product => product.slug === slug);
        return item ? res.status(200).json(item) : res.status(404).json({ error: 'Product unavailable' });
      } catch (error) {
        console.error('Etsy product detail lookup failed', error);
        return res.status(503).json({ error: 'Etsy item temporarily unavailable' });
      }
    }

    if (ETSY_ONLY_MODE) return res.status(404).json({ error: 'Product unavailable' });
    try {
      await ensureProductVariantsTable();
      const product = await prisma.products.findFirst({
        where: { slug, status: 'active' },
        include: {
          images: true,
          category: true,
          personalization_fields: true,
          variants: { where: { active: true }, orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }] },
        },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const summary = await getApprovedReviewSummary(product.id);
      return res.status(200).json({
        ...mapProductForStorefront(product),
        etsyUrl: await getProductEtsyUrl(product.id),
        ratingAverage: summary.average,
        ratingCount: summary.count,
      });
    } catch (error) {
      console.error('Failed to fetch product', error);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  return legacyApp(req as any, res as any);
}
