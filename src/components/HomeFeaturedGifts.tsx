import React, { useMemo } from 'react';
import { ArrowRight, Clock3, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../store/useStore';
import { ProductCard } from './ProductCard';

const hasNamePersonalization = (product: Product) =>
  Boolean(
    product.personalizationFields?.some((field) => {
      const fieldKey = String(field.fieldKey || '').toLowerCase();
      const label = String(field.label || '').toLowerCase();
      return fieldKey.includes('name') || label.includes('name');
    }),
  );

const getProductPriority = (product: Product) =>
  (product.bestseller ? 100 : 0)
  + (product.featured ? 60 : 0)
  + (hasNamePersonalization(product) ? 40 : 0)
  + (product.newArrival ? 20 : 0)
  + Math.min(product.ratingCount ?? 0, 10);

const reassuranceItems = [
  {
    title: 'Made-to-order timing',
    detail: 'Personalized items are typically prepared in 2–5 business days; product-specific timing takes priority.',
    icon: Clock3,
    to: '/policies/shipping',
  },
  {
    title: 'USPS shipping in the US',
    detail: 'Ground Advantage and Priority Mail options are documented in our shipping policy.',
    icon: Truck,
    to: '/policies/shipping',
  },
  {
    title: 'Stripe & PayPal checkout',
    detail: 'Payments are processed by Stripe or PayPal; the store does not keep your full card number.',
    icon: ShieldCheck,
    to: '/policies/privacy',
  },
  {
    title: 'Clear custom-item policy',
    detail: 'Personalized items cannot be returned once production starts; damaged or incorrect orders are covered by policy.',
    icon: RotateCcw,
    to: '/policies/returns',
  },
] as const;

export function HomeFeaturedGifts({ products, onShopAll }: { products: Product[]; onShopAll: () => void }) {
  const featuredProducts = useMemo(
    () => [...products]
      .sort((a, b) => getProductPriority(b) - getProductPriority(a))
      .slice(0, 6),
    [products],
  );

  if (!featuredProducts.length) return null;

  return (
    <section id="featured-gifts" className="scroll-mt-24 relative z-20 mx-auto mt-10 w-full max-w-[1560px] px-4 sm:px-6 md:mt-14 md:px-8">
      <div className="mb-6 flex flex-col gap-3 text-center md:mb-8 md:flex-row md:items-end md:justify-between md:text-left">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-boutique-wood sm:text-[11px]">Start with the gifts that show personalization best</span>
          <h2 className="mt-2 font-serif text-3xl text-boutique-brown md:text-[42px]">Featured Personalized Gifts</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-boutique-brown-light md:mx-0 md:text-base">
            Real products from the current collection, with the same prices, options and product pages you will see when you shop.
          </p>
        </div>
        <button type="button" onClick={onShopAll} className="mx-auto inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light transition-colors hover:text-boutique-wood md:mx-0">
          Shop all gifts <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 xl:grid-cols-3">
        {featuredProducts.map((product) => (
          <div key={product.id} className="flex w-[88vw] max-w-[540px] flex-none snap-center md:w-auto md:max-w-none">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-[11px] font-medium text-boutique-brown-light/70 md:hidden">Swipe to explore more gifts.</p>

      <div className="mt-8 rounded-[1.8rem] border border-boutique-brown/10 bg-[#fffaf3]/72 px-4 py-5 shadow-[0_12px_36px_rgba(58,37,26,0.06)] sm:px-5 md:mt-10 md:px-6 md:py-6">
        <div className="mb-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-boutique-wood sm:text-[11px]">Good to know before you order</p>
          <p className="mt-1 text-xs text-boutique-brown-light sm:text-sm">Short answers pulled from the store’s current policies — no invented guarantees.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {reassuranceItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} to={item.to} className="group rounded-[1.25rem] border border-boutique-brown/10 bg-white/72 p-4 text-left transition-transform hover:-translate-y-0.5 hover:bg-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-boutique-wood/20 bg-[#fffaf3] text-boutique-wood">
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <p className="mt-3 text-sm font-bold text-boutique-brown">{item.title}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-boutique-brown-light sm:text-xs">{item.detail}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-boutique-brown-light transition-colors group-hover:text-boutique-wood">Read policy <ArrowRight className="h-3 w-3" /></span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
