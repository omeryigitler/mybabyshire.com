import React, { useMemo } from 'react';
import { Product } from '../store/useStore';
import { ProductCard } from './ProductCard';

const productScore = (product: Product) =>
  (product.bestseller ? 100 : 0)
  + (product.featured ? 60 : 0)
  + (product.newArrival ? 30 : 0)
  + Math.min(product.ratingCount ?? 0, 10);

export function HomeRealFeaturedGifts({ products, onShopAll: _onShopAll }: { products: Product[]; onShopAll: () => void }) {
  const featuredProducts = useMemo(
    () => [...products].filter((product) => Boolean(product.imageUrl)).sort((a, b) => productScore(b) - productScore(a)).slice(0, 6),
    [products],
  );

  return (
    <section id="featured-gifts" className="scroll-mt-24 relative z-20 mx-auto mt-2 w-full max-w-[1560px] px-4 sm:px-6 md:mt-3 md:px-8">
      {featuredProducts.length > 0 ? <>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:gap-4 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 xl:grid-cols-3">
          {featuredProducts.map((product) => <div key={product.id} className="flex w-[92vw] max-w-[548px] flex-none snap-center md:w-auto md:max-w-none"><ProductCard product={product} /></div>)}
        </div>
        <p className="mt-1 text-center text-[11px] font-medium text-boutique-brown-light/70 md:hidden">Swipe to explore more gifts.</p>
      </> : <div className="grid gap-4 md:grid-cols-3" aria-label="Product catalog loading preview">
        {[0, 1, 2].map((item) => <div key={item} className="min-h-[290px] animate-pulse rounded-[2rem] border border-boutique-brown/8 bg-white/46 p-5 shadow-[0_14px_36px_rgba(58,37,26,0.05)]"><div className="mx-auto h-40 w-40 rounded-[1.5rem] bg-[#f4eadf]" /><div className="mx-auto mt-5 h-4 w-3/4 rounded-full bg-[#ead9c8]" /><div className="mx-auto mt-3 h-3 w-1/2 rounded-full bg-[#efe2d5]" /></div>)}
      </div>}
    </section>
  );
}
