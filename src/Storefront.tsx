import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Instagram,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './components/BrandLogo';
import { CartDrawer } from './components/CartDrawer';
import { PersonalizationModal } from './components/PersonalizationModal';
import { ProductCard } from './components/ProductCard';
import { Product, useStore } from './store/useStore';
import { useSeo } from './utils/seo';

type FilterMode = 'all' | 'new' | 'best' | 'baby' | 'toddler' | 'adult';
type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'name';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A–Z' },
];

const MODE_LABELS: Record<FilterMode, string> = {
  all: 'All Products',
  new: 'New Arrivals',
  best: 'Best Sellers',
  baby: 'Baby',
  toddler: 'Toddler',
  adult: 'Adult',
};

const productText = (product: Product) =>
  `${product.name} ${product.description || ''} ${product.categoryName || ''} ${product.ageRange || ''}`.toLowerCase();

export default function Storefront() {
  const { openCart, cartItems, products, loadProducts, productsLoading } = useStore();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortMode>('featured');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useSeo({
    description: 'Shop premium baby, toddler and family essentials from MY BABY SHIRE. Clean, easy shopping with secure checkout and fast US shipping.',
  });

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    window.setTimeout(() => searchRef.current?.focus(), 80);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSortOpen) return;
    const close = (event: PointerEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setIsSortOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [isSortOpen]);

  const categories = useMemo(() => {
    const values = new Set<string>();
    products.forEach((product) => {
      if (product.categoryName) values.add(product.categoryName);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const bestSellers = useMemo(() => {
    const selected = products.filter((product) => product.bestseller);
    return (selected.length ? selected : products).slice(0, 8);
  }, [products]);

  const newArrivals = useMemo(() => {
    const selected = products.filter((product) => product.newArrival);
    return (selected.length ? selected : [...products].reverse()).slice(0, 8);
  }, [products]);

  const findByKeyword = (keyword: string) => products.find((product) => productText(product).includes(keyword));

  const categoryTiles = useMemo(() => {
    const smartTiles: { label: string; mode: FilterMode; product?: Product }[] = [
      { label: 'New Arrivals', mode: 'new', product: products.find((product) => product.newArrival) || products[0] },
      { label: 'Baby', mode: 'baby', product: products.find((product) => productText(product).includes('baby')) || products[1] || products[0] },
      { label: 'Toddler', mode: 'toddler', product: products.find((product) => productText(product).includes('toddler')) || products[2] || products[0] },
      { label: 'Best Sellers', mode: 'best', product: products.find((product) => product.bestseller) || products[3] || products[0] },
      { label: 'Adult', mode: 'adult', product: products.find((product) => productText(product).includes('adult')) || products[4] || products[0] },
    ];
    return smartTiles.filter((tile) => tile.product);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let result = products.filter((product) => {
      const text = productText(product);
      const matchesSearch = !query || text.includes(query);
      const matchesCategory = activeCategory === 'all' || product.categoryName === activeCategory;
      const matchesMode =
        filterMode === 'all' ||
        (filterMode === 'new' && Boolean(product.newArrival)) ||
        (filterMode === 'best' && Boolean(product.bestseller)) ||
        (filterMode === 'baby' && /(baby|newborn|infant|bodysuit|onesie|romper)/.test(text)) ||
        (filterMode === 'toddler' && /(toddler|2t|3t|4t|5t)/.test(text)) ||
        (filterMode === 'adult' && /(adult|women|men|unisex adult)/.test(text));
      return matchesSearch && matchesCategory && matchesMode;
    });

    result = [...result];
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'featured') result.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    return result;
  }, [products, searchTerm, activeCategory, filterMode, sortBy]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const shopMode = (mode: FilterMode) => {
    setFilterMode(mode);
    setActiveCategory('all');
    setSearchTerm('');
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    window.setTimeout(() => scrollTo('shop-all'), 20);
  };

  const chooseCategory = (category: string) => {
    setFilterMode('all');
    setActiveCategory(category);
    setSearchTerm('');
    window.setTimeout(() => scrollTo('shop-all'), 20);
  };

  const clearFilters = () => {
    setFilterMode('all');
    setActiveCategory('all');
    setSearchTerm('');
    setSortBy('featured');
  };

  const heroProducts = bestSellers.slice(0, 2);
  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Featured';

  return (
    <div className="min-h-screen bg-white font-sans text-[#202020]">
      <CartDrawer />
      <PersonalizationModal />

      <div className="bg-[#f8e9ed] px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-[#4e3d42] sm:text-xs">
        Free shipping on orders over $150
      </div>

      <header className="sticky top-0 z-40 border-b border-[#e9e9e9] bg-white/95 backdrop-blur-lg">
        <div className="mx-auto grid min-h-[70px] max-w-[1560px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:min-h-[78px] lg:px-8">
          <nav className="hidden items-center gap-5 text-[13px] font-semibold xl:flex">
            <button type="button" onClick={() => shopMode('new')} className="commerce-focus hover:text-[#8a5966]">New</button>
            <button type="button" onClick={() => shopMode('best')} className="commerce-focus hover:text-[#8a5966]">Best Sellers</button>
            <button type="button" onClick={() => shopMode('baby')} className="commerce-focus hover:text-[#8a5966]">Baby</button>
            <button type="button" onClick={() => shopMode('toddler')} className="commerce-focus hover:text-[#8a5966]">Toddler</button>
            <button type="button" onClick={() => shopMode('adult')} className="commerce-focus hover:text-[#8a5966]">Adult</button>
            <button type="button" onClick={() => scrollTo('wholesale')} className="commerce-focus hover:text-[#8a5966]">Wholesale</button>
          </nav>

          <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5] xl:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="group/logo justify-self-center" aria-label="MY BABY SHIRE home">
            <BrandLogo variant="nav" className="!h-[39px] sm:!h-[45px] md:!h-[48px] !drop-shadow-none" />
          </Link>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button type="button" onClick={() => setIsSearchOpen((open) => !open)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Search"><Search className="h-5 w-5" /></button>
            <Link to="/account" className="commerce-focus hidden h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5] sm:inline-flex" aria-label="Account"><UserRound className="h-5 w-5" /></Link>
            <button type="button" onClick={openCart} className="commerce-focus relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute right-0.5 top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#202020] px-1 text-[9px] font-bold text-white">{cartCount}</span>}
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="absolute inset-x-0 top-full border-b border-[#e9e9e9] bg-white shadow-lg">
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
              <Search className="h-4.5 w-4.5 shrink-0 text-[#777]" />
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setFilterMode('all');
                    setActiveCategory('all');
                    setIsSearchOpen(false);
                    window.setTimeout(() => scrollTo('shop-all'), 20);
                  }
                }}
                placeholder="Search products..."
                className="commerce-focus min-w-0 flex-1 border-0 bg-transparent py-2 text-sm outline-none placeholder:text-[#aaa]"
              />
              <button type="button" onClick={() => setIsSearchOpen(false)} className="commerce-focus inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Close search"><X className="h-4.5 w-4.5" /></button>
            </div>
          </div>
        )}
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <button type="button" className="absolute inset-0 bg-black/25" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,390px)] flex-col bg-white shadow-2xl">
            <div className="flex min-h-20 items-center justify-between border-b border-[#ededed] px-5">
              <BrandLogo variant="nav" className="!h-[42px] !drop-shadow-none" />
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto px-5 py-5">
              {([
                ['New Arrivals', 'new'],
                ['Best Sellers', 'best'],
                ['Baby', 'baby'],
                ['Toddler', 'toddler'],
                ['Adult', 'adult'],
                ['All Products', 'all'],
              ] as [string, FilterMode][]).map(([label, mode]) => (
                <button key={mode} type="button" onClick={() => shopMode(mode)} className="commerce-focus flex items-center justify-between border-b border-[#eeeeee] py-4 text-left text-base font-semibold">
                  {label}<ArrowRight className="h-4 w-4 text-[#888]" />
                </button>
              ))}
              <button type="button" onClick={() => { setIsMobileMenuOpen(false); window.setTimeout(() => scrollTo('wholesale'), 20); }} className="commerce-focus flex items-center justify-between border-b border-[#eeeeee] py-4 text-left text-base font-semibold">Wholesale<ArrowRight className="h-4 w-4 text-[#888]" /></button>
            </nav>
            <div className="border-t border-[#ededed] p-5">
              <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="commerce-focus flex items-center gap-3 text-sm font-semibold"><UserRound className="h-4.5 w-4.5" /> My account</Link>
              <Link to="/track-order" onClick={() => setIsMobileMenuOpen(false)} className="commerce-focus mt-4 flex items-center gap-3 text-sm font-semibold"><PackageCheck className="h-4.5 w-4.5" /> Track order</Link>
            </div>
          </aside>
        </div>
      )}

      <main>
        <section className="mx-auto max-w-[1560px] px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-6 lg:px-8 lg:pb-16">
          <div className="grid min-h-[520px] overflow-hidden rounded-[14px] bg-[#f4ecee] lg:grid-cols-[.92fr_1.08fr] lg:min-h-[620px]">
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
              <span className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a5966]">Premium everyday essentials</span>
              <h1 className="max-w-[650px] text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] text-[#202020] sm:text-5xl lg:text-[58px] xl:text-[66px]">Simple pieces.<br />Made to be yours.</h1>
              <p className="mt-5 max-w-lg text-sm leading-6 text-[#666] sm:text-base sm:leading-7">Shop soft baby, toddler and family essentials with an easier, faster shopping experience and the personalization options you already know.</p>
              <div className="mt-7 grid gap-2.5 sm:flex sm:flex-wrap">
                <button type="button" onClick={() => shopMode('new')} className="commerce-focus inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#393939]">Shop new arrivals <ArrowRight className="h-4 w-4" /></button>
                <button type="button" onClick={() => shopMode('best')} className="commerce-focus inline-flex min-h-[48px] items-center justify-center rounded-[9px] border border-[#202020] bg-transparent px-6 text-sm font-semibold transition-colors hover:bg-white/55">Shop best sellers</button>
              </div>
            </div>

            <div className="relative min-h-[330px] overflow-hidden bg-[linear-gradient(145deg,#f7f0e5_0%,#e7f0f5_48%,#f7e5ea_100%)] lg:min-h-full">
              <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/45 blur-2xl" />
              <div className="absolute -bottom-24 left-4 h-72 w-72 rounded-full bg-white/50 blur-2xl" />
              {heroProducts[0] && <img src={heroProducts[0].imageUrl} alt={heroProducts[0].name} className="absolute bottom-[-3%] left-[2%] z-10 h-[76%] w-[54%] object-contain drop-shadow-[0_28px_34px_rgba(0,0,0,0.12)] sm:left-[7%] sm:h-[82%]" />}
              {heroProducts[1] && <img src={heroProducts[1].imageUrl} alt={heroProducts[1].name} className="absolute right-[-2%] top-[5%] z-20 h-[68%] w-[52%] rotate-[4deg] object-contain drop-shadow-[0_28px_34px_rgba(0,0,0,0.12)] sm:right-[2%] sm:h-[72%]" />}
              {!heroProducts.length && <div className="absolute inset-0 flex items-center justify-center text-sm text-[#777]">Products are loading...</div>}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a5966]">Find it faster</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Shop by category</h2></div>
            <button type="button" onClick={() => shopMode('all')} className="commerce-focus hidden items-center gap-2 text-sm font-semibold hover:text-[#8a5966] sm:inline-flex">View all <ArrowRight className="h-4 w-4" /></button>
          </div>

          <div className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
            {categoryTiles.map((tile) => (
              <button key={tile.label} type="button" onClick={() => shopMode(tile.mode)} className="commerce-focus group min-w-[42vw] snap-start text-left sm:min-w-0">
                <div className="aspect-square overflow-hidden rounded-[11px] border border-[#e7e7e7] bg-[#f7f7f7]">
                  <img src={tile.product!.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-[1.035]" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2"><span className="text-sm font-semibold">{tile.label}</span><ArrowRight className="h-4 w-4 text-[#888] transition-transform group-hover:translate-x-0.5" /></div>
              </button>
            ))}
          </div>
        </section>

        <ProductRail title="Best Sellers" eyebrow="Customer favorites" products={bestSellers} onViewAll={() => shopMode('best')} />

        <section className="border-y border-[#eeeeee] bg-[#fafafa]">
          <div className="mx-auto grid max-w-[1560px] grid-cols-2 gap-px bg-[#e9e9e9] sm:grid-cols-4">
            {[
              { icon: Sparkles, title: 'Premium Quality', text: 'Soft, dependable everyday pieces.' },
              { icon: Truck, title: 'Fast Shipping', text: 'Clear US shipping at checkout.' },
              { icon: ShieldCheck, title: 'Secure Checkout', text: 'Stripe and PayPal supported.' },
              { icon: PackageCheck, title: 'Easy Ordering', text: 'Simple cart and order tracking.' },
            ].map((item) => (
              <div key={item.title} className="bg-[#fafafa] p-5 sm:p-7 lg:p-8">
                <item.icon className="h-5 w-5" />
                <h3 className="mt-4 text-sm font-semibold sm:text-base">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-[#777] sm:text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <ProductRail title="New Arrivals" eyebrow="Just added" products={newArrivals} onViewAll={() => shopMode('new')} />

        <section id="wholesale" className="scroll-mt-28 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-[1560px] overflow-hidden rounded-[14px] bg-[#e8f1f6] lg:grid-cols-2">
            <div className="relative min-h-[330px] overflow-hidden bg-[linear-gradient(140deg,#f3ebe3_0%,#e7f0f5_100%)] lg:min-h-[520px]">
              {(findByKeyword('baby') || products[0]) && <img src={(findByKeyword('baby') || products[0]).imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-8 sm:p-12" />}
            </div>
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#536d7a]">For creators & small businesses</p>
              <h2 className="mt-3 max-w-md text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Simple products, easier bulk shopping.</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[#5d6970] sm:text-base sm:leading-7">Browse the existing catalog in a cleaner format. Wholesale availability can be handled without changing your current checkout and order system.</p>
              <button type="button" onClick={() => shopMode('all')} className="commerce-focus mt-7 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-6 text-sm font-semibold text-white hover:bg-[#383838] sm:w-fit">Shop all products <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        <section id="shop-all" className="scroll-mt-28 border-t border-[#eeeeee] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-[1560px]">
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a5966]">Catalog</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">{activeCategory !== 'all' ? activeCategory : MODE_LABELS[filterMode]}</h2>
                <p className="mt-2 text-sm text-[#777]">{filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}</p>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="relative sm:w-64">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" />
                  <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search catalog" className="commerce-focus h-11 w-full rounded-[9px] border border-[#dedede] bg-white pl-10 pr-10 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" />
                  {searchTerm && <button type="button" onClick={() => setSearchTerm('')} className="commerce-focus absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
                </div>

                <div ref={sortRef} className="relative sm:w-52">
                  <button type="button" onClick={() => setIsSortOpen((open) => !open)} className="commerce-focus flex h-11 w-full items-center justify-between rounded-[9px] border border-[#dedede] bg-white px-3.5 text-sm font-medium hover:border-[#bdbdbd]" aria-haspopup="listbox" aria-expanded={isSortOpen}>
                    {selectedSortLabel}<ChevronDown className={`h-4 w-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSortOpen && (
                    <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-full overflow-hidden rounded-[9px] border border-[#dedede] bg-white p-1.5 shadow-xl" role="listbox">
                      {SORT_OPTIONS.map((option) => (
                        <button key={option.value} type="button" onClick={() => { setSortBy(option.value); setIsSortOpen(false); }} className={`commerce-focus block w-full rounded-[7px] px-3 py-2.5 text-left text-sm ${sortBy === option.value ? 'bg-[#f4f4f4] font-semibold' : 'hover:bg-[#f7f7f7]'}`} role="option" aria-selected={sortBy === option.value}>{option.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="hide-scrollbar mb-7 flex gap-2 overflow-x-auto pb-1">
                <button type="button" onClick={() => chooseCategory('all')} className={`commerce-focus whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold ${activeCategory === 'all' ? 'border-[#202020] bg-[#202020] text-white' : 'border-[#dedede] bg-white hover:border-[#aaa]'}`}>All</button>
                {categories.map((category) => (
                  <button key={category} type="button" onClick={() => chooseCategory(category)} className={`commerce-focus whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold ${activeCategory === category ? 'border-[#202020] bg-[#202020] text-white' : 'border-[#dedede] bg-white hover:border-[#aaa]'}`}>{category}</button>
                ))}
              </div>
            )}

            {productsLoading && <div className="py-20 text-center text-sm text-[#777]">Loading products...</div>}

            {!productsLoading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6 xl:gap-y-12">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}

            {!productsLoading && filteredProducts.length === 0 && (
              <div className="rounded-[12px] border border-dashed border-[#d7d7d7] bg-[#fafafa] px-6 py-16 text-center">
                <p className="text-lg font-semibold">No matching products</p>
                <p className="mt-2 text-sm text-[#777]">Try clearing the current filters or search.</p>
                <button type="button" onClick={clearFilters} className="commerce-focus mt-5 rounded-[9px] bg-[#202020] px-5 py-3 text-sm font-semibold text-white">Clear filters</button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e8e8e8] bg-[#fafafa]">
        <div className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-9 lg:grid-cols-[1.3fr_.7fr_.7fr_.7fr] lg:gap-12">
            <div>
              <BrandLogo variant="footer" className="!w-[190px] !drop-shadow-none" />
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#707070]">A simpler way to shop MY BABY SHIRE essentials, personalization-ready products and customer favorites.</p>
              <div className="mt-5 flex gap-2"><span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dedede] bg-white"><Instagram className="h-4 w-4" /></span></div>
            </div>

            <FooterGroup title="Shop" links={[['New Arrivals', () => shopMode('new')], ['Best Sellers', () => shopMode('best')], ['Baby', () => shopMode('baby')], ['All Products', () => shopMode('all')]]} />
            <FooterLinks title="Help" links={[['Track Order', '/track-order'], ['My Account', '/account'], ['Shipping', '/policies/shipping'], ['Returns', '/policies/returns']]} />
            <FooterLinks title="Company" links={[['Privacy', '/policies/privacy'], ['Terms', '/policies/terms']]} />
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-[#e5e5e5] pt-5 text-xs text-[#888] sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} MY BABY SHIRE</span>
            <span>Secure checkout with Stripe & PayPal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductRail({ title, eyebrow, products, onViewAll }: { title: string; eyebrow: string; products: Product[]; onViewAll: () => void }) {
  return (
    <section className="mx-auto max-w-[1560px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a5966]">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{title}</h2></div>
        <button type="button" onClick={onViewAll} className="commerce-focus inline-flex items-center gap-2 text-sm font-semibold hover:text-[#8a5966]">View all <ArrowRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4 lg:gap-6">
        {products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

function FooterGroup({ title, links }: { title: string; links: [string, () => void][] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#555]">{title}</h3>
      <div className="mt-4 flex flex-col gap-3">
        {links.map(([label, action]) => <button key={label} type="button" onClick={action} className="commerce-focus w-fit text-left text-sm text-[#707070] hover:text-[#202020]">{label}</button>)}
      </div>
    </div>
  );
}

function FooterLinks({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#555]">{title}</h3>
      <div className="mt-4 flex flex-col gap-3">
        {links.map(([label, href]) => <Link key={label} to={href} className="commerce-focus w-fit text-sm text-[#707070] hover:text-[#202020]">{label}</Link>)}
      </div>
    </div>
  );
}
