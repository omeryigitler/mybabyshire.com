import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleSitePreview } from './sitePreview.js';
import { prisma } from './prisma.js';
import { getEtsyListings, getEtsyLinks } from './etsy.js';
import {
  ensureEtsyCatalogTable, fetchEtsyDetails, importCatalogIds, readManagedEtsyCatalog,
  syncCatalogBatch,
} from './etsyCatalog.js';

const allowedId = (id: unknown): id is string => typeof id === 'string' && /^\d{1,20}$/.test(id);
const ownIdList = (ids: unknown, max = 25): ids is string[] =>
  Array.isArray(ids) && ids.length > 0 && ids.length <= max && ids.every(allowedId) && new Set(ids).size === ids.length;

export async function handleEtsyCatalogAdmin(req: VercelRequest, res: VercelResponse, action: string): Promise<VercelResponse | undefined> {
  if (req.method === 'GET' && action === 'catalog-managed') {
    const items = await readManagedEtsyCatalog();
    return res.status(200).json({ items });
  }

  if (req.method === 'GET' && action === 'catalog-preview') {
    const offset = Number(req.query.offset || 0);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 12000 || offset % 100 !== 0) return res.status(400).json({ error: 'Invalid preview page.' });
    const page = await getEtsyListings(offset);
    const details = page.listings.length ? await fetchEtsyDetails(page.listings.map(item => item.listingId)) : [];
    const found = new Map(details.map(item => [item.listingId, item]));
    const listings = page.listings.map(item => found.get(item.listingId) || {
      ...item, description: '', price: 0, currency: 'USD', quantity: 0, images: [],
    });
    return res.status(200).json({ ...page, listings });
  }

  if (req.method === 'POST' && action === 'catalog-import') {
    const ids = req.body?.ids;
    if (!ownIdList(ids)) return res.status(400).json({ error: 'Select up to 25 unique listing IDs.' });
    const links = await getEtsyLinks();
    const alreadyLinked = new Set(links.map(link => link.listingId));
    const eligible = ids.filter(id => !alreadyLinked.has(id));
    if (!eligible.length) return res.status(409).json({ error: 'These listings already link to existing site products.' });
    const result = await importCatalogIds(eligible);
    return res.status(200).json({ imported: result.imported, skipped: result.skipped + ids.length - eligible.length });
  }

  if (req.method === 'POST' && action === 'catalog-manage') {
    const ids = req.body?.ids;
    if (!ownIdList(ids)) return res.status(400).json({ error: 'Choose 1–25 imported listings.' });
    // Publishing and category changes must use the same validated, atomic path.
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'published') ||
        Object.prototype.hasOwnProperty.call(req.body || {}, 'categoryId')) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'customTitle')) {
        return res.status(400).json({ error: 'Save the title separately from publishing or category changes.' });
      }
      if ('published' in req.body && typeof req.body.published !== 'boolean') {
        return res.status(400).json({ error: 'Invalid publishing state.' });
      }
      req.body = { ...req.body, source: 'etsy', operation:
        typeof req.body.published === 'boolean' ? (req.body.published ? 'publish' : 'unpublish') : 'category' };
      return handleSitePreview(req, res);
    }
    if (!Object.prototype.hasOwnProperty.call(req.body || {}, 'customTitle') || ids.length !== 1 ||
        (req.body.customTitle !== null && (typeof req.body.customTitle !== 'string' || req.body.customTitle.length > 160))) {
      return res.status(400).json({ error: 'Provide one listing and a title of at most 160 characters.' });
    }
    await ensureEtsyCatalogTable();
    const rows = await readManagedEtsyCatalog();
    if (!rows.some(item => item.listing_id === ids[0])) return res.status(404).json({ error: 'Listing has not been imported.' });
    const title = String(req.body.customTitle || '').trim() || null;
    await prisma.$executeRaw`UPDATE etsy_catalog_items SET custom_title = ${title} WHERE listing_id = ${ids[0]}`;
    return res.status(200).json({ updated: ids.length });
  }

  if (req.method === 'POST' && action === 'catalog-sync') {
    const ids = req.body?.ids;
    if (!ownIdList(ids, 25)) return res.status(400).json({ error: 'Choose 1–25 already imported listings to refresh.' });
    const saved = await readManagedEtsyCatalog();
    const known = new Set(saved.map(item => item.listing_id));
    if (ids.some(id => !known.has(id))) return res.status(400).json({ error: 'Some listings are not yet imported.' });
    return res.status(200).json(await syncCatalogBatch(ids));
  }

  return undefined;
}
