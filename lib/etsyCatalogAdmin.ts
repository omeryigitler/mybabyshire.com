import type { VercelRequest, VercelResponse } from '@vercel/node';
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
    return res.status(200).json({ ...page, listings: details });
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
    const categoryId = req.body?.categoryId;
    const hasCategory = Object.prototype.hasOwnProperty.call(req.body || {}, 'categoryId');
    const hasPublish = typeof req.body?.published === 'boolean';
    const hasTitle = Object.prototype.hasOwnProperty.call(req.body || {}, 'customTitle');
    if (!hasCategory && !hasPublish && !hasTitle) return res.status(400).json({ error: 'No changes requested.' });
    if (hasCategory && categoryId !== null && (typeof categoryId !== 'string' || categoryId.length > 80)) return res.status(400).json({ error: 'Invalid category ID.' });
    if (hasTitle && ids.length !== 1) return res.status(400).json({ error: 'Custom title can be edited one product at a time.' });
    if (hasTitle && req.body.customTitle !== null && (typeof req.body.customTitle !== 'string' || req.body.customTitle.length > 160)) {
      return res.status(400).json({ error: 'Title exceeds maximum length.' });
    }
    await ensureEtsyCatalogTable();
    if (hasCategory && categoryId !== null) {
      const category = await prisma.categories.findUnique({ where: { id: categoryId }, select: { id: true } });
      if (!category) return res.status(400).json({ error: 'Category not found.' });
    }
    const rows = await readManagedEtsyCatalog();
    const existing = new Map(rows.map(item => [item.listing_id, item]));
    if (ids.some(id => !existing.has(id))) return res.status(404).json({ error: 'One or more listings have not been imported.' });
    if (req.body.published === true && ids.some(id => {
      const item = existing.get(id)!;
      const images = Array.isArray(item.image_urls) ? item.image_urls : [];
      return !item.active || item.quantity <= 0 || images.length === 0 || !Number.isFinite(Number(item.price));
    })) {
      return res.status(409).json({ error: 'An unavailable, unpriced or image-less listing cannot be published.' });
    }
    for (const id of ids) {
      if (hasCategory) {
        await prisma.$executeRaw`UPDATE etsy_catalog_items SET category_id = ${categoryId} WHERE listing_id = ${id}`;
      }
      if (hasPublish) {
        await prisma.$executeRaw`UPDATE etsy_catalog_items SET published = ${req.body.published as boolean} WHERE listing_id = ${id}`;
      }
      if (hasTitle) {
        const title = String(req.body.customTitle || '').trim() || null;
        await prisma.$executeRaw`UPDATE etsy_catalog_items SET custom_title = ${title} WHERE listing_id = ${id}`;
      }
    }
    return res.status(200).json({ updated: ids.length });
  }

  if (req.method === 'POST' && action === 'catalog-sync') {
    const ids = req.body?.ids;
    if (!ownIdList(ids, 100)) return res.status(400).json({ error: 'Choose 1–100 already imported listings to refresh.' });
    const saved = await readManagedEtsyCatalog();
    const known = new Set(saved.map(item => item.listing_id));
    if (ids.some(id => !known.has(id))) return res.status(400).json({ error: 'Some listings are not yet imported.' });
    return res.status(200).json(await syncCatalogBatch(ids));
  }

  return undefined;
}
