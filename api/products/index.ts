import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { mapProductForStorefront } from '../../lib/products.js';
import { ensureProductVariantsTable } from '../../lib/variants.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureProductVariantsTable();
    const products = await prisma.products.findMany({
      where: { status: 'active' },
      include: {
        images: true,
        category: true,
        personalization_fields: true,
        variants: { where: { active: true }, orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }] },
      },
      orderBy: { created_at: 'desc' },
    });

    let summaries = new Map<string, { average: number; count: number }>();
    try {
      const grouped = await prisma.product_reviews.groupBy({
        by: ['product_id'],
        where: { product_id: { in: products.map((product) => product.id) }, status: 'approved' },
        _avg: { rating: true },
        _count: { _all: true },
      });

      summaries = new Map(grouped.map((row) => [
        row.product_id,
        {
          average: Math.round(Number(row._avg.rating || 0) * 10) / 10,
          count: row._count._all,
        },
      ]));
    } catch (error) {
      console.error('Failed to load catalog review summaries', error);
    }

    return res.status(200).json(products.map((product) => {
      const summary = summaries.get(product.id) || { average: 0, count: 0 };
      return {
        ...mapProductForStorefront(product),
        ratingAverage: summary.average,
        ratingCount: summary.count,
      };
    }));
  } catch (error) {
    console.error('Failed to fetch products', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}
