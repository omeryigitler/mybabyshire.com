import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEtsyListings } from '../lib/etsy.js';
import { fetchEtsyDetails } from '../lib/etsyCatalog.js';

// Temporary read-only deployment verification. This file is deleted before production.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({});
  try {
    const page = await getEtsyListings(0);
    const ids = page.listings.slice(0, 4).map(x => x.listingId);
    const details = await fetchEtsyDetails(ids);
    return res.status(200).json({
      shopVerified: page.shopName === 'babyshirekids',
      activeListings: page.total, checkedCount: ids.length,
      withImages: details.filter(item => item.images.length > 0).length,
      withPrice: details.filter(item => item.price > 0).length,
      currencies: [...new Set(details.map(item => item.currency))],
    });
  } catch (error) {
    return res.status(502).json({ valid: false, reason: (error as Error).message.slice(0, 120) });
  }
}
