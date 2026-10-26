import { readEtsyTransitionReport } from './etsyTransition.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './prisma.js';
import { handleEtsyCatalogAdmin } from './etsyCatalogAdmin.js';
import { handleSitePreview } from './sitePreview.js';
import { titleMatchType } from './etsyMatching.js';
import { requireAdmin } from './auth.js';
import {
  etsyIsConfigured, getEtsyShopId, getEtsyListings, getVerifiedEtsyListing,
  getEtsyLinks, saveEtsyLink, removeEtsyLink, createEtsyLinksTable,
} from './etsy.js';

const getAuth = (req: VercelRequest) => Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;

export async function handleEtsyAdmin(req: VercelRequest, res: VercelResponse, action: string): Promise<VercelResponse> {
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    requireAdmin(getAuth(req));
  } catch {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  try {
    if (req.method === 'GET' && action === 'transition-status') return res.status(200).json({ runs: await readEtsyTransitionReport() });
    if (action === 'site-preview') return handleSitePreview(req, res);
    if (action.startsWith('catalog-')) {
      const result = await handleEtsyCatalogAdmin(req, res, action);
      return result || res.status(405).json({ error: 'Unsupported catalog operation.' });
    }
    if (req.method === 'GET' && action === 'status') {
      if (!etsyIsConfigured()) return res.status(200).json({ configured: false, connected: false });
      const [shopId, links] = await Promise.all([getEtsyShopId(), getEtsyLinks()]);
      return res.status(200).json({ configured: true, connected: true, shopName: 'babyshirekids', shopId, linkedProducts: links.length });
    }

    if (req.method === 'GET' && action === 'listings') {
      const offset = Number(req.query.offset || 0);
      if (!Number.isInteger(offset) || offset < 0 || offset > 12000 || offset % 100 !== 0) return res.status(400).json({ error: 'Invalid page offset.' });
      return res.status(200).json(await getEtsyListings(offset));
    }

    if (req.method === 'GET' && action === 'links') {
      return res.status(200).json({ links: await getEtsyLinks() });
    }

    if (req.method === 'POST' && action === 'link') {
      const productId = String(req.body?.productId || '').trim();
      const listingId = String(req.body?.listingId || '').trim();
      if (!productId || !/^\d{1,20}$/.test(listingId)) return res.status(400).json({ error: 'Provide a product ID and numeric listing ID.' });
      const product = await prisma.products.findUnique({ where: { id: productId }, select: { id: true } });
      if (!product) return res.status(404).json({ error: 'Site product not found.' });
      const listing = await getVerifiedEtsyListing(listingId);
      await createEtsyLinksTable();
      const saved = await saveEtsyLink(productId, listing);
      if (!saved) return res.status(409).json({ error: 'Product already linked. Unlink it before changing its Etsy listing.' });
      return res.status(200).json({ linked: true, productId, listing });
    }

    if (req.method === 'DELETE' && action === 'link') {
      const productId = String(req.body?.productId || '').trim();
      if (!productId) return res.status(400).json({ error: 'Product ID is required.' });
      await createEtsyLinksTable();
      await removeEtsyLink(productId);
      return res.status(200).json({ unlinked: true, productId });
    }

    if (req.method === 'POST' && action === 'bulk-link') {
      if (req.body?.confirmed !== true) return res.status(400).json({ error: 'Explicit confirmation is required.' });
      const offset = Number(req.body?.offset);
      const pairs = req.body?.pairs;
      if (!Number.isInteger(offset) || offset < 0 || offset > 12000 || offset % 100 !== 0 ||
          !Array.isArray(pairs) || pairs.length > 100 ||
          pairs.some((pair: any) => !pair || typeof pair.productId !== 'string' || !/^\d{1,20}$/.test(String(pair.listingId)))) {
        return res.status(400).json({ error: 'Invalid batch. Maximum 100 validated matches per Etsy page.' });
      }
      const [page, products, existing] = await Promise.all([
        getEtsyListings(offset),
        prisma.products.findMany({ select: { id: true, name: true } }),
        getEtsyLinks(),
      ]);
      const available = new Map(page.listings.map((listing) => [listing.listingId, listing]));
      const productById = new Map(products.map((product) => [product.id, product]));
      const reservedProducts = new Set(existing.map((link) => link.productId));
      const reservedListings = new Set(existing.map((link) => link.listingId));
      await createEtsyLinksTable();
      let created = 0;
      let skipped = 0;
      for (const pair of pairs as Array<{ productId: string; listingId: string }>) {
        const product = productById.get(pair.productId);
        const listing = available.get(String(pair.listingId));
        if (!product || !listing || !titleMatchType(product.name, listing.title) ||
            products.filter(p => titleMatchType(p.name, listing.title)).length !== 1 ||
            page.listings.filter(l => titleMatchType(product.name, l.title)).length !== 1 ||
            reservedProducts.has(product.id) || reservedListings.has(listing.listingId)) {
          skipped++;
          continue;
        }
        try {
          if (await saveEtsyLink(product.id, listing)) {
            created++;
            reservedProducts.add(product.id);
            reservedListings.add(listing.listingId);
          } else {
            skipped++;
          }
        } catch (error) {
          // Unique listing constraints protect against linking a listing to multiple site products.
          if ((error as any)?.code === 'P2002' || (error as any)?.meta?.code === '23505') { skipped++; continue; }
          throw error;
        }
      }
      return res.status(200).json({ created, skipped });
    }

    return res.status(405).json({ error: 'Unsupported Etsy operation.' });
  } catch (error) {
    // Do not expose Etsy response bodies, credentials or internal SQL to the browser.
    console.error('Etsy integration request failed', (error as Error).message);
    const message = (error as Error).message || 'Etsy operation failed.';
    const safe = message.startsWith('Etsy ') || message.startsWith('The configured Etsy ') || message.startsWith('Listing ') || message.startsWith('ETSY_');
    return res.status(502).json({ error: safe ? message : 'Etsy operation could not be completed.' });
  }
}
