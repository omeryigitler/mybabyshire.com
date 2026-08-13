import React, { useMemo } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../store/useStore';

const scrollToProducts = () => {
  (document.getElementById('featured-gifts') || document.getElementById('shop'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export function HomeFirstHelloHero({ products }: { products: Product[] }) {
  const heroProduct = useMemo(() => products.find((product) => {
    const text = `${product.name} ${product.description} ${product.ageRange || ''}`.toLowerCase();
    return text.includes('newborn') || text.includes('baby shower') || text.includes('announcement');
  }) || products.find((product) => product.bestseller) || products[0] || null, [products]);

  const detailPath = heroProduct ? `/products/${heroProduct.slug || heroProduct.id}` : '#';

  return (
    <section id="gifts" className="relative z-10 w-full max-w-[1500px] px-3 pt-3 sm:px-6 sm:pt-5 md:px-8 md:pt-6 lg:px-10">
      <div className="relative overflow-hidden rounded-[1.9rem] border border-boutique-brown/10 bg-white/55 shadow-[0_20px_65px_rgba(58,37,26,0.10)] md:rounded-[2.5rem]">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-14 top-8 w-48 rotate-[5deg] opacity-40 mix-blend-multiply md:w-60" alt="" />
        <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-16 top-6 w-52 -rotate-[6deg] opacity-40 mix-blend-multiply md:w-72" alt="" />

        <div className="relative z-10 grid items-center lg:grid-cols-[0.9fr_1.1fr]">
          <div className="px-5 pb-5 pt-7 text-center sm:px-8 sm:pt-9 lg:px-12 lg:py-12 lg:text-left xl:px-16 xl:py-14">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/12 bg-[#fffaf3]/90 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-boutique-brown-light shadow-sm sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-boutique-wood motion-safe:animate-pulse" /> For the first hello
            </span>
            <h1 className="font-serif text-[40px] leading-[1.02] tracking-[-0.025em] text-boutique-brown sm:text-[48px] md:text-[56px] lg:text-[60px] xl:text-[66px]">Baby Gifts Made<br />Just for Them</h1>
            <p className="mx-auto mt-4 max-w-[590px] text-[15px] leading-relaxed text-boutique-brown-light sm:text-[17px] lg:mx-0 lg:text-[18px]">Soft keepsakes, tiny celebration outfits and thoughtful details for the very first moments you never want to forget.</p>

            <div className="mx-auto mt-5 flex max-w-[600px] flex-col gap-2.5 sm:flex-row sm:justify-center lg:mx-0 lg:justify-start">
              <button type="button" onClick={scrollToProducts} className="group relative flex h-[62px] w-full items-center justify-center transition-transform hover:-translate-y-0.5 sm:w-[270px]">
                <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-md" alt="" />
                <span className="relative z-10 text-[16px] font-bold text-boutique-brown sm:text-[17px]">Shop Baby Gifts</span>
              </button>
              <button type="button" onClick={scrollToProducts} className="group relative flex h-[56px] w-full items-center justify-center opacity-85 transition-all hover:-translate-y-0.5 hover:opacity-100 sm:w-[236px]">
                <img src="/btn-paw-blank-cream.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-sm" alt="" />
                <span className="relative z-10 text-[15px] font-semibold text-boutique-brown-light">Explore New Arrivals</span>
              </button>
            </div>
            <p className="mt-3 text-[12px] font-medium text-boutique-brown-light/80 sm:text-[13px]">A little name. A very big hello. Make the first gift feel entirely theirs.</p>
          </div>

          <div className="relative min-h-[305px] overflow-hidden border-t border-boutique-brown/8 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.98),rgba(247,231,212,0.58)_62%,rgba(228,205,178,0.25)_100%)] sm:min-h-[390px] lg:min-h-[500px] lg:border-l lg:border-t-0">
            <img src="/toy-wooden-star-solid.png" className="absolute left-[9%] top-[14%] w-10 rotate-[-12deg] opacity-45 mix-blend-multiply sm:w-12" alt="" />
            <img src="/toy-teddy-ring-teether.png" className="absolute bottom-[7%] right-[7%] z-20 w-20 rotate-[7deg] opacity-90 drop-shadow-md sm:w-24 lg:w-28" alt="" />
            <div className="absolute left-[7%] top-[9%] z-20 rotate-[-4deg] rounded-[1rem] border border-boutique-brown/10 bg-[#fffaf3]/92 px-3 py-2 shadow-[0_10px_25px_rgba(58,37,26,0.10)]"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-boutique-wood">hello, little one</p><p className="mt-0.5 font-serif text-[15px] text-boutique-brown">Your first gift awaits</p></div>

            {heroProduct ? (
              <Link to={detailPath} className="absolute inset-0 z-10 block" aria-label={`View ${heroProduct.name}`}><img src={heroProduct.imageUrl} alt={heroProduct.name} loading="eager" fetchPriority="high" className="absolute left-1/2 top-1/2 h-[76%] w-[82%] -translate-x-1/2 -translate-y-[47%] object-contain drop-shadow-[0_22px_30px_rgba(58,37,26,0.20)] transition-transform duration-500 hover:scale-[1.02]" /></Link>
            ) : (
              <img src="/catalog/ivory-tulle-newborn-tutu.webp" alt="Newborn baby gift" loading="eager" fetchPriority="high" className="absolute left-1/2 top-1/2 z-10 h-[74%] w-[80%] -translate-x-1/2 -translate-y-[46%] object-contain drop-shadow-[0_22px_30px_rgba(58,37,26,0.20)]" />
            )}
          </div>
        </div>
      </div>

      <div className="relative z-20 mx-2 -mt-px grid grid-cols-3 overflow-hidden rounded-b-[1.45rem] border border-t-0 border-boutique-brown/10 bg-[#fffaf3]/92 shadow-[0_12px_32px_rgba(58,37,26,0.07)] sm:mx-5 md:mx-8">
        {['Made with Care', 'Gift-Ready Packaging', 'Ships Across the US'].map((title, index) => <div key={title} className={`flex min-h-[80px] items-center justify-center gap-2 px-2 py-3 text-center ${index > 0 ? 'border-l border-boutique-brown/10' : ''}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-boutique-wood/25 bg-white/75 text-boutique-wood"><Check className="h-3.5 w-3.5" /></span><span className="text-[10px] font-bold leading-tight text-boutique-brown sm:text-[13px]">{title}</span></div>)}
      </div>
    </section>
  );
}
