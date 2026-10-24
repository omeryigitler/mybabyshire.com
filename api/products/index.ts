import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { mapProductForStorefront } from '../../lib/products.js';
import { ensureProductVariantsTable } from '../../lib/variants.js';
import { getEtsyLinks } from '../../lib/etsy.js';
import { getPublishedEtsyProducts, refreshPublishedEtsyWhenDue } from '../../lib/etsyCatalog.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Temporary Preview smoke verification through an existing function (no extra Vercel function).
  if (process.env.VERCEL_ENV === 'preview' && req.query.smoke === 'catalog-read') {
    try {
      const { getEtsyListings } = await import('../../lib/etsy.js');
      const { fetchEtsyDetails } = await import('../../lib/etsyCatalog.js');
      const page = await getEtsyListings(0);
      const details = await fetchEtsyDetails(page.listings.slice(0, 4).map(item => item.listingId));
      return res.status(200).json({ catalogCount: page.total, checked: details.length, images: details.filter(x => x.images.length > 0).length, priced: details.filter(x => x.price > 0).length, currencies: [...new Set(details.map(x => x.currency))] });
    } catch (error) { return res.status(502).json({ error: (error as Error).message.slice(0, 150) }); }
  }
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

    try { await refreshPublishedEtsyWhenDue(); } catch (error) { console.error('Etsy refresh failed', error); }
    const [links, managed] = await Promise.all([getEtsyLinks(), getPublishedEtsyProducts()]);
    const etsyLinks = new Map(links.map(link => [link.productId, link.url]));
    const nativeProducts = products.map((product) => {
      const summary = summaries.get(product.id) || { average: 0, count: 0 };
      return {
        ...mapProductForStorefront(product),
        etsyUrl: etsyLinks.get(product.id) || null,
        ratingAverage: summary.average,
        ratingCount: summary.count,
      };
    });
    const mappedIds = new Set(links.map(link => link.listingId));
    return res.status(200).json([...nativeProducts, ...managed.filter(item => !mappedIds.has(item.id.slice(5)))]);
  } catch (error) {
    console.error('Failed to fetch products', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}
