import React, { useMemo } from 'react';
import { ArrowRight, Check, Gift, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../store/useStore';

const score = (product: Product) => {
  const text = `${product.name} ${product.description} ${product.ageRange || ''}`.toLowerCase();
  return (/newborn|baby shower|announcement|first|keepsake/.test(text) ? 80 : 0)
    + (product.bestseller ? 60 : 0) + (product.featured ? 40 : 0) + (product.newArrival ? 20 : 0);
};

export function HomeCommerceHero({ products }: { products: Product[] }) {
  const picks = useMemo(() => [...products].filter((p) => p.imageUrl).sort((a, b) => score(b) - score(a)).slice(0, 3), [products]);
  const main = picks[0];
  const more = picks.slice(1);
  const shop = () => (document.getElementById('featured-gifts') || document.getElementById('shop'))?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="gifts" className="relative z-10 w-full max-w-[1540px] px-3 pt-3 sm:px-6 md:px-8 lg:px-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-[#fffaf3]/88 shadow-[0_24px_70px_rgba(58,37,26,.11)] md:rounded-[2.6rem]">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-20 top-10 w-64 opacity-25 mix-blend-multiply" alt="" />
        <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-24 -top-10 w-80 opacity-25 mix-blend-multiply" alt="" />
        <div className="relative z-10 grid lg:grid-cols-[.82fr_1.18fr]">
          <div className="flex flex-col justify-center px-5 py-8 text-center sm:px-9 lg:px-12 lg:py-14 lg:text-left xl:px-16">
            <span className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-boutique-brown/12 bg-white/80 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-boutique-brown-light shadow-sm lg:mx-0">
              <Sparkles className="h-3.5 w-3.5 text-boutique-wood" /> For the first hello
            </span>
            <h1 className="mt-4 font-serif text-[42px] leading-[.98] tracking-[-.035em] text-boutique-brown sm:text-[54px] lg:text-[66px] xl:text-[72px]">Baby Gifts<br />Made Just for Them</h1>
            <p className="mx-auto mt-5 max-w-[580px] text-[15px] leading-relaxed text-boutique-brown-light sm:text-[17px] lg:mx-0 lg:text-[18px]">Thoughtful pieces for newborn arrivals, baby showers and first celebrations — with names, sizes and special details chosen just for them.</p>
            <div className="mx-auto mt-6 flex w-full max-w-[545px] flex-col gap-2 sm:flex-row lg:mx-0">
              <button onClick={shop} className="group relative flex h-[62px] flex-1 items-center justify-center transition-transform hover:-translate-y-0.5">
                <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-md" alt="" />
                <span className="relative z-10 flex items-center gap-2 font-bold text-boutique-brown">Shop Baby Gifts <ArrowRight className="h-4 w-4" /></span>
              </button>
              <button onClick={shop} className="relative flex h-[58px] flex-1 items-center justify-center transition-transform hover:-translate-y-0.5">
                <img src="/btn-paw-blank-cream.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-sm" alt="" />
                <span className="relative z-10 text-sm font-semibold text-boutique-brown-light">See New Arrivals</span>
              </button>
            </div>
            <div className="mx-auto mt-6 grid w-full max-w-[580px] grid-cols-3 overflow-hidden rounded-[1.15rem] border border-boutique-brown/10 bg-white/60 lg:mx-0">
              {['Made with care', 'Gift-ready', 'Ships across the US'].map((item, i) => <div key={item} className={`flex min-h-[58px] items-center justify-center gap-1.5 px-2 text-center ${i ? 'border-l border-boutique-brown/10' : ''}`}><Check className="hidden h-3.5 w-3.5 text-boutique-wood sm:block" /><span className="text-[9px] font-bold text-boutique-brown sm:text-[11px]">{item}</span></div>)}
            </div>
          </div>

          <div className="relative min-h-[430px] overflow-hidden border-t border-boutique-brown/8 bg-[radial-gradient(circle_at_45%_38%,#fff,rgba(247,230,211,.72)_60%,rgba(226,201,172,.35))] sm:min-h-[520px] lg:min-h-[590px] lg:border-l lg:border-t-0">
            <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute left-[5%] top-[8%] w-12 opacity-40" alt="" />
            <img src="/toy-teddy-ring-teether.png" className="pointer-events-none absolute bottom-[4%] right-[3%] z-30 w-20 opacity-80 sm:w-24" alt="" />
            {main ? <>
              <div className="absolute left-[6%] top-[6%] z-20 rounded-[1.1rem] border border-boutique-brown/10 bg-[#fffaf3]/90 px-4 py-3 shadow-sm backdrop-blur-md">
                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-boutique-wood">Featured gift</p>
                <div className="mt-1 flex items-center gap-4"><p className="max-w-[210px] truncate text-xs font-bold text-boutique-brown">{main.name}</p><span className="font-serif text-lg text-boutique-brown">${main.price.toFixed(2)}</span></div>
              </div>
              <Link to={`/products/${main.slug || main.id}`} className="group absolute bottom-[9%] left-[6%] right-[6%] top-[20%] flex items-center justify-center rounded-[2rem] border border-white/70 bg-white/48 shadow-[0_20px_50px_rgba(58,37,26,.11)] sm:right-[25%]">
                <img src={main.imageUrl} alt={main.name} fetchPriority="high" className="h-[86%] w-[88%] object-contain drop-shadow-[0_22px_30px_rgba(58,37,26,.18)] transition-transform duration-500 group-hover:scale-[1.025]" />
                <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full bg-[#fffaf3]/95 px-3 py-2 text-[11px] font-bold text-boutique-brown shadow-sm">View gift <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
              <div className="absolute bottom-[7%] right-[5%] top-[22%] hidden w-[185px] content-center gap-3 sm:grid">
                {more.map((p) => <Link key={p.id} to={`/products/${p.slug || p.id}`} className="group flex min-h-[130px] flex-col items-center justify-center rounded-[1.2rem] border border-boutique-brown/10 bg-[#fffaf3]/90 p-2 text-center shadow-md transition-transform hover:-translate-y-0.5"><img src={p.imageUrl} alt={p.name} loading="lazy" className="h-20 w-20 object-contain transition-transform group-hover:scale-105" /><p className="mt-1 line-clamp-2 text-[10px] font-bold text-boutique-brown">{p.name}</p><p className="text-[11px] font-semibold text-boutique-wood">${p.price.toFixed(2)}</p></Link>)}
              </div>
            </> : <div className="absolute inset-[9%] flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-boutique-brown/15 bg-white/40 text-center"><Gift className="h-7 w-7 text-boutique-wood" /><p className="mt-3 font-serif text-2xl text-boutique-brown">Loading the gift collection</p><p className="mt-2 max-w-sm px-5 text-sm text-boutique-brown-light">Only storefront catalog images are shown here.</p></div>}
          </div>
        </div>
      </div>
    </section>
  );
}
