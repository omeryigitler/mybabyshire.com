import { normalizeCatalogTitle, titleMatchType } from './etsyMatching.js';

type NativeCandidate = { id: string; name: string; status?: string | null };

export function findLikelyDuplicateProducts(
  etsyTitle: string,
  siteProducts: NativeCandidate[],
): NativeCandidate[] {
  const etsy = normalizeCatalogTitle(etsyTitle);
  if (!etsy) return [];
  return siteProducts.filter(product => {
    if (product.status === 'archived') return false;
    const local = normalizeCatalogTitle(product.name);
    return (local.length >= 18 && local === etsy) ||
      titleMatchType(product.name, etsyTitle) !== null;
  });
}

export function selectVisibleProductKeys(
  selected: string[],
  visibleKeys: string[],
): string[] {
  const visible = new Set(visibleKeys);
  return selected.filter(key => visible.has(key));
}
