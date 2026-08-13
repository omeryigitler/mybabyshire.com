import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from './store/useStore';
import { CartDrawer } from './components/CartDrawer';
import { PersonalizationModal } from './components/PersonalizationModal';
import { ProductCard } from './components/ProductCard';
import { BrandLogo } from './components/BrandLogo';
import { useSeo } from './utils/seo';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
] as const;

const DecorativeElement = ({ src, className, size = "w-20 md:w-24 h-auto", rotate = "0deg" }: any) => (
  <div
    className={`absolute pointer-events-none z-0 ${className}`}
    style={{
      filter: src.includes('cloud')
        ? 'drop-shadow(0 12px 14px rgba(58, 37, 26, 0.12)) drop-shadow(0 2px 4px rgba(58, 37, 26, 0.08))'
        : 'drop-shadow(var(--shadow-soft-subtle))',
    }}
  >
    <img src={src} className={`${size} object-contain mix-blend-multiply`} style={{ transform: `rotate(${rotate})` }} alt="" />
  </div>
);

export default function Storefront() {
  const { openCart, cartItems, products, loadProducts, productsLoading } = useStore();
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useSeo({
    description: 'Shop personalized baby gifts made with love — custom blankets, keepsakes, and nursery essentials, shipped across the US.',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
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
      const matchesQuery = !query
        || product.name.toLowerCase().includes(query)
        || (product.description || '').toLowerCase().includes(query);
      const matchesCategory = activeCategory === 'all' || product.categoryName === activeCategory;
      return matchesQuery && matchesCategory;
    });

    result = [...result];
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0));
    return result;
  }, [products, searchTerm, activeCategory, sortBy]);

  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Featured';
  const hasFilters = Boolean(searchTerm.trim()) || activeCategory !== 'all' || sortBy !== 'featured';

  const productRows = filteredProducts.reduce<typeof products[]>((rows, product, index) => {
    const rowIndex = Math.floor(index / 3);

    if (!rows[rowIndex]) {
      rows[rowIndex] = [];
    }

    rows[rowIndex].push(product);
    return rows;
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!isSortMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
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
    <div className="w-full min-h-screen bg-boutique-bg font-sans overflow-x-clip relative selection:bg-boutique-wood-light">
      <CartDrawer />
      <PersonalizationModal />

      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-pattern bg-[length:400px_400px]"></div>

      <header className="relative z-30 flex min-h-[82px] w-full items-center justify-between border-b border-boutique-brown/5 bg-boutique-bg/80 px-4 py-0 backdrop-blur-md sm:px-6 md:min-h-[104px] md:px-12 lg:min-h-[112px]">
        <nav className="relative z-20 hidden max-w-[38%] items-center gap-5 text-sm font-medium text-boutique-brown-light lg:flex lg:gap-7">
          <button type="button" onClick={() => scrollToSection('shop')} className="hover:text-boutique-wood transition-colors flex items-center gap-2">Shop <img src="/cloud-watercolor-pink.png" className="w-6 object-contain opacity-85 drop-shadow-[0_3px_5px_rgba(58,37,26,0.18)]" alt=""/></button>
          <button type="button" onClick={() => scrollToSection('personalization')} className="hover:text-boutique-wood transition-colors flex items-center gap-2">Personalization <img src="/cloud-watercolor-blue-light.png" className="w-6 object-contain opacity-85 drop-shadow-[0_3px_5px_rgba(58,37,26,0.18)]" alt=""/></button>
          <button type="button" onClick={() => scrollToSection('gifts')} className="hover:text-boutique-wood transition-colors flex items-center gap-2">Gifts <img src="/cloud-watercolor-blue-dense.png" className="w-6 object-contain opacity-85 drop-shadow-[0_3px_5px_rgba(58,37,26,0.18)]" alt=""/></button>
          <button type="button" onClick={() => scrollToSection('our-story')} className="hover:text-boutique-wood transition-colors">Our Story</button>
        </nav>

        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="group/logo absolute left-4 top-1/2 z-10 flex translate-x-0 -translate-y-1/2 justify-start sm:left-6 md:left-1/2 md:-translate-x-1/2 md:justify-center" aria-label="Back to MY BABY SHIRE home">
          <BrandLogo variant="header" />
        </button>

        <div className="relative z-20 ml-auto flex items-center gap-2 text-boutique-brown sm:gap-3 md:gap-5">
          <button type="button" onClick={focusSearch} aria-label="Search products" className="hidden p-2 transition-colors hover:text-boutique-wood sm:inline-flex"><Search size={22} strokeWidth={1.5} /></button>
          <Link to="/account" className="hover:text-boutique-wood transition-colors p-2" aria-label="Member account">
            <UserRound size={22} strokeWidth={1.5} />
          </Link>
          <button type="button" onClick={openCart} className="hover:text-boutique-wood transition-colors p-2 relative">
            <ShoppingBag size={22} strokeWidth={1.5} />
            {cartItemCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-boutique-brown text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartItemCount}</span>}
          </button>
        </div>
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-start pb-8 md:pb-0 overflow-visible">
        <section id="gifts" className="scroll-mt-24 relative z-10 w-full max-w-[1500px] px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[1.9rem] border border-boutique-brown/10 bg-white/55 shadow-[0_20px_65px_rgba(58,37,26,0.10)] backdrop-blur-[2px] md:rounded-[2.5rem]">
            <DecorativeElement src="/cloud-watercolor-pink.png" className="-left-14 top-8 opacity-45 sm:-left-10 sm:top-12" rotate="5deg" size="w-36 sm:w-48 md:w-60" />
            <DecorativeElement src="/cloud-watercolor-blue-light.png" className="-right-16 top-10 opacity-45 sm:-right-8 md:top-5" rotate="-6deg" size="w-40 sm:w-52 md:w-72" />
            <DecorativeElement src="/decorative-moon-star.png" className="right-[44%] top-8 hidden opacity-50 lg:block" rotate="-12deg" size="w-24" />

            <div className="relative z-10 grid items-center lg:grid-cols-[0.88fr_1.12fr]">
              <div className="order-1 px-5 pb-5 pt-8 text-center sm:px-8 sm:pt-10 md:px-10 lg:px-12 lg:py-14 lg:text-left xl:px-16 xl:py-16">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-boutique-brown/12 bg-[#fffaf3]/85 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-boutique-brown-light shadow-sm backdrop-blur-sm sm:text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-boutique-wood" /> Made just for them
                </span>

                <h1 className="font-serif text-[42px] leading-[1.03] tracking-[-0.025em] text-boutique-brown sm:text-[50px] md:text-[58px] lg:text-[62px] xl:text-[68px]">
                  Personalized Baby Gifts<br className="hidden sm:block" /> Made with Love
                </h1>

                <p className="mx-auto mt-4 max-w-[620px] font-sans text-[16px] leading-relaxed text-boutique-brown-light sm:text-[18px] lg:mx-0 lg:max-w-[560px] lg:text-[19px]">
                  Thoughtful keepsakes, soft baby essentials, and meaningful gifts personalized with their name and made to treasure.
                </p>

                <div className="mx-auto mt-6 flex w-full max-w-[620px] flex-col items-center gap-2.5 sm:mt-7 sm:flex-row sm:justify-center sm:gap-3 lg:mx-0 lg:justify-start">
                  <button type="button" onClick={() => scrollToSection('shop')} className="group relative flex h-[66px] w-full min-w-0 cursor-pointer items-center justify-center transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:min-w-[286px] md:h-[68px] md:min-w-[300px]">
                    <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-md transition-all group-active:drop-shadow-sm" alt="" />
                    <span className="relative z-10 px-7 text-center text-[16px] font-bold leading-tight text-boutique-brown sm:text-[17px] md:text-lg">Shop Personalized Gifts</span>
                  </button>

                  <button type="button" onClick={() => scrollToSection('shop')} className="group relative flex h-[58px] w-full min-w-0 cursor-pointer items-center justify-center opacity-85 transition-all hover:-translate-y-0.5 hover:opacity-100 active:translate-y-0 sm:w-auto sm:min-w-[246px] md:h-[62px]">
                    <img src="/btn-paw-blank-cream.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-sm transition-all group-active:drop-shadow-none" alt="" />
                    <span className="relative z-10 px-6 text-center text-[15px] font-semibold leading-tight text-boutique-brown-light sm:text-[16px]">Explore New Arrivals</span>
                  </button>
                </div>

                <p className="mt-4 text-[12px] font-medium tracking-[0.02em] text-boutique-brown-light/80 sm:text-[13px]">
                  Choose a gift, add their name, and make it unmistakably theirs.
                </p>
              </div>

              <div className="order-2 relative min-h-[320px] overflow-hidden border-t border-boutique-brown/8 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.96),rgba(247,231,212,0.58)_62%,rgba(228,205,178,0.25)_100%)] sm:min-h-[390px] lg:min-h-[560px] lg:border-l lg:border-t-0">
                <img src="/cloud-watercolor-blue-dense.png" className="pointer-events-none absolute -right-10 top-5 w-40 object-contain opacity-25 mix-blend-multiply sm:w-52 lg:w-64" alt="" />
                <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute left-[9%] top-[14%] w-10 rotate-[-12deg] object-contain opacity-45 mix-blend-multiply sm:w-12" alt="" />
                <img src="/toy-teddy-ring-teether.png" className="pointer-events-none absolute bottom-[7%] right-[7%] z-20 w-20 rotate-[7deg] object-contain opacity-90 drop-shadow-md sm:w-24 lg:w-28" alt="" />
                <img
                  src="/product-blanket-cutout-v1.png"
                  alt="Personalized baby blanket"
                  loading="eager"
                  fetchPriority="high"
                  className="absolute left-1/2 top-1/2 z-10 w-[92%] max-w-[720px] -translate-x-1/2 -translate-y-[48%] object-contain drop-shadow-[0_22px_30px_rgba(58,37,26,0.20)] sm:w-[88%] lg:w-[94%]"
                />

                <div className="absolute bottom-4 left-4 z-20 max-w-[190px] rounded-[1.2rem] border border-boutique-brown/12 bg-[#fffaf3]/88 px-3.5 py-2.5 text-left shadow-[0_12px_32px_rgba(58,37,26,0.12)] backdrop-blur-md sm:bottom-6 sm:left-6 sm:max-w-none sm:px-4 sm:py-3">
                  <p className="font-serif text-[16px] leading-tight text-boutique-brown sm:text-[18px]">A gift with their name on it</p>
                  <p className="mt-1 text-[11px] leading-snug text-boutique-brown-light sm:text-[12px]">Personalized details make every piece feel one of a kind.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-20 mx-2 -mt-px grid grid-cols-1 overflow-hidden rounded-b-[1.45rem] border border-t-0 border-boutique-brown/10 bg-[#fffaf3]/92 shadow-[0_12px_32px_rgba(58,37,26,0.07)] backdrop-blur-md sm:mx-5 sm:grid-cols-3 md:mx-8">
            {[
              ['Hand Embroidered', 'Care in every stitch'],
              ['Gift-Ready Packaging', 'Thoughtfully prepared'],
              ['Ships Across the US', 'Made for gifting nationwide'],
            ].map(([title, detail], index) => (
              <div key={title} className={`flex min-h-[68px] items-center gap-3 px-4 py-3 sm:min-h-[76px] sm:justify-center sm:px-5 ${index > 0 ? 'border-t border-boutique-brown/10 sm:border-l sm:border-t-0' : ''}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-boutique-wood/25 bg-white/75 text-boutique-wood shadow-sm">
                  <Check className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold text-boutique-brown sm:text-[13px]">{title}</span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-boutique-brown-light/75 sm:text-[11px]">{detail}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {productsLoading && <p className="relative z-20 mb-2 mt-6 text-sm text-boutique-brown-light">Loading products...</p>}

        <div id="shop" className="scroll-mt-24 relative z-20 mx-auto mt-8 w-full max-w-[1620px] px-4 md:mt-12 md:px-8">
          <div className="mb-7 text-center">
            <h2 className="font-serif text-3xl text-boutique-brown md:text-[40px]">Shop the Collection</h2>
            <p className="mt-2 text-sm text-boutique-brown-light md:text-base">Personalized gifts, ready to make their own.</p>
          </div>

          <div className="mb-9 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-boutique-brown/40" />
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search gifts..."
                className="w-full rounded-full border border-boutique-brown/15 bg-white/90 py-2.5 pl-10 pr-9 text-sm text-boutique-brown shadow-sm outline-none placeholder:text-boutique-brown/35 focus:border-boutique-wood/40 focus:ring-2 focus:ring-boutique-wood/25"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-boutique-brown/40 hover:text-boutique-brown"><X className="h-4 w-4" /></button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {['all', ...categories].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                        activeCategory === category
                          ? 'bg-boutique-brown text-white shadow-sm'
                          : 'border border-boutique-brown/12 bg-white/80 text-boutique-brown-light hover:bg-[#fff4df]'
                      }`}
                    >
                      {category === 'all' ? 'All' : category}
                    </button>
                  ))}
                </div>
              )}

              <div ref={sortMenuRef} className="relative min-w-[190px]">
                <button
                  type="button"
                  onClick={() => setIsSortMenuOpen((isOpen) => !isOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isSortMenuOpen}
                  className="flex w-full items-center justify-between gap-3 rounded-full border border-boutique-brown/15 bg-white/90 px-4 py-2.5 text-left text-sm font-semibold text-boutique-brown shadow-sm outline-none transition-all hover:border-boutique-wood/35 hover:bg-[#fffaf3] focus:ring-2 focus:ring-boutique-wood/25"
                >
                  <span>{selectedSortLabel}</span>
                  <ChevronDown className={`h-4 w-4 text-boutique-wood transition-transform duration-200 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortMenuOpen && (
                  <div
                    role="listbox"
                    aria-label="Sort products"
                    className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-full min-w-[225px] overflow-hidden rounded-[1.35rem] border border-boutique-brown/12 bg-[#fffaf3]/95 p-1.5 shadow-[0_18px_45px_rgba(58,37,26,0.18)] backdrop-blur-xl"
                  >
                    {SORT_OPTIONS.map((option) => {
                      const isSelected = option.value === sortBy;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSortBy(option.value);
                            setIsSortMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-[#f0dcc5] font-bold text-boutique-brown'
                              : 'font-medium text-boutique-brown-light hover:bg-[#fff0de] hover:text-boutique-brown'
                          }`}
                        >
                          <span>{option.label}</span>
                          {isSelected && <Check className="h-4 w-4 text-boutique-wood" strokeWidth={2.4} />}
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
              {hasFilters && (
                <button type="button" onClick={() => { setSearchTerm(''); setActiveCategory('all'); setSortBy('featured'); }} className="mt-5 inline-flex rounded-full bg-boutique-brown px-5 py-2.5 text-sm font-bold text-white hover:bg-boutique-wood">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-y-14 md:-mb-6">
              {productRows.map((row, rowIndex) => <div key={rowIndex} className="flex flex-col md:flex-row justify-center items-center md:items-stretch gap-6 md:gap-4 w-full">{row.map((product) => <div key={product.id} className="flex w-full max-w-[540px] md:w-[32.5%]"><ProductCard product={product} /></div>)}</div>)}
            </div>
          )}
        </div>
      </main>

      <footer id="our-story" className="scroll-mt-24 w-full bg-boutique-bg border-t border-boutique-brown/10 relative z-20 pt-4 md:pt-5 pb-4 mt-4">
        <div className="max-w-[1300px] mx-auto px-6 grid grid-cols-1 items-start md:grid-cols-4 md:divide-x divide-y md:divide-y-0 divide-boutique-brown/15 relative z-10">
          <div className="flex flex-col items-start gap-2 py-2.5 md:py-0 md:pr-10">
             <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="group/logo text-left" aria-label="Back to MY BABY SHIRE home">
               <BrandLogo variant="footer" className="!w-[140px] sm:!w-[160px] md:!w-[180px]" />
             </button>
             <p className="font-sans text-boutique-brown-light leading-relaxed max-w-[260px] text-[12px] opacity-90">Crafting expertly personalized baby gifts and nursery essentials with love and care.</p>
          </div>

          <div className="flex flex-col gap-2 py-2.5 md:py-1 md:px-10">
            <h4 className="font-serif tracking-[0.1em] text-boutique-brown text-sm md:text-[14px] uppercase flex items-center gap-3 mb-1">SHOP <div className="flex items-end gap-2 translate-y-[-2px]"><img src="/toy-abc-blocks.png" className="w-[42px] h-auto object-contain mix-blend-multiply opacity-90 drop-shadow-sm" alt="" /><img src="/toy-wooden-train.png" className="w-[63px] h-auto object-contain mix-blend-multiply opacity-90 drop-shadow-sm" alt="" /></div></h4>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => scrollToSection('shop')} className="text-left hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">New Arrivals</button>
              <button type="button" onClick={() => scrollToSection('shop')} className="text-left hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">Personalized Gifts</button>
            </div>
          </div>

          <div id="personalization" className="scroll-mt-24 flex flex-col gap-2 py-2.5 md:py-1 md:px-10">
            <h4 className="font-serif tracking-[0.1em] text-boutique-brown text-sm md:text-[14px] uppercase flex items-center gap-3 mb-1">SUPPORT <img src="/toy-drum-blue.png" className="w-[60px] h-auto object-contain mix-blend-multiply translate-y-[-2px] drop-shadow-sm" alt="" /></h4>
            <div className="flex flex-col gap-2">
              <Link to="/account" className="hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">My Account</Link>
              <Link to="/track-order" className="hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">Track Your Order</Link>
              <Link to="/policies/shipping" className="hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">Shipping</Link>
              <Link to="/policies/returns" className="hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">Returns &amp; Refunds</Link>
              <button type="button" onClick={() => scrollToSection('personalization')} className="text-left hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">Personalization Help</button>
            </div>
          </div>

          <div className="flex flex-col gap-2 py-2.5 md:py-1 md:pl-10 relative">
            <h4 className="font-serif tracking-[0.1em] text-boutique-brown text-sm md:text-[14px] uppercase flex items-center gap-3 mb-1">STAY CONNECTED <img src="/toy-teddy-ring-teether.png" className="w-[51px] h-auto object-contain mix-blend-multiply translate-y-[-2px] drop-shadow-sm" alt="" /></h4>
            <p className="font-sans text-boutique-brown-light leading-relaxed opacity-90 text-[13px] md:text-[14px] max-w-[240px]">Join our newsletter for magical updates and early access to new collections.</p>
            <img src="/cloud-watercolor-blue-light.png" className="absolute -bottom-10 right-[0%] md:right-[-10%] w-[140px] h-auto object-contain mix-blend-multiply opacity-50 z-0 pointer-events-none md:translate-x-[50%]" alt="" />
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-8 max-w-[1300px] border-t border-boutique-brown/10 px-6 pt-5">
          <div className="flex flex-col items-center justify-between gap-3 text-[12px] text-boutique-brown-light md:flex-row">
            <p className="opacity-80">© {new Date().getFullYear()} MY BABY SHIRE. All rights reserved.</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <Link to="/policies/shipping" className="hover:text-boutique-wood transition-colors">Shipping</Link>
              <Link to="/policies/returns" className="hover:text-boutique-wood transition-colors">Returns &amp; Refunds</Link>
              <Link to="/policies/privacy" className="hover:text-boutique-wood transition-colors">Privacy</Link>
              <Link to="/policies/terms" className="hover:text-boutique-wood transition-colors">Terms</Link>
            </nav>
          </div>
          <p className="mt-4 text-center text-[11px] text-boutique-brown-light/80">
            Designed &amp; Developed by{' '}
            <a
              href="https://omeryigitler.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-boutique-brown underline decoration-transparent decoration-1 underline-offset-2 transition-all duration-200 hover:text-boutique-wood hover:decoration-boutique-wood/50"
            >
              Ömer YİĞİTLER
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0L13.8 8.2L22 10L13.8 11.8L12 20L10.2 11.8L2 10L10.2 8.2L12 0Z" fill="#d9b691"/><path d="M5 16L5.6 18.4L8 19L5.6 19.6L5 22L4.4 19.6L2 19L4.4 18.4L5 16Z" fill="#d9b691"/></svg>
  );
}