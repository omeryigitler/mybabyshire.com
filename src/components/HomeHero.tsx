import React, { useMemo } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../store/useStore';

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

const hasNamePersonalization = (product: Product) =>
  Boolean(
    product.personalizationFields?.some((field) => {
      const fieldKey = String(field.fieldKey || '').toLowerCase();
      const label = String(field.label || '').toLowerCase();
      return fieldKey.includes('name') || label.includes('name');
    }),
  );

const scrollToProducts = () => {
  const target = document.getElementById('featured-gifts') || document.getElementById('shop');
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export function HomeHero({ products }: { products: Product[] }) {
  const heroProduct = useMemo(() => {
    const namePersonalized = products.filter((product) => hasNamePersonalization(product));

    return namePersonalized.find((product) => product.bestseller)
      || namePersonalized.find((product) => product.featured)
      || namePersonalized.find((product) => product.newArrival)
      || namePersonalized[0]
      || products.find((product) => product.bestseller)
      || products[0]
      || null;
  }, [products]);

  const heroDetailPath = heroProduct ? `/products/${heroProduct.slug || heroProduct.id}` : '#';

  return (
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
              <span className="relative inline-block">
                Personalized Baby Gifts
                <span className="absolute -right-7 -top-2 hidden scale-75 sm:block"><SparkleIcon /></span>
              </span>
              <br className="hidden sm:block" /> Made with Love
            </h1>

            <p className="mx-auto mt-4 max-w-[620px] font-sans text-[16px] leading-relaxed text-boutique-brown-light sm:text-[18px] lg:mx-0 lg:max-w-[560px] lg:text-[19px]">
              Thoughtful baby gifts made personal with names, sizes and special details — so you can see exactly what you are choosing before it reaches the gift bag.
            </p>

            <div className="mx-auto mt-6 flex w-full max-w-[620px] flex-col items-center gap-2.5 sm:mt-7 sm:flex-row sm:justify-center sm:gap-3 lg:mx-0 lg:justify-start">
              <button type="button" onClick={scrollToProducts} className="group relative flex h-[66px] w-full min-w-0 cursor-pointer items-center justify-center transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:min-w-[286px] md:h-[68px] md:min-w-[300px]">
                <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-md transition-all group-active:drop-shadow-sm" alt="" />
                <span className="relative z-10 px-7 text-center text-[16px] font-bold leading-tight text-boutique-brown sm:text-[17px] md:text-lg">Shop Personalized Gifts</span>
              </button>

              <button type="button" onClick={scrollToProducts} className="group relative flex h-[58px] w-full min-w-0 cursor-pointer items-center justify-center opacity-85 transition-all hover:-translate-y-0.5 hover:opacity-100 active:translate-y-0 sm:w-auto sm:min-w-[246px] md:h-[62px]">
                <img src="/btn-paw-blank-cream.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-sm transition-all group-active:drop-shadow-none" alt="" />
                <span className="relative z-10 px-6 text-center text-[15px] font-semibold leading-tight text-boutique-brown-light sm:text-[16px]">Explore New Arrivals</span>
              </button>
            </div>

            <p className="mt-4 text-[12px] font-medium tracking-[0.02em] text-boutique-brown-light/80 sm:text-[13px]">
              Choose a gift, add the requested details, and make it unmistakably theirs.
            </p>
          </div>

          <div className="order-2 relative min-h-[330px] overflow-hidden border-t border-boutique-brown/8 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.96),rgba(247,231,212,0.58)_62%,rgba(228,205,178,0.25)_100%)] sm:min-h-[410px] lg:min-h-[560px] lg:border-l lg:border-t-0">
            <img src="/cloud-watercolor-blue-dense.png" className="pointer-events-none absolute -right-10 top-5 w-40 object-contain opacity-25 mix-blend-multiply sm:w-52 lg:w-64" alt="" />
            <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute left-[9%] top-[14%] w-10 rotate-[-12deg] object-contain opacity-45 mix-blend-multiply sm:w-12" alt="" />
            <img src="/toy-teddy-ring-teether.png" className="pointer-events-none absolute bottom-[7%] right-[7%] z-20 w-20 rotate-[7deg] object-contain opacity-90 drop-shadow-md sm:w-24 lg:w-28" alt="" />

            {heroProduct ? (
              <Link to={heroDetailPath} className="absolute inset-0 z-10 block" aria-label={`View ${heroProduct.name}`}>
                <img
                  src={heroProduct.imageUrl}
                  alt={heroProduct.name}
                  loading="eager"
                  fetchPriority="high"
                  className="absolute left-1/2 top-1/2 h-[78%] w-[84%] max-w-[720px] -translate-x-1/2 -translate-y-[51%] object-contain drop-shadow-[0_22px_30px_rgba(58,37,26,0.20)] transition-transform duration-500 hover:scale-[1.02] sm:h-[82%] sm:w-[80%] lg:h-[84%] lg:w-[86%]"
                />
              </Link>
            ) : (
              <img
                src="/product-blanket-cutout-v1.png"
                alt="Personalized baby gift"
                loading="eager"
                fetchPriority="high"
                className="absolute left-1/2 top-1/2 z-10 w-[92%] max-w-[720px] -translate-x-1/2 -translate-y-[48%] object-contain drop-shadow-[0_22px_30px_rgba(58,37,26,0.20)] sm:w-[88%] lg:w-[94%]"
              />
            )}

            <div className="absolute bottom-4 left-4 z-20 max-w-[235px] rounded-[1.2rem] border border-boutique-brown/12 bg-[#fffaf3]/90 px-3.5 py-2.5 text-left shadow-[0_12px_32px_rgba(58,37,26,0.12)] backdrop-blur-md sm:bottom-6 sm:left-6 sm:max-w-[310px] sm:px-4 sm:py-3">
              {heroProduct ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-boutique-wood">
                    {heroProduct.bestseller ? 'Bestseller' : heroProduct.newArrival ? 'New arrival' : 'Personalizable'}
                  </p>
                  <p className="mt-1 font-serif text-[16px] leading-tight text-boutique-brown sm:text-[18px]">{heroProduct.name}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[12px] font-bold text-boutique-brown">${heroProduct.price.toFixed(2)}</span>
                    <Link to={heroDetailPath} className="inline-flex items-center gap-1 text-[11px] font-bold text-boutique-brown-light hover:text-boutique-wood">
                      View gift <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-serif text-[16px] leading-tight text-boutique-brown sm:text-[18px]">A gift made personal</p>
                  <p className="mt-1 text-[11px] leading-snug text-boutique-brown-light sm:text-[12px]">Personalized details make every piece feel one of a kind.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 mx-2 -mt-px grid grid-cols-3 overflow-hidden rounded-b-[1.45rem] border border-t-0 border-boutique-brown/10 bg-[#fffaf3]/92 shadow-[0_12px_32px_rgba(58,37,26,0.07)] backdrop-blur-md sm:mx-5 md:mx-8">
        {[
          ['Personalized with Care', 'Name, size and detail options'],
          ['Gift-Ready Packaging', 'Included with every order'],
          ['Ships Across the US', 'Made for gifting nationwide'],
        ].map(([title, detail], index) => (
          <div key={title} className={`flex min-h-[88px] flex-col items-center justify-center gap-2 px-2 py-3 text-center sm:min-h-[76px] sm:flex-row sm:gap-3 sm:px-5 sm:text-left ${index > 0 ? 'border-l border-boutique-brown/10' : ''}`}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-boutique-wood/25 bg-white/75 text-boutique-wood shadow-sm sm:h-8 sm:w-8">
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold leading-tight text-boutique-brown sm:text-[13px]">{title}</span>
              <span className="mt-0.5 hidden text-[11px] leading-tight text-boutique-brown-light/75 sm:block">{detail}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SparkleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0L13.8 8.2L22 10L13.8 11.8L12 20L10.2 11.8L2 10L10.2 8.2L12 0Z" fill="#d9b691"/><path d="M5 16L5.6 18.4L8 19L5.6 19.6L5 22L4.4 19.6L2 19L4.4 18.4L5 16Z" fill="#d9b691"/></svg>
  );
}
