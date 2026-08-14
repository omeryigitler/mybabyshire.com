import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Gift, Search, ShieldCheck, ShoppingBag, Truck, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from './store/useStore';
import { CartDrawer } from './components/CartDrawer';
import { PersonalizationModal } from './components/PersonalizationModal';
import { ProductCard } from './components/ProductCard';
import { BrandLogo } from './components/BrandLogo';
import { HomeCommerceHero, type HomeDiscoveryFilter } from './components/HomeCommerceHero';
import { HomeRealFeaturedGifts } from './components/HomeRealFeaturedGifts';
import { HomeShopMoments } from './components/HomeShopMoments';
import { HomeOrderReassurance } from './components/HomeOrderReassurance';
import { useSeo } from './utils/seo';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
] as const;

const DISCOVERY_LABELS: Record<HomeDiscoveryFilter, string> = {
  newborn: 'Newborn',
  'first-birthday': 'First Birthday',
  'name-number': 'Name & Number',
  tutu: 'Tutu Sets',
  'new-arrivals': 'New Arrivals',
};

export default function Storefront() {
  const {
    openCart,
    cartItems,
    products,
    loadProducts,
    productsLoading,
    openPersonalizationModal,
    addToCart,
  } = useStore();
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useSeo({
    description: 'Shop baby gifts, newborn photo outfits, and first-birthday keepsakes made with special details and shipped across the US.',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [discoveryFilter, setDiscoveryFilter] = useState<HomeDiscoveryFilter | null>(null);
  const [sortBy, setSortBy] = useState('featured');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const focusSearch = () => {
    scrollToSection('shop');
    window.setTimeout(() => searchInputRef.current?.focus(), 350);
  };

  const categories = useMemo(() => {
    const names = new Set<string>();
    products.forEach((product) => { if (product.categoryName) names.add(product.categoryName); });
    return Array.from(names).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let result = products.filter((product) => {
      const productText = `${product.name} ${product.description || ''} ${product.ageRange || ''}`.toLowerCase();
      const matchesQuery = !query || productText.includes(query);
      const matchesCategory = activeCategory === 'all' || product.categoryName === activeCategory;

      let matchesDiscovery = true;
      if (discoveryFilter === 'newborn') matchesDiscovery = productText.includes('newborn');
      else if (discoveryFilter === 'first-birthday') matchesDiscovery = productText.includes('birthday');
      else if (discoveryFilter === 'tutu') matchesDiscovery = productText.includes('tutu');
      else if (discoveryFilter === 'new-arrivals') matchesDiscovery = Boolean(product.newArrival);
      else if (discoveryFilter === 'name-number') {
        const labels = (product.personalizationFields || []).map((field) => `${field.label} ${field.fieldKey}`.toLowerCase());
        matchesDiscovery = labels.some((label) => label.includes('name')) && labels.some((label) => label.includes('number'));
      }

      return matchesQuery && matchesCategory && matchesDiscovery;
    });

    result = [...result];
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0));
    return result;
  }, [products, searchTerm, activeCategory, discoveryFilter, sortBy]);

  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Featured';
  const hasFilters = Boolean(searchTerm.trim()) || activeCategory !== 'all' || Boolean(discoveryFilter) || sortBy !== 'featured';

  const productRows = filteredProducts.reduce<typeof products[]>((rows, product, index) => {
    const rowIndex = Math.floor(index / 3);
    if (!rows[rowIndex]) rows[rowIndex] = [];
    rows[rowIndex].push(product);
    return rows;
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
    setDiscoveryFilter(null);
    setSortBy('featured');
  };

  const showAllGifts = () => {
    clearFilters();
    window.setTimeout(() => scrollToSection('shop'), 0);
  };

  const applyDiscoveryFilter = (filter: HomeDiscoveryFilter) => {
    setSearchTerm('');
    setActiveCategory('all');
    setDiscoveryFilter(filter);
    setSortBy('featured');
    window.setTimeout(() => scrollToSection('shop'), 0);
  };

  const addSimpleProduct = (product: (typeof products)[number]) => {
    addToCart({ product, quantity: 1, personalizationData: {} });
  };

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!isSortMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) setIsSortMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSortMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortMenuOpen]);

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-boutique-bg font-sans selection:bg-boutique-wood-light">
      <CartDrawer />
      <PersonalizationModal />
      <div className="pointer-events-none fixed inset-0 z-0 bg-pattern bg-[length:400px_400px] opacity-40" />

      <div className="relative z-40 border-b border-white/10 bg-boutique-brown px-3 py-2 text-[#fffaf3]">
        <div className="mx-auto flex max-w-[1480px] items-center justify-center gap-x-5 gap-y-1 text-center text-[10px] font-semibold sm:flex-wrap sm:text-[11px] md:gap-x-7">
          <span className="inline-flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" /> Gift-ready packaging included</span>
          <span className="hidden h-1 w-1 rounded-full bg-white/35 sm:block" />
          <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Ships across the US</span>
          <span className="hidden h-1 w-1 rounded-full bg-white/35 sm:block" />
          <span className="hidden items-center gap-1.5 sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5" /> Secure checkout with Stripe &amp; PayPal</span>
        </div>
      </div>

      <header className="relative z-30 flex min-h-[82px] w-full items-center justify-between border-b border-boutique-brown/5 bg-boutique-bg/86 px-4 py-0 backdrop-blur-md sm:px-6 md:min-h-[104px] md:px-12 lg:min-h-[112px]">
        <nav className="relative z-20 hidden max-w-[40%] items-center gap-5 text-sm font-medium text-boutique-brown-light lg:flex lg:gap-7">
          <button type="button" onClick={showAllGifts} className="flex items-center gap-2 transition-colors hover:text-boutique-wood">Shop <img src="/cloud-watercolor-pink.png" className="w-6 object-contain opacity-85 drop-shadow-[0_3px_5px_rgba(58,37,26,0.18)]" alt="" /></button>
          <button type="button" onClick={() => scrollToSection('featured-gifts')} className="flex items-center gap-2 transition-colors hover:text-boutique-wood">Made for Them <img src="/cloud-watercolor-blue-light.png" className="w-6 object-contain opacity-85 drop-shadow-[0_3px_5px_rgba(58,37,26,0.18)]" alt="" /></button>
          <button type="button" onClick={() => scrollToSection('gifts')} className="flex items-center gap-2 transition-colors hover:text-boutique-wood">Gifts <img src="/cloud-watercolor-blue-dense.png" className="w-6 object-contain opacity-85 drop-shadow-[0_3px_5px_rgba(58,37,26,0.18)]" alt="" /></button>
          <button type="button" onClick={() => scrollToSection('our-story')} className="transition-colors hover:text-boutique-wood">Our Story</button>
        </nav>

        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="group/logo absolute left-4 top-1/2 z-10 flex -translate-y-1/2 justify-start sm:left-6 md:left-1/2 md:-translate-x-1/2 md:justify-center" aria-label="Back to MY BABY SHIRE home">
          <BrandLogo variant="header" />
        </button>

        <div className="relative z-20 ml-auto flex items-center gap-2 text-boutique-brown sm:gap-3 md:gap-5">
          <button type="button" onClick={focusSearch} aria-label="Search products" className="hidden p-2 transition-colors hover:text-boutique-wood sm:inline-flex"><Search size={22} strokeWidth={1.5} /></button>
          <Link to="/account" className="p-2 transition-colors hover:text-boutique-wood" aria-label="Member account"><UserRound size={22} strokeWidth={1.5} /></Link>
          <button type="button" onClick={openCart} className="relative p-2 transition-colors hover:text-boutique-wood" aria-label="Open gift bag">
            <ShoppingBag size={22} strokeWidth={1.5} />
            {cartItemCount > 0 && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-boutique-brown text-[10px] font-bold text-white">{cartItemCount}</span>}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-start overflow-visible pb-8 md:pb-0">
        <HomeCommerceHero
          products={products}
          onShop={showAllGifts}
          onFilter={applyDiscoveryFilter}
          onChooseProduct={openPersonalizationModal}
          onAddProduct={addSimpleProduct}
        />

        {productsLoading && <p className="relative z-20 mb-2 mt-5 text-sm text-boutique-brown-light">Loading products...</p>}

        <HomeRealFeaturedGifts products={products} onShopAll={showAllGifts} />
        <HomeShopMoments products={products} />

        <section id="shop" className="relative z-20 mx-auto mt-10 w-full max-w-[1620px] scroll-mt-24 px-4 md:mt-14 md:px-8">
          <div className="mb-7 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-boutique-wood sm:text-[11px]">The full collection</span>
            <h2 className="mt-2 font-serif text-3xl text-boutique-brown md:text-[40px]">Shop All Gifts</h2>
            <p className="mt-2 text-sm text-boutique-brown-light md:text-base">Browse the current catalog with the same prices and product options used at checkout.</p>
            {discoveryFilter && (
              <button type="button" onClick={() => setDiscoveryFilter(null)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-boutique-brown/12 bg-white/85 px-4 py-2 text-xs font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df]">
                Showing: {DISCOVERY_LABELS[discoveryFilter]} <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mb-9 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-boutique-brown/40" />
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(event) => { setSearchTerm(event.target.value); setDiscoveryFilter(null); }}
                placeholder="Search gifts..."
                className="w-full rounded-full border border-boutique-brown/15 bg-white/90 py-2.5 pl-10 pr-9 text-sm text-boutique-brown shadow-sm outline-none placeholder:text-boutique-brown/35 focus:border-boutique-wood/40 focus:ring-2 focus:ring-boutique-wood/25"
              />
              {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-boutique-brown/40 hover:text-boutique-brown"><X className="h-4 w-4" /></button>}
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {['all', ...categories].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => { setActiveCategory(category); setDiscoveryFilter(null); }}
                      className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${activeCategory === category ? 'bg-boutique-brown text-white shadow-sm' : 'border border-boutique-brown/12 bg-white/80 text-boutique-brown-light hover:bg-[#fff4df]'}`}
                    >
                      {category === 'all' ? 'All' : category}
                    </button>
                  ))}
                </div>
              )}

              <div ref={sortMenuRef} className="relative min-w-[190px]">
                <button type="button" onClick={() => setIsSortMenuOpen((isOpen) => !isOpen)} aria-haspopup="listbox" aria-expanded={isSortMenuOpen} className="flex w-full items-center justify-between gap-3 rounded-full border border-boutique-brown/15 bg-white/90 px-4 py-2.5 text-left text-sm font-semibold text-boutique-brown shadow-sm outline-none transition-all hover:border-boutique-wood/35 hover:bg-[#fffaf3] focus:ring-2 focus:ring-boutique-wood/25">
                  <span>{selectedSortLabel}</span>
                  <ChevronDown className={`h-4 w-4 text-boutique-wood transition-transform duration-200 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSortMenuOpen && (
                  <div role="listbox" aria-label="Sort products" className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-full min-w-[225px] overflow-hidden rounded-[1.35rem] border border-boutique-brown/12 bg-[#fffaf3]/95 p-1.5 shadow-[0_18px_45px_rgba(58,37,26,0.18)] backdrop-blur-xl">
                    {SORT_OPTIONS.map((option) => {
                      const isSelected = option.value === sortBy;
                      return (
                        <button key={option.value} type="button" role="option" aria-selected={isSelected} onClick={() => { setSortBy(option.value); setIsSortMenuOpen(false); }} className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-sm transition-colors ${isSelected ? 'bg-[#f0dcc5] font-bold text-boutique-brown' : 'font-medium text-boutique-brown-light hover:bg-[#fff0de] hover:text-boutique-brown'}`}>
                          <span>{option.label}</span>{isSelected && <Check className="h-4 w-4 text-boutique-wood" strokeWidth={2.4} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!productsLoading && filteredProducts.length === 0 ? (
            <div className="rounded-[1.6rem] border border-boutique-brown/10 bg-white/70 px-6 py-16 text-center shadow-sm backdrop-blur-sm">
              <p className="font-serif text-2xl text-boutique-brown">No gifts found</p>
              <p className="mt-2 text-sm text-boutique-brown-light">{hasFilters ? 'Try a different search or filter.' : 'Check back soon for new arrivals.'}</p>
              {hasFilters && <button type="button" onClick={clearFilters} className="mt-5 inline-flex rounded-full bg-boutique-brown px-5 py-2.5 text-sm font-bold text-white hover:bg-boutique-wood">Clear filters</button>}
            </div>
          ) : (
            <div className="flex flex-col gap-y-14 md:-mb-6">
              {productRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex w-full flex-col items-center justify-center gap-6 md:flex-row md:items-stretch md:gap-4">
                  {row.map((product) => <div key={product.id} className="flex w-full max-w-[540px] md:w-[32.5%]"><ProductCard product={product} /></div>)}
                </div>
              ))}
            </div>
          )}
        </section>

        <HomeOrderReassurance />
      </main>

      <footer id="our-story" className="relative z-20 mt-10 w-full scroll-mt-24 border-t border-boutique-brown/10 bg-boutique-bg pb-4 pt-4 md:pt-5">
        <div className="relative z-10 mx-auto grid max-w-[1300px] grid-cols-1 items-start divide-y divide-boutique-brown/15 px-6 md:grid-cols-4 md:divide-x md:divide-y-0">
          <div className="flex flex-col items-start gap-2 py-2.5 md:py-0 md:pr-10">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="group/logo text-left" aria-label="Back to MY BABY SHIRE home"><BrandLogo variant="footer" className="!w-[140px] sm:!w-[160px] md:!w-[180px]" /></button>
            <p className="max-w-[260px] text-[12px] leading-relaxed text-boutique-brown-light opacity-90">Crafting thoughtful baby gifts and keepsakes with love and care.</p>
          </div>

          <div className="flex flex-col gap-2 py-2.5 md:px-10 md:py-1">
            <h4 className="mb-1 flex items-center gap-3 font-serif text-sm uppercase tracking-[0.1em] text-boutique-brown md:text-[14px]">SHOP <div className="flex translate-y-[-2px] items-end gap-2"><img src="/toy-abc-blocks.png" className="h-auto w-[42px] object-contain opacity-90 mix-blend-multiply drop-shadow-sm" alt="" /><img src="/toy-wooden-train.png" className="h-auto w-[63px] object-contain opacity-90 mix-blend-multiply drop-shadow-sm" alt="" /></div></h4>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => applyDiscoveryFilter('new-arrivals')} className="text-left text-[13px] text-boutique-brown-light opacity-90 transition-colors hover:text-boutique-wood md:text-[14px]">New Arrivals</button>
              <button type="button" onClick={() => scrollToSection('featured-gifts')} className="text-left text-[13px] text-boutique-brown-light opacity-90 transition-colors hover:text-boutique-wood md:text-[14px]">Made Just for Them</button>
            </div>
          </div>

          <div id="personalization" className="flex scroll-mt-24 flex-col gap-2 py-2.5 md:px-10 md:py-1">
            <h4 className="mb-1 flex items-center gap-3 font-serif text-sm uppercase tracking-[0.1em] text-boutique-brown md:text-[14px]">SUPPORT <img src="/toy-drum-blue.png" className="h-auto w-[60px] translate-y-[-2px] object-contain mix-blend-multiply drop-shadow-sm" alt="" /></h4>
            <div className="flex flex-col gap-2">
              <Link to="/account" className="text-[13px] text-boutique-brown-light opacity-90 transition-colors hover:text-boutique-wood md:text-[14px]">My Account</Link>
              <Link to="/track-order" className="text-[13px] text-boutique-brown-light opacity-90 transition-colors hover:text-boutique-wood md:text-[14px]">Track Your Order</Link>
              <Link to="/policies/shipping" className="text-[13px] text-boutique-brown-light opacity-90 transition-colors hover:text-boutique-wood md:text-[14px]">Shipping</Link>
              <Link to="/policies/returns" className="text-[13px] text-boutique-brown-light opacity-90 transition-colors hover:text-boutique-wood md:text-[14px]">Returns &amp; Refunds</Link>
              <button type="button" onClick={() => scrollToSection('featured-gifts')} className="text-left text-[13px] text-boutique-brown-light opacity-90 transition-colors hover:text-boutique-wood md:text-[14px]">Gift Details Help</button>
            </div>
          </div>

          <div className="relative flex flex-col gap-2 py-2.5 md:py-1 md:pl-10">
            <h4 className="mb-1 flex items-center gap-3 font-serif text-sm uppercase tracking-[0.1em] text-boutique-brown md:text-[14px]">STAY CONNECTED <img src="/toy-teddy-ring-teether.png" className="h-auto w-[51px] translate-y-[-2px] object-contain mix-blend-multiply drop-shadow-sm" alt="" /></h4>
            <p className="max-w-[240px] text-[13px] leading-relaxed text-boutique-brown-light opacity-90 md:text-[14px]">Join our newsletter for magical updates and early access to new collections.</p>
            <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -bottom-10 right-0 z-0 h-auto w-[140px] object-contain opacity-50 mix-blend-multiply md:right-[-10%] md:translate-x-[50%]" alt="" />
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-8 max-w-[1300px] border-t border-boutique-brown/10 px-6 pt-5">
          <div className="flex flex-col items-center justify-between gap-3 text-[12px] text-boutique-brown-light md:flex-row">
            <p className="opacity-80">© {new Date().getFullYear()} MY BABY SHIRE. All rights reserved.</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <Link to="/policies/shipping" className="transition-colors hover:text-boutique-wood">Shipping</Link>
              <Link to="/policies/returns" className="transition-colors hover:text-boutique-wood">Returns &amp; Refunds</Link>
              <Link to="/policies/privacy" className="transition-colors hover:text-boutique-wood">Privacy</Link>
              <Link to="/policies/terms" className="transition-colors hover:text-boutique-wood">Terms</Link>
            </nav>
          </div>
          <p className="mt-4 text-center text-[11px] text-boutique-brown-light/80">Designed &amp; Developed by{' '}<a href="https://omeryigitler.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-boutique-brown underline decoration-transparent decoration-1 underline-offset-2 transition-all duration-200 hover:text-boutique-wood hover:decoration-boutique-wood/50">Ömer YİĞİTLER</a></p>
        </div>
      </footer>
    </div>
  );
}
