import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { BrandLogo } from './components/BrandLogo';
import { CartDrawer } from './components/CartDrawer';
import { PersonalizationModal } from './components/PersonalizationModal';
import { ProductCard } from './components/ProductCard';
import { Product, useStore } from './store/useStore';
import { useSeo } from './utils/seo';

type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'name';
type CollectionConfig = { title: string; eyebrow: string; description: string; matches: (product: Product) => boolean };
const productText = (product: Product) => `${product.name} ${product.description || ''} ${product.categoryName || ''} ${product.ageRange || ''}`.toLowerCase();

const COLLECTIONS: Record<string, CollectionConfig> = {
  all: { title: 'All Products', eyebrow: 'Catalog', description: 'Browse the full MY BABY SHIRE catalog.', matches: () => true },
  'new-arrivals': { title: 'New Arrivals', eyebrow: 'Just added', description: 'The newest products added to the catalog.', matches: (product) => Boolean(product.newArrival) },
  'best-sellers': { title: 'Best Sellers', eyebrow: 'Popular now', description: 'Popular products highlighted in the catalog.', matches: (product) => Boolean(product.bestseller) },
  baby: { title: 'Baby', eyebrow: 'Shop by size', description: 'Blank and custom-ready essentials for baby sizes.', matches: (product) => /(baby|newborn|infant|bodysuit|onesie|romper|0-3m|3-6m|6m|12m|18m)/.test(productText(product)) },
  toddler: { title: 'Toddler', eyebrow: 'Shop by size', description: 'Everyday pieces for toddler sizes.', matches: (product) => /(toddler|2t|3t|4t|5t)/.test(productText(product)) },
  kids: { title: 'Kids', eyebrow: 'Shop by size', description: 'Kids and youth styles for everyday wear or customization.', matches: (product) => /(kid|kids|child|children|youth|6y|7y|8y|10y|12y)/.test(productText(product)) },
  adult: { title: 'Adult', eyebrow: 'Shop by size', description: 'Adult and unisex essentials in a clean catalog.', matches: (product) => /(adult|women|woman|men|man|unisex adult|xs|small|medium|large|xl|2xl|3xl)/.test(productText(product)) },
  sweatshirts: { title: 'Sweatshirts', eyebrow: 'Shop by style', description: 'Sweatshirts, crews and hoodies ready for your next project.', matches: (product) => /(sweatshirt|crewneck|crew neck|hoodie|fleece)/.test(productText(product)) },
};

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A–Z' },
];
const NAV_ITEMS = [['New', '/collections/new-arrivals'], ['Best Sellers', '/collections/best-sellers'], ['Baby', '/collections/baby'], ['Toddler', '/collections/toddler'], ['Kids', '/collections/kids'], ['Adult', '/collections/adult'], ['Sweatshirts', '/collections/sweatshirts']] as const;

export default function CollectionPage() {
  const { collection = '' } = useParams();
  const [urlParams, setUrlParams] = useSearchParams();
  const { products, productsLoading, loadProducts, cartItems, openCart } = useStore();
  const categorySlug = collection.startsWith('category-') ? collection.slice('category-'.length) : null;
  const matchedCategory = categorySlug ? products.find(item => item.categorySlug === categorySlug) : undefined;
  const config: CollectionConfig | undefined = COLLECTIONS[collection] || (categorySlug ? {
    title: matchedCategory?.categoryName || 'Catalog Category',
    eyebrow: 'Shop by category',
    description: 'Browse the selected MY BABY SHIRE category.',
    matches: (item: Product) => item.categorySlug === categorySlug,
  } : undefined);
  const [searchTerm, setSearchTerm] = useState(urlParams.get('search') || '');
  const [sortBy, setSortBy] = useState<SortMode>('featured');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useSeo({ title: config?.title || 'Collections', description: config?.description || 'Shop MY BABY SHIRE collections.' });
  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => { setSearchTerm(urlParams.get('search') || ''); }, [urlParams]);
  useEffect(() => {
    if (!isSortOpen) return;
    const close = (event: PointerEvent) => { if (!sortRef.current?.contains(event.target as Node)) setIsSortOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [isSortOpen]);
  useEffect(() => {
    if (!isMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isMenuOpen]);

  const filteredProducts = useMemo(() => {
    if (!config) return [];
    const query = searchTerm.trim().toLowerCase();
    const result = products.filter((product) => config.matches(product) && (!query || productText(product).includes(query)));
    const sorted = [...result];
    // Unverified Etsy prices are intentionally not treated as $0 bargains.
    if (sortBy === 'price-asc') sorted.sort((a, b) =>
      Number(Boolean(a.priceStale)) - Number(Boolean(b.priceStale)) || a.price - b.price);
    if (sortBy === 'price-desc') sorted.sort((a, b) =>
      Number(Boolean(a.priceStale)) - Number(Boolean(b.priceStale)) || b.price - a.price);
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'featured') sorted.sort((a, b) => Number(Boolean(b.featured || b.bestseller)) - Number(Boolean(a.featured || a.bestseller)));
    return sorted;
  }, [config, products, searchTerm, sortBy]);

  if (!config) return <Navigate to="/collections/all" replace />;

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    const next = new URLSearchParams(urlParams);
    if (value.trim()) next.set('search', value.trim()); else next.delete('search');
    setUrlParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#202020]">
      <CartDrawer /><PersonalizationModal />
      <div className="bg-[#f8e9ed] px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-[#4e3d42] sm:text-xs">Blank apparel & custom-ready essentials</div>
      <header className="sticky top-0 z-40 border-b border-[#e9e9e9] bg-white/95 backdrop-blur-lg"><div className="mx-auto grid min-h-[70px] max-w-[1560px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:min-h-[78px] lg:px-8"><nav className="hidden items-center gap-5 text-[13px] font-semibold xl:flex">{NAV_ITEMS.map(([label, href]) => <Link key={href} to={href} className="commerce-focus hover:text-[#8a5966]">{label}</Link>)}</nav><button type="button" onClick={() => setIsMenuOpen(true)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5] xl:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button><Link to="/" className="justify-self-center" aria-label="MY BABY SHIRE home"><BrandLogo variant="nav" className="!h-[39px] sm:!h-[45px] md:!h-[48px] !drop-shadow-none" /></Link><div className="flex items-center justify-end gap-1"><Link to="/account" className="commerce-focus hidden h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5] sm:inline-flex" aria-label="Account"><UserRound className="h-5 w-5" /></Link><button type="button" onClick={openCart} className="commerce-focus relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Cart"><ShoppingBag className="h-5 w-5" />{cartCount > 0 && <span className="absolute right-0.5 top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#202020] px-1 text-[9px] font-bold text-white">{cartCount}</span>}</button></div></div></header>

      {isMenuOpen && <div className="fixed inset-0 z-[70] xl:hidden"><button type="button" className="absolute inset-0 bg-black/25" onClick={() => setIsMenuOpen(false)} aria-label="Close menu" /><aside className="absolute inset-y-0 left-0 flex w-[min(88vw,390px)] flex-col bg-white shadow-2xl"><div className="flex min-h-20 items-center justify-between border-b border-[#ededed] px-5"><BrandLogo variant="nav" className="!h-[42px] !drop-shadow-none" /><button type="button" onClick={() => setIsMenuOpen(false)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Close"><X className="h-5 w-5" /></button></div><nav className="flex flex-1 flex-col overflow-y-auto px-5 py-5">{NAV_ITEMS.map(([label, href]) => <Link key={href} to={href} onClick={() => setIsMenuOpen(false)} className="commerce-focus border-b border-[#eeeeee] py-4 text-base font-semibold">{label}</Link>)}<Link to="/collections/all" onClick={() => setIsMenuOpen(false)} className="commerce-focus border-b border-[#eeeeee] py-4 text-base font-semibold">All Products</Link></nav><div className="grid gap-2 border-t border-[#ededed] p-5"><Link to="/account" className="text-sm font-semibold">My account</Link><Link to="/track-order" className="text-sm font-semibold">Track order</Link></div></aside></div>}

      <main>
        <section className="border-b border-[#ededed] bg-[#fafafa]"><div className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a5966]">{config.eyebrow}</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{config.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#707070] sm:text-base">{config.description}</p></div></section>
        <section className="mx-auto max-w-[1560px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#777]">{productsLoading ? 'Loading catalog…' : `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`}</p><div className="flex flex-col gap-2.5 sm:flex-row sm:items-center"><div className="relative sm:w-64"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" /><input value={searchTerm} onChange={(event) => updateSearch(event.target.value)} placeholder="Search this collection" className="commerce-focus h-11 w-full rounded-[9px] border border-[#dedede] bg-white pl-10 pr-10 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" />{searchTerm && <button type="button" onClick={() => updateSearch('')} className="commerce-focus absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}</div><div ref={sortRef} className="relative sm:w-52"><button type="button" onClick={() => setIsSortOpen((open) => !open)} className="commerce-focus flex h-11 w-full items-center justify-between rounded-[9px] border border-[#dedede] bg-white px-3.5 text-sm font-medium hover:border-[#bdbdbd]">{SORT_OPTIONS.find((option) => option.value === sortBy)?.label}<ChevronDown className={`h-4 w-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} /></button>{isSortOpen && <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-full overflow-hidden rounded-[9px] border border-[#dedede] bg-white p-1.5 shadow-xl">{SORT_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => { setSortBy(option.value); setIsSortOpen(false); }} className={`commerce-focus block w-full rounded-[7px] px-3 py-2.5 text-left text-sm ${sortBy === option.value ? 'bg-[#f4f4f4] font-semibold' : 'hover:bg-[#f7f7f7]'}`}>{option.label}</button>)}</div>}</div></div></div>
          {productsLoading && <div className="py-20 text-center text-sm text-[#777]">Loading products...</div>}
          {!productsLoading && filteredProducts.length > 0 && <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6 xl:gap-y-12">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
          {!productsLoading && filteredProducts.length === 0 && <div className="rounded-[12px] border border-dashed border-[#d7d7d7] bg-[#fafafa] px-6 py-16 text-center"><p className="text-lg font-semibold">No matching products</p><p className="mt-2 text-sm text-[#777]">Try another search or choose a different collection.</p><Link to="/collections/all" className="commerce-focus mt-5 inline-flex rounded-[9px] bg-[#202020] px-5 py-3 text-sm font-semibold text-white">View all products</Link></div>}
        </section>
      </main>
    </div>
  );
}
