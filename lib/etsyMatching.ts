/**
 * Etsy's SEO titles often append comma-separated details to the shorter
 * product names used on mybabyshire.com. Only clear, exact prefix matches
 * are considered for bulk linking; no fuzzy/semantic guessing.
 */
export const normalizeCatalogTitle = (input: string): string =>
  String(input || '')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_whole, code: string) => {
      const n = code.toLowerCase().startsWith('x') ? parseInt(code.slice(1), 16) : parseInt(code, 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : ' ';
    })
    .replace(/&(?:amp|quot|apos|lt|gt);/gi, (entity) => ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' }[entity.toLowerCase()] || entity))
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

export type SuggestedMatch = { productId: string; listingId: string; offset: number; title: string; productName: string; strategy: 'exact' | 'prefix' };
type Local = { id: string; name: string; status?: string };
type Etsy = { listingId: string; title: string; offset: number };
type Linked = { productId: string; listingId: string };

export const titleMatchType = (siteName: string, etsyTitle: string): 'exact' | 'prefix' | null => {
  const site = normalizeCatalogTitle(siteName);
  const etsy = normalizeCatalogTitle(etsyTitle);
  const tokenCount = site.split(' ').length;
  if (!site || !etsy || tokenCount < 4 || site.length < 18) return null;
  if (site === etsy) return 'exact';
  // Only an entire, correctly delimited leading product phrase is eligible.
  // This intentionally rejects generic word overlap, reordered phrases,
  // and strings like "First Birthday" against "First Birthday Set".
  const firstClause = normalizeCatalogTitle(String(etsyTitle).split(',')[0]);
  if (site === firstClause || etsy.startsWith(site + ' ') && firstClause.startsWith(site + ' ')) return 'prefix';
  return null;
};

export const suggestUniqueTitleMatches = (
  products: Local[], listings: Etsy[], links: Linked[],
): SuggestedMatch[] => {
  const linkedProducts = new Set(links.map(item => item.productId));
  const linkedListings = new Set(links.map(item => item.listingId));
  const local = products.filter(p => p.status !== 'archived' && !linkedProducts.has(p.id));
  const etsy = listings.filter(l => !linkedListings.has(l.listingId));
  const candidates = [] as SuggestedMatch[];
  for (const item of etsy) {
    for (const product of local) {
      const strategy = titleMatchType(product.name, item.title);
      if (strategy) candidates.push({ productId: product.id, listingId: item.listingId, title: item.title, offset: item.offset, productName: product.name, strategy });
    }
  }
  const localCounts = new Map<string, number>();
  const etsyCounts = new Map<string, number>();
  for (const match of candidates) {
    localCounts.set(match.productId, (localCounts.get(match.productId) || 0) + 1);
    etsyCounts.set(match.listingId, (etsyCounts.get(match.listingId) || 0) + 1);
  }
  // 1:1 only. Ambiguous titles go to manual review.
  return candidates.filter(match => localCounts.get(match.productId) === 1 && etsyCounts.get(match.listingId) === 1);
};
