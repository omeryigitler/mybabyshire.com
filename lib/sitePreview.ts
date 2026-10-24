import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './prisma.js';
import { readManagedEtsyCatalog, ensureEtsyCatalogTable } from './etsyCatalog.js';

const isNativeId = (id: unknown): id is string => typeof id === 'string' && /^[a-f0-9-]{32,40}$/i.test(id);
const isEtsyId = (id: unknown): id is string => typeof id === 'string' && /^\d{1,20}$/.test(id);
const isSelection = (input: unknown, test: (v: unknown) => boolean) =>
  Array.isArray(input) && input.length > 0 && input.length <= 25 && new Set(input).size === input.length && input.every(test);

const extractImages = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
  try { const parsed = JSON.parse(String(raw)); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
};

export async function handleSitePreview(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  if (req.method === 'GET') {
    const [native, etsy, categories] = await Promise.all([
      prisma.products.findMany({
        select: { id: true, name: true, description: true, price: true, status: true, slug: true,
          category_id: true, category: { select: { name: true } }, images: { select: { image_url: true }, orderBy: { sort_order: 'asc' }, take: 2 } },
        orderBy: { created_at: 'desc' },
      }),
      readManagedEtsyCatalog(),
      prisma.categories.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);
    const nativeItems = native.filter(item => item.status === 'draft' || item.status === 'active').map(item => ({
      source: 'site', id: item.id, title: item.name, description: item.description || '',
      price: Number(item.price), currency: 'USD', imageUrl: item.images[0]?.image_url || '',
      published: item.status === 'active', categoryId: item.category_id, categoryName: item.category?.name || null,
      detailUrl: '/products/' + item.slug, previewUrl: null,
    }));
    const etsyItems = etsy.map(item => ({
      source: 'etsy', id: item.listing_id, title: item.custom_title || item.etsy_title,
      description: item.description, price: Number(item.price), currency: item.currency_code,
      imageUrl: extractImages(item.image_urls)[0] || '', published: item.published,
      available: item.active && item.quantity > 0,
      categoryId: item.category_id, categoryName: item.category_name || null,
      detailUrl: item.published ? '/products/etsy-' + item.listing_id : null,
      previewUrl: 'https://www.etsy.com/listing/' + item.listing_id,
      syncedAt: item.synced_at,
    }));
    return res.status(200).json({ items: [...nativeItems, ...etsyItems], categories });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const source = req.body?.source;
  const ids = req.body?.ids;
  const operation = req.body?.operation;
  if ((source !== 'site' && source !== 'etsy') || !isSelection(ids, source === 'site' ? isNativeId : isEtsyId)) {
    return res.status(400).json({ error: 'Select 1–25 valid products from one source.' });
  }
  if (!['publish', 'unpublish', 'category'].includes(operation)) return res.status(400).json({ error: 'Unsupported operation.' });

  const hasCategory = operation === 'category';
  const categoryId = req.body?.categoryId;
  if (hasCategory && categoryId !== null && (typeof categoryId !== 'string' || categoryId.length > 80)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }
  if (hasCategory && categoryId) {
    const existing = await prisma.categories.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!existing) return res.status(404).json({ error: 'Category does not exist.' });
  }

  if (source === 'site') {
    const current = await prisma.products.findMany({
      where: { id: { in: ids } }, include: { images: { select: { image_url: true } } },
    });
    if (current.length !== ids.length) return res.status(404).json({ error: 'Some products were not found.' });
    if (operation === 'publish' && current.some(item =>
      !item.name.trim() || Number(item.price) <= 0 || !item.images.length || !(item.category_id))) {
      return res.status(409).json({ error: 'Each site product needs a title, image, positive price and category before publication.' });
    }
    await prisma.products.updateMany({
      where: { id: { in: ids } },
      data: operation === 'category' ? { category_id: categoryId } : { status: operation === 'publish' ? 'active' : 'draft' },
    });
    return res.status(200).json({ updated: ids.length });
  }

  await ensureEtsyCatalogTable();
  const existing = await readManagedEtsyCatalog();
  const byId = new Map(existing.map(x => [x.listing_id, x]));
  if (ids.some(id => !byId.has(id))) return res.status(404).json({ error: 'Import Etsy products before changing their status.' });
  if (operation === 'publish' && ids.some(id => {
    const item = byId.get(id)!;
    return !item.active || item.quantity <= 0 || Number(item.price) <= 0 ||
      extractImages(item.image_urls).length === 0 || !item.category_id ||
      Date.now() - new Date(item.synced_at).getTime() > 4 * 60 * 60 * 1000;
  })) {
    return res.status(409).json({ error: 'Etsy products must have a category, price, image, stock and recent Etsy sync before publishing.' });
  }
  for (const id of ids) {
    if (hasCategory) await prisma.$executeRaw`UPDATE etsy_catalog_items SET category_id = ${categoryId} WHERE listing_id = ${id}`;
    else if (operation === 'publish') await prisma.$executeRaw`UPDATE etsy_catalog_items SET published = TRUE WHERE listing_id = ${id}`;
    else await prisma.$executeRaw`UPDATE etsy_catalog_items SET published = FALSE WHERE listing_id = ${id}`;
  }
  return res.status(200).json({ updated: ids.length });
}
