import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';

const SITE_URL = 'https://www.mybabyshire.com';
const STATIC_ROUTES = [
  '/',
  '/collections/all',
  '/collections/new-arrivals',
  '/collections/best-sellers',
  '/collections/baby',
  '/collections/toddler',
  '/collections/kids',
  '/collections/adult',
  '/collections/sweatshirts',
  '/track-order',
  '/policies/shipping',
  '/policies/returns',
  '/policies/privacy',
  '/policies/terms',
];

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character] || character));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  try {
    const products = await prisma.products.findMany({
      where: { status: 'active' },
      select: { slug: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
    });

    const staticUrls = STATIC_ROUTES.map((path) => `<url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc></url>`).join('');
    const productUrls = products.map((product) => `<url><loc>${escapeXml(`${SITE_URL}/products/${product.slug}`)}</loc><lastmod>${product.updated_at.toISOString()}</lastmod></url>`).join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${productUrls}</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Failed to generate sitemap', error);
    return res.status(500).send('Could not generate sitemap');
  }
}
