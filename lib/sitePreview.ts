import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './prisma.js';
import { readManagedEtsyCatalog, ensureEtsyCatalogTable, syncCatalogBatch } from './etsyCatalog.js';
import { getEtsyLinks } from './etsy.js';
import { findLikelyDuplicateProducts } from './catalogSafety.js';

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
    const [native, etsy, categories, links] = await Promise.all([
      prisma.products.findMany({
        select: { id: true, name: true, description: true, price: true, status: true, slug: true,
          category_id: true, category: { select: { name: true } }, images: { select: { image_url: true }, orderBy: { sort_order: 'asc' }, take: 2 } },
        orderBy: { created_at: 'desc' },
      }),
      readManagedEtsyCatalog(),
      prisma.categories.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      getEtsyLinks(),
    ]);
    const etsyByNative = new Map(links.map(link => [link.productId, link.url]));
    const alreadyLinkedListings = new Set(links.map(link => link.listingId));
    const nativeItems = native.filter(item => item.status === 'draft' || item.status === 'active').map(item => ({
      source: 'site', id: item.id, title: item.name, description: item.description || '',
      price: Number(item.price), currency: 'USD', imageUrl: item.images[0]?.image_url || '',
      published: item.status === 'active', categoryId: item.category_id, categoryName: item.category?.name || null,
      detailUrl: '/products/' + item.slug, previewUrl: null, checkoutEtsyUrl: etsyByNative.get(item.id) || null,
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
      possibleDuplicates: [
        ...(alreadyLinkedListings.has(item.listing_id) ? ['Bu Etsy ilanı zaten bir site ürününe bağlanmış.'] : []),
        ...findLikelyDuplicateProducts(item.etsy_title, native).map(product => product.name),
      ],
    }));
    return res.status(200).json({ items: [...nativeItems, ...etsyItems], categories });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const source = req.body?.source;
  const ids: unknown = req.body?.ids;
  const operation = req.body?.operation;
  if ((source !== 'site' && source !== 'etsy') || !isSelection(ids, source === 'site' ? isNativeId : isEtsyId)) {
    return res.status(400).json({ error: 'Aynı kaynaktan 1–25 geçerli ürün seçin.' });
  }
  if (!['publish', 'unpublish', 'category'].includes(operation)) {
    return res.status(400).json({ error: 'Desteklenmeyen ürün işlemi.' });
  }

  // A category selected during publishing is committed in the same operation.
  // The dropdown is not a separate required step before "Publish".
  const hasCategory = Object.prototype.hasOwnProperty.call(req.body || {}, 'categoryId');
  const categoryId: unknown = req.body?.categoryId;
  if (operation === 'category' && !hasCategory) {
    return res.status(400).json({ error: 'Lütfen atanacak kategoriyi seçin.' });
  }
  if (hasCategory && categoryId !== null && (typeof categoryId !== 'string' || !categoryId || categoryId.length > 80)) {
    return res.status(400).json({ error: 'Geçersiz kategori seçimi.' });
  }
  if (hasCategory && categoryId) {
    const category = await prisma.categories.findUnique({ where: { id: categoryId as string }, select: { id: true } });
    if (!category) return res.status(404).json({ error: 'Seçilen kategori artık bulunamıyor. Listeyi yenileyin.' });
  }

  const selectedIds = ids as string[];
  if (source === 'site') {
    const current = await prisma.products.findMany({
      where: { id: { in: selectedIds } },
      include: { images: { select: { image_url: true } } },
    });
    if (current.length !== selectedIds.length) {
      return res.status(404).json({ error: 'Seçilen site ürünlerinden bazıları bulunamadı.' });
    }
    if (operation === 'publish') {
      const issues = current.flatMap(item => {
        const problems: string[] = [];
        if (!item.name.trim()) problems.push('ürün adı');
        if (Number(item.price) <= 0) problems.push('geçerli fiyat');
        if (!item.images.length) problems.push('görsel');
        if (!(hasCategory ? categoryId : item.category_id)) problems.push('kategori');
        return problems.length ? [item.name.slice(0, 90) + ': ' + problems.join(', ')] : [];
      });
      if (issues.length) return res.status(409).json({ error: 'Bazı site ürünleri yayımlanmaya hazır değil.', issues });
    }
    await prisma.products.updateMany({
      where: { id: { in: selectedIds } },
      data: {
        ...(hasCategory ? { category_id: categoryId as string | null } : {}),
        ...(operation !== 'category' ? { status: operation === 'publish' ? 'active' : 'draft' } : {}),
      },
    });
    return res.status(200).json({ updated: selectedIds.length });
  }

  await ensureEtsyCatalogTable();
  let current = await readManagedEtsyCatalog();
  let byId = new Map(current.map(item => [item.listing_id, item]));
  if (selectedIds.some(id => !byId.has(id))) {
    return res.status(404).json({ error: 'Bazı Etsy ürünleri henüz içe aktarılmamış.' });
  }

  if (operation === 'publish') {
    const stale = selectedIds.filter(id =>
      Date.now() - new Date(byId.get(id)!.synced_at).getTime() > 4 * 60 * 60 * 1000,
    );
    if (stale.length) {
      // Verify against Etsy again when the cached listing is older than the publishing freshness window.
      // An invalid/inactive Etsy listing is never approved based on stale data.
      try {
        await syncCatalogBatch(stale);
        current = await readManagedEtsyCatalog();
        byId = new Map(current.map(item => [item.listing_id, item]));
      } catch {
        return res.status(503).json({
          error: 'Etsy ürün bilgileri güncellenemedi. Etsy verilerini yenile butonunu kullanıp tekrar deneyin.',
        });
      }
    }

    const issues = selectedIds.flatMap(id => {
      const item = byId.get(id)!;
      const problems: string[] = [];
      if (!item.active) problems.push('Etsy ilanı aktif değil');
      if (item.quantity <= 0) problems.push('stok sıfır');
      if (Number(item.price) <= 0) problems.push('fiyat geçersiz');
      if (!extractImages(item.image_urls).length) problems.push('görsel eksik');
      if (!(hasCategory ? categoryId : item.category_id)) problems.push('kategori eksik');
      if (Date.now() - new Date(item.synced_at).getTime() > 4 * 60 * 60 * 1000) problems.push('Etsy bilgileri güncel değil');
      return problems.length ? [item.etsy_title.slice(0, 90) + ': ' + problems.join(', ')] : [];
    });
    if (issues.length) {
      return res.status(409).json({ error: 'Seçilen Etsy ürünleri yayın koşullarını karşılamıyor.', issues });
    }
    const [nativeProducts, existingLinks] = await Promise.all([
      prisma.products.findMany({
        where: { status: { in: ['active', 'draft'] } },
        select: { id: true, name: true, status: true },
      }),
      getEtsyLinks(),
    ]);
    const mappedIds = new Set(existingLinks.map(link => link.listingId));
    if (selectedIds.some(id => mappedIds.has(id))) {
      return res.status(409).json({ error: 'Seçilen Etsy ilanlarından biri zaten mevcut bir site ürününe bağlı. Aynı ilan ikinci kez yayımlanamaz.' });
    }
    const possibleDuplicates = selectedIds.flatMap(id =>
      findLikelyDuplicateProducts(byId.get(id)!.etsy_title, nativeProducts)
        .map(product => byId.get(id)!.etsy_title.slice(0, 65) + ' → ' + product.name.slice(0, 65)),
    );
    if (possibleDuplicates.length && req.body?.confirmPossibleDuplicates !== true) {
      return res.status(409).json({
        error: 'Benzer site ürünleri tespit edildi. Tekrarlanan tasarımları kontrol edip açıkça onaylayın.',
        issues: possibleDuplicates.slice(0, 20),
      });
    }
  }

  // Atomic per-source, per-batch updates prevent assigning the category without publishing (or vice versa).
  await prisma.$transaction(async tx => {
    for (const id of selectedIds) {
      if (hasCategory && operation === 'publish') {
        await tx.$executeRaw`UPDATE etsy_catalog_items SET category_id = ${categoryId as string | null}, published = TRUE WHERE listing_id = ${id}`;
      } else if (operation === 'category') {
        await tx.$executeRaw`UPDATE etsy_catalog_items SET category_id = ${categoryId as string | null} WHERE listing_id = ${id}`;
      } else if (operation === 'publish') {
        await tx.$executeRaw`UPDATE etsy_catalog_items SET published = TRUE WHERE listing_id = ${id}`;
      } else {
        await tx.$executeRaw`UPDATE etsy_catalog_items SET published = FALSE WHERE listing_id = ${id}`;
      }
    }
  });
  return res.status(200).json({ updated: selectedIds.length });
}
