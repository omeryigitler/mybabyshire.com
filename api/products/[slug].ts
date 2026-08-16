import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { mapProductForStorefront } from '../../lib/products.js';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slug = String(req.query.slug || '').trim();
  if (!slug) {
    return res.status(400).json({ error: 'Product slug is required.' });
  }

  try {
    const product = await prisma.products.findFirst({
      where: { slug, status: 'active' },
      include: {
        images: true,
        category: true,
        personalization_fields: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const summary = await getApprovedReviewSummary(product.id);
    return res.status(200).json({
      ...mapProductForStorefront(product),
      ratingAverage: summary.average,
      ratingCount: summary.count,
    });
  } catch (error) {
    console.error('Failed to fetch product', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
}
