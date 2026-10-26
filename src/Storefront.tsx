import { ETSY_ONLY_MODE, ETSY_SHOP_URL } from './config/commerce';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from './components/BrandLogo';
import { CartDrawer } from './components/CartDrawer';
import { PersonalizationModal } from './components/PersonalizationModal';
import { ProductCard } from './components/ProductCard';
import { Product, useStore } from './store/useStore';
import { useSeo } from './utils/seo';

const NAV_ITEMS = [
  ['New', '/collections/new-arrivals'],
  ['Best Sellers', '/collections/best-sellers'],
  ['Baby', '/collections/baby'],
  ['Toddler', '/collections/toddler'],
  ['Kids', '/collections/kids'],
  ['Adult', '/collections/adult'],
  ['Sweatshirts', '/collections/sweatshirts'],
] as const;

const productText = (product: Product) => `${product.name} ${product.description || ''} ${product.categoryName || ''} ${product.ageRange || ''}`.toLowerCase();

export default function Storefront() {
  const navigate = useNavigate();
  const { openCart, cartItems, products, loadProducts, productsLoading } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useSeo({ description: 'Shop blank apparel and custom-ready essentials for baby, toddler, kids and adult sizes from MY BABY SHIRE.' });

  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isMobileMenuOpen]);
  useEffect(() => {
    if (isSearchOpen) window.setTimeout(() => searchRef.current?.focus(), 60);
  }, [isSearchOpen]);

  const bestSellers = useMemo(() => {
    const flagged = products.filter((product) => product.bestseller);
    return (flagged.length ? flagged : products).slice(0, 8);
  }, [products]);

  const newArrivals = useMemo(() => {
    const flagged = products.filter((product) => product.newArrival);
    return (flagged.length ? flagged : products).slice(0, 8);
  }, [products]);

  const categoryTiles = useMemo(() => {
    const match = (pattern: RegExp, fallbackIndex: number) => products.find((product) => pattern.test(productText(product))) || products[fallbackIndex] || products[0];
    return [
      { label: 'New Arrivals', href: '/collections/new-arrivals', product: products.find((product) => product.newArrival) || products[0], tint: '#f8e9ed' },
      { label: 'Baby', href: '/collections/baby', product: match(/baby|newborn|infant|bodysuit|onesie|romper/, 1), tint: '#e8f1f5' },
      { label: 'Toddler', href: '/collections/toddler', product: match(/toddler|2t|3t|4t|5t/, 2), tint: '#f4eee4' },
      { label: 'Kids', href: '/collections/kids', product: match(/kid|kids|child|children|youth/, 3), tint: '#eef1e8' },
      { label: 'Adult', href: '/collections/adult', product: match(/adult|women|men|unisex/, 4), tint: '#efedf4' },
      { label: 'Sweatshirts', href: '/collections/sweatshirts', product: match(/sweatshirt|crewneck|hoodie|fleece/, 5), tint: '#f1eeee' },
    ].filter((tile) => tile.product);
  }, [products]);

  const customCategoryLinks = useMemo(() => {
    const unique = new Map<string, string>();
    products.forEach(product => {
      if (product.categorySlug && product.categoryName) unique.set(product.categorySlug, product.categoryName);
    });
    return [...unique.entries()].map(([slug, title]) => ({ slug, title })).sort((a, b) => a.title.localeCompare(b.title));
  }, [products]);

  const heroProducts = (bestSellers.length ? bestSellers : newArrivals).slice(0, 2);
  const babyPromoProduct = categoryTiles.find((tile) => tile.label === 'Baby')?.product || products[0];

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchTerm.trim();
    setIsSearchOpen(false);
    navigate(query ? `/collections/all?search=${encodeURIComponent(query)}` : '/collections/all');
  };

  const submitNewsletter = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) return;
    setNewsletterStatus('loading');
    setNewsletterMessage('');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not subscribe right now.');
      setNewsletterStatus('success');
      setNewsletterMessage('You’re on the list.');
      setNewsletterEmail('');
    } catch (error) {
      setNewsletterStatus('error');
      setNewsletterMessage((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#202020]">
      <CartDrawer />
      <PersonalizationModal />

      <div className="bg-[#f8e9ed] px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-[#4e3d42] sm:text-xs">Shop our collection · Secure checkout on Etsy</div>

      <header className="sticky top-0 z-40 border-b border-[#e9e9e9] bg-white/95 backdrop-blur-lg">
        <div className="mx-auto grid min-h-[70px] max-w-[1560px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:min-h-[78px] lg:px-8">
          <nav className="hidden items-center gap-5 text-[13px] font-semibold xl:flex">{NAV_ITEMS.map(([label, href]) => <Link key={href} to={href} className="commerce-focus hover:text-[#8a5966]">{label}</Link>)}</nav>
          <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5] xl:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <Link to="/" className="justify-self-center" aria-label="MY BABY SHIRE home"><BrandLogo variant="nav" className="!h-[39px] sm:!h-[45px] md:!h-[48px] !drop-shadow-none" /></Link>
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button type="button" onClick={() => setIsSearchOpen(true)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Search"><Search className="h-5 w-5" /></button>
            <Link to="/account" className="commerce-focus hidden h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5] sm:inline-flex" aria-label="Account"><UserRound className="h-5 w-5" /></Link>
            {!ETSY_ONLY_MODE && <button type="button" onClick={openCart} className="commerce-focus relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Cart"><ShoppingBag className="h-5 w-5" />{cartCount > 0 && <span className="absolute right-0.5 top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#202020] px-1 text-[9px] font-bold text-white">{cartCount}</span>}</button>}
          </div>
        </div>
      </header>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[70] bg-black/25" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0" onClick={() => setIsSearchOpen(false)} aria-label="Close search" />
          <div className="relative z-10 border-b border-[#e8e8e8] bg-white shadow-xl">
            <form onSubmit={submitSearch} className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 sm:px-6">
              <Search className="h-5 w-5 shrink-0 text-[#777]" />
              <input ref={searchRef} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products..." className="commerce-focus min-w-0 flex-1 border-0 bg-transparent py-2 text-base outline-none placeholder:text-[#aaa]" />
              <button type="submit" className="commerce-focus rounded-[9px] bg-[#202020] px-4 py-2.5 text-sm font-semibold text-white">Search</button>
              <button type="button" onClick={() => setIsSearchOpen(false)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Close"><X className="h-5 w-5" /></button>
            </form>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[70] xl:hidden">
          <button type="button" className="absolute inset-0 bg-black/25" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,390px)] flex-col bg-white shadow-2xl">
            <div className="flex min-h-20 items-center justify-between border-b border-[#ededed] px-5"><BrandLogo variant="nav" className="!h-[42px] !drop-shadow-none" /><button type="button" onClick={() => setIsMobileMenuOpen(false)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Close menu"><X className="h-5 w-5" /></button></div>
            <nav className="flex flex-1 flex-col overflow-y-auto px-5 py-5">{NAV_ITEMS.map(([label, href]) => <Link key={href} to={href} onClick={() => setIsMobileMenuOpen(false)} className="commerce-focus flex items-center justify-between border-b border-[#eeeeee] py-4 text-base font-semibold">{label}<ArrowRight className="h-4 w-4 text-[#888]" /></Link>)}<Link to="/collections/all" onClick={() => setIsMobileMenuOpen(false)} className="commerce-focus flex items-center justify-between border-b border-[#eeeeee] py-4 text-base font-semibold">All Products<ArrowRight className="h-4 w-4 text-[#888]" /></Link></nav>
            <div className="grid gap-2 border-t border-[#ededed] p-5"><Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold">My account</Link><Link to="/track-order" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold">Track order</Link></div>
          </aside>
        </div>
      )}

      <main>
        <section className="overflow-hidden border-b border-[#ededed] bg-[#f6f3f1]">
          <div className="mx-auto grid min-h-[64vh] max-w-[1560px] items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-14">
            <div className="max-w-xl py-4 lg:py-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a5966]">MY BABY SHIRE</p>
              <h1 className="mt-3 text-[clamp(2.8rem,7vw,6.3rem)] font-semibold leading-[0.95] tracking-[-0.055em]">Premium blanks, made simple.</h1>
              <p className="mt-5 max-w-lg text-sm leading-6 text-[#666] sm:text-base">A cleaner way to shop baby, toddler, kids and adult essentials—with Color × Size options and customization only where a product actually needs it.</p>
              <div className="mt-7 flex flex-wrap gap-2.5"><Link to="/collections/new-arrivals" className="commerce-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838]">Shop new <ArrowRight className="h-4 w-4" /></Link><Link to="/collections/all" className="commerce-focus inline-flex min-h-12 items-center justify-center rounded-[9px] border border-[#d5d5d5] bg-white px-5 text-sm font-semibold hover:border-[#aaa]">Shop all</Link></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:pl-4">
              {heroProducts.length > 0 ? heroProducts.map((product, index) => <Link key={product.id} to={`/products/${product.slug || product.id}`} className={`commerce-focus group relative overflow-hidden rounded-[14px] border border-white/80 bg-white shadow-sm ${index === 1 ? 'mt-10 sm:mt-16' : ''}`}><div className="aspect-[4/5] bg-[linear-gradient(150deg,#fff_0%,#f4f4f4_100%)] p-4 sm:p-6"><img src={product.imageUrl} alt={product.name} loading="eager" decoding="async" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.025]" /></div><div className="border-t border-[#eeeeee] bg-white p-3 sm:p-4"><p className="line-clamp-1 text-xs font-semibold sm:text-sm">{product.name}</p><p className="mt-1 text-xs text-[#777]">{ETSY_ONLY_MODE ? product.etsyUrl ? 'See options and availability on Etsy' : 'View product details' : '$' + product.price.toFixed(2)}</p></div></Link>) : <><div className="aspect-[4/5] rounded-[14px] bg-white/70" /><div className="mt-10 aspect-[4/5] rounded-[14px] bg-white/70 sm:mt-16" /></>}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Browse</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Shop by category</h2></div><Link to="/collections/all" className="hidden text-sm font-semibold text-[#666] hover:text-[#202020] sm:inline">View all</Link></div>
          {productsLoading ? <div className="py-10 text-center text-sm text-[#777]">Loading catalog...</div> : <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible md:grid-cols-6">{categoryTiles.map((tile) => <Link key={tile.href} to={tile.href} className="commerce-focus group min-w-[42%] snap-start sm:min-w-0"><div className="aspect-square overflow-hidden rounded-full border border-[#e8e8e8] p-3 sm:p-4" style={{ backgroundColor: tile.tint }}><img src={tile.product!.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" /></div><p className="mt-3 text-center text-xs font-semibold sm:text-sm">{tile.label}</p></Link>)}</div>}
        </section>

        {customCategoryLinks.length > 0 && <section className="border-t border-[#eee] bg-white">
          <div className="mx-auto max-w-[1560px] px-4 py-9 sm:px-6 lg:px-8">
            <h2 className="mb-4 text-lg font-semibold">Browse our product collections</h2>
            <div className="flex flex-wrap gap-2">
              {customCategoryLinks.map(category => <Link key={category.slug} to={'/collections/category-' + encodeURIComponent(category.slug)} className="rounded-full border border-[#dedede] px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#222] hover:bg-[#fafafa]">{category.title}</Link>)}
            </div>
          </div>
        </section>}
        <section className="border-y border-[#ededed] bg-[#fafafa]"><div className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Popular now</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Best sellers</h2></div><Link to="/collections/best-sellers" className="text-sm font-semibold text-[#666] hover:text-[#202020]">View all</Link></div>{productsLoading ? <div className="py-16 text-center text-sm text-[#777]">Loading products...</div> : bestSellers.length > 0 ? <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6">{bestSellers.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyProducts />}</div></section>

        <section className="mx-auto grid max-w-[1560px] gap-3 px-4 py-10 sm:grid-cols-3 sm:px-6 sm:py-14 lg:px-8 lg:py-16"><Value title="Simple catalog" text="Browse by age group, style and product collection without decorative clutter." /><Value title="Color & size inventory" text="Variant-level SKU and stock support keeps product options clear as the catalog grows." /><Value title="Customization when needed" text="Standard blanks stay simple; products request customer details only when required." /></section>

        <section className="border-y border-[#ededed] bg-white"><div className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Just added</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">New arrivals</h2></div><Link to="/collections/new-arrivals" className="text-sm font-semibold text-[#666] hover:text-[#202020]">View all</Link></div>{productsLoading ? <div className="py-16 text-center text-sm text-[#777]">Loading products...</div> : newArrivals.length > 0 ? <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6">{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyProducts />}</div></section>

        <section className="bg-[#f3eee8]">
          <div className="mx-auto grid max-w-[1560px] overflow-hidden lg:grid-cols-2">
            <div className="flex min-h-[380px] items-center justify-center bg-[#f8f6f2] p-8 sm:min-h-[480px] lg:min-h-[560px]">{babyPromoProduct ? <img src={babyPromoProduct.imageUrl} alt="" loading="lazy" decoding="async" className="h-full max-h-[470px] w-full object-contain" /> : <div className="h-64 w-64 rounded-full bg-white" />}</div>
            <div className="flex items-center px-5 py-12 sm:px-10 sm:py-16 lg:px-16"><div className="max-w-xl"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a6f60]">Baby blanks</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Start with the right base.</h2><p className="mt-4 text-sm leading-6 text-[#6f625a] sm:text-base">Shop baby-size essentials from a collection-first catalog. Color and size inventory stays attached to the exact variant when products are configured that way.</p><Link to="/collections/baby" className="commerce-focus mt-6 inline-flex min-h-12 items-center gap-2 rounded-[9px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838]">Shop baby <ArrowRight className="h-4 w-4" /></Link></div></div>
          </div>
        </section>

        <section id="wholesale" className="bg-[#e9eef0]"><div className="mx-auto grid max-w-[1560px] gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#66757c]">Wholesale & bulk</p><h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">A clean catalog foundation for larger orders.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-[#5f6a6e] sm:text-base">Bulk and wholesale rules can be added without complicating the everyday storefront. Contact the store before placing a large or special-order request.</p></div><div className="flex lg:justify-end"><a href="mailto:hello@mybabyshire.com?subject=Wholesale%20Inquiry" className="commerce-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838]">Wholesale inquiry <ArrowRight className="h-4 w-4" /></a></div></div></section>

        <section className="border-b border-[#e8e8e8] bg-white"><div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8 lg:py-20"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Newsletter</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">New products, without the noise.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-[#707070]">Sign up for new product and occasional store updates. Your email is stored as a newsletter subscription and can be removed on request.</p></div><form onSubmit={submitNewsletter} className="grid gap-2 sm:grid-cols-[1fr_auto]"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" required value={newsletterEmail} onChange={(event) => { setNewsletterEmail(event.target.value); if (newsletterStatus !== 'loading') setNewsletterStatus('idle'); }} placeholder="Email address" className="commerce-focus min-h-12 rounded-[9px] border border-[#d8d8d8] bg-white px-4 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" /><button disabled={newsletterStatus === 'loading'} className="commerce-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50">{newsletterStatus === 'loading' ? 'Joining…' : newsletterStatus === 'success' ? <><Check className="h-4 w-4" /> Joined</> : 'Join newsletter'}</button>{newsletterMessage && <p className={`sm:col-span-2 text-xs font-medium ${newsletterStatus === 'error' ? 'text-red-600' : 'text-[#316942]'}`}>{newsletterMessage}</p>}<p className="sm:col-span-2 text-[11px] leading-5 text-[#999]">By subscribing, you agree that MY BABY SHIRE may use this email for newsletter updates. See our <Link to="/policies/privacy" className="underline underline-offset-2">Privacy Policy</Link>.</p></form></div></section>
      </main>

    </div>
  );
}

const Value = ({ title, text }: { title: string; text: string }) => <div className="rounded-[12px] border border-[#e5e5e5] bg-white p-5 sm:p-6"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#777]">{text}</p></div>;
const EmptyProducts = () => <div className="rounded-[12px] border border-dashed border-[#d7d7d7] bg-[#fafafa] px-6 py-14 text-center text-sm text-[#777]">Products will appear here after they are added and tagged in Admin.</div>;
