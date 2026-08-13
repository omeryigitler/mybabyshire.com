import React, { useMemo } from 'react';
import { ArrowRight, Check, Gift, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../store/useStore';

const scrollToProducts = () => {
  (document.getElementById('featured-gifts') || document.getElementById('shop'))?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
};

const productScore = (product: Product) => {
  const text = `${product.name} ${product.description} ${product.ageRange || ''}`.toLowerCase();
  const firstMoment = /newborn|baby shower|announcement|first|keepsake/.test(text) ? 80 : 0;
  return firstMoment + (product.bestseller ? 60 : 0) + (product.featured ? 40 : 0) + (product.newArrival ? 20 : 0);
};

export function HomeCommerceHero({ products }: { products: Product[] }) {
  const heroProducts = useMemo(
    () => [...products].filter((product) => Boolean(product.imageUrl)).sort((a, b) => productScore(b) - productScore(a)).slice(0, 3),
    [products],
  );

  const mainProduct = heroProducts[0] || null;
  const sideProducts = heroProducts.slice(1, 3);

  return (
    <section id="gifts" className="relative z-10 w-full max-w-[1540px] px-3 pt-3 sm:px-6 sm:pt-5 md:px-8 md:pt-6 lg:px-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-[#fffaf3]/86 shadow-[0_24px_70px_rgba(58,37,26,0.11)] md:rounded-[2.65rem]">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-20 top-10 w-64 rotate-[7deg] opacity-24 mix-blend-multiply" alt="" />
        <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-24 -top-10 w-80 -rotate-[8deg] opacity-24 mix-blend-multiply" alt="" />

        <div className="relative z-10 grid lg:grid-cols-[0.82fr_1.18fr]">
          <div className="flex flex-col justify-center px-5 pb-7 pt-8 text-center sm:px-9 sm:py-10 lg:px-12 lg:py-14 lg:text-left xl:px-16 xl:py-16">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-boutique-brown/12 bg-white/78 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-boutique-brown-light shadow-sm lg:mx-0 sm:text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-boutique-wood" strokeWidth={1.8} />
              For the first hello
            </div>

            <h1 className="mt-4 font-serif text-[42px] leading-[0.98] tracking-[-0.035em] text-boutique-brown sm:text-[52px] md:text-[60px] lg:text-[64px] xl:text-[72px]">
              Baby Gifts<br />Made Just for Them
            </h1>

            <p className="mx-auto mt-5 max-w-[590px] text-[15px] leading-relaxed text-boutique-brown-light sm:text-[17px] lg:mx-0 lg:text-[18px]">
              Thoughtful pieces for newborn arrivals, baby showers and first celebrations — with names, sizes and special details chosen just for them.
            </p>

            <div className="mx-auto mt-6 flex w-full max-w-[560px] flex-col gap-2.5 sm:flex-row sm:justify-center lg:mx-0 lg:justify-start">
              <button type="button" onClick={scrollToProducts} className="group relative flex h-[64px] w-full items-center justify-center transition-transform hover:-translate-y-0.5 sm:w-[270px]">
                <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-md" alt="" />
                <span className="relative z-10 flex items-center gap-2 text-[16px] font-bold text-boutique-brown sm:text-[17px]">
                  Shop Baby Gifts <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
              <button type="button" onClick={scrollToProducts} className="group relative flex h-[58px] w-full items-center justify-center opacity-90 transition-all hover:-translate-y-0.5 hover:opacity-100 sm:w-[232px]">
                <img src="/btn-paw-blank-cream.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-sm" alt="" />
                <span className="relative z-10 text-[14px] font-semibold text-boutique-brown-light sm:text-[15px]">See New Arrivals</span>
              </button>
            </div>

            <div className="mx-auto mt-6 grid w-full max-w-[590px] grid-cols-3 overflow-hidden rounded-[1.2rem] border border-boutique-brown/10 bg-white/58 lg:mx-0">
              {['Made with care', 'Gift-ready', 'Ships across the US'].map((item, index) => (
                <div key={item} className={`flex min-h-[62px] items-center justify-center gap-1.5 px-2 text-center ${index ? 'border-l border-boutique-brown/10' : ''}`}>
                  <Check className="hidden h-3.5 w-3.5 shrink-0 text-boutique-wood sm:block" strokeWidth={2.1} />
                  <span className="text-[9px] font-bold leading-tight text-boutique-brown sm:text-[11px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[440px] overflow-hidden border-t border-boutique-brown/8 bg-[radial-gradient(circle_at_44%_36%,rgba(255,255,255,1),rgba(247,230,211,0.72)_58%,rgba(226,201,172,0.36)_100%)] sm:min-h-[520px] lg:min-h-[600px] lg:border-l lg:border-t-0">
            <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute left-[5%] top-[8%] w-11 rotate-[-14deg] opacity-38 mix-blend-multiply sm:w-14" alt="" />
            <img src="/toy-teddy-ring-teether.png" className="pointer-events-none absolute bottom-[5%] right-[4%] z-30 w-20 rotate-[7deg] opacity-80 drop-shadow-md sm:w-24" alt="" />

            {mainProduct ? (
              <>
                <div className="absolute left-[5%] right-[5%] top-[5%] z-20 flex items-center justify-between gap-3 rounded-[1.15rem] border border-boutique-brown/10 bg-[#fffaf3]/88 px-4 py-3 shadow-[0_10px_28px_rgba(58,37,26,0.08)] backdrop-blur-md sm:left-[7%] sm:right-auto sm:w-[280px]">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-boutique-wood">Featured gift</p>
                    <p className="mt-0.5 line-clamp-1 text-[12px] font-bold text-boutique-brown">{mainProduct.name}</p>
                  </div>
                  <span className="shrink-0 font-serif text-[20px] text-boutique-brown">${mainProduct.price.toFixed(2)}</span>
                </div>

                <Link to={`/products/${mainProduct.slug || mainProduct.id}`} className="group absolute left-[5%] right-[5%] top-[18%] z-10 flex h-[58%] items-center justify-center rounded-[2.1rem] border border-white/70 bg-white/48 shadow-[0_20px_50px_rgba(58,37,26,0.11)] backdrop-blur-sm sm:left-[8%] sm:right-[24%] sm:top-[17%] sm:h-[66%]" aria-label={`View ${mainProduct.name}`}>
                  <img src={mainProduct.imageUrl} alt={mainProduct.name} loading="eager" fetchPriority="high" className="h-[88%] w-[88%] object-contain drop-shadow-[0_24px_32px_rgba(58,37,26,0.19)] transition-transform duration-500 group-hover:scale-[1.025]" />
                  <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-boutique-brown/10 bg-[#fffaf3]/92 px-3 py-2 text-[11px] font-bold text-boutique-brown shadow-sm">
                    View gift <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>

                <div className="absolute bottom-[6%] left-[5%] right-[5%] z-20 grid grid-cols-2 gap-2 sm:bottom-[8%] sm:left-auto sm:right-[5%] sm:top-[18%] sm:w-[190px] sm:grid-cols-1 sm:content-center sm:gap-3">
                  {sideProducts.map((product) => (
                    <Link key={product.id} to={`/products/${product.slug || product.id}`} className="group flex min-h-[94px] items-center gap-2 overflow-hidden rounded-[1.25rem] border border-boutique-brown/10 bg-[#fffaf3]/88 p-2.5 shadow-[0_12px_30px_rgba(58,37,26,0.09)] backdrop-blur-md transition-transform hover:-translate-y-0.5 sm:min-h-[136px] sm:flex-col sm:justify-center sm:text-center">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1rem] bg-white/75 sm:h-20 sm:w-20">
                        <img src={product.imageUrl} alt={product.name} loading="lazy" className="h-[88%] w-[88%] object-contain transition-transform duration-300 group-hover:scale-105" />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[10px] font-bold leading-tight text-boutique-brown sm:text-[11px]">{product.name}</p>
                        <p className="mt-1 text-[11px] font-semibold text-boutique-wood">${product.price.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="absolute inset-[8%] flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-boutique-brown/15 bg-white/38 px-6 text-center backdrop-blur-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-boutique-brown/10 bg-[#fffaf3]/90 text-boutique-wood shadow-sm">
                  <Gift className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <p className="mt-4 font-serif text-2xl text-boutique-brown">Your real catalog goes here</p>
                <p className="mt-2 max-w-[360px] text-sm leading-relaxed text-boutique-brown-light">This preview will not substitute generated product artwork. Real product imagery appears only when the storefront catalog is available.</p>
                <div className="mt-6 grid w-full max-w-[420px] grid-cols-3 gap-3" aria-hidden="true">
                  {[0, 1, 2].map((item) => <div key={item} className="aspect-[4/5] rounded-[1.1rem] border border-boutique-brown/8 bg-[#fffaf3]/72 shadow-sm" />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
