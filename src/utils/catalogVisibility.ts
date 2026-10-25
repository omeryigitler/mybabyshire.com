import type { Product } from '../store/useStore';

/** Freshly published managed Etsy listings are always visible in a home storefront slot. */
export function getEtsyHomeProducts(products: readonly Product[], limit = 4): Product[] {
  return products.filter(product => product.source === 'etsy').slice(0, limit);
}

/** Preserve native editorial picks while including newly published Etsy items. */
export function getHomeNewArrivals(products: readonly Product[], limit = 8): Product[] {
  const etsyProducts = products.filter(product => product.source === 'etsy');
  const editorial = products.filter(product => product.newArrival);
  const ranked = etsyProducts.length || editorial.length ? [...etsyProducts, ...editorial] : [...products];
  return [...new Map(ranked.map(product => [product.id, product])).values()].slice(0, limit);
}
