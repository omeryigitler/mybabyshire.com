import React, { useMemo } from 'react';
import { ArrowRight, Clock3, Gift, Plus, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../store/useStore';

export type HomeDiscoveryFilter = 'newborn' | 'first-birthday' | 'name-number' | 'tutu' | 'new-arrivals';

const score = (product: Product) => {
  const text = `${product.name} ${product.description} ${product.ageRange || ''}`.toLowerCase();
  return (/newborn|baby shower|announcement|first|keepsake/.test(text) ? 80 : 0)
    + (product.bestseller ? 60 : 0)
    + (product.featured ? 40 : 0)
    + (product.newArrival ? 20 : 0);
};

const needsDetails = (product: Product) => Boolean(product.personalizationRequired || product.personalizationFields?.length);

const discoveryPills: Array<{ label: string; value: HomeDiscoveryFilter }> = [
  { label: 'Newborn', value: 'newborn' },
  { label: 'First Birthday', value: 'first-birthday' },
  { label: 'Name & Number', value: 'name-number' },
  { label: 'Tutu Sets', value: 'tutu' },
  { label: 'New Arrivals', value: 'new-arrivals' },
];

const trustItems = [
  { label: 'Gift-ready packaging', icon: Gift },
  { label: 'USPS shipping across the US', icon: Truck },
  { label: 'Stripe & PayPal checkout', icon: ShieldCheck },
  { label: 'Made to order', icon: Clock3 },
];

export function HomeCommerceHero({
  products,
  onShop,
  onFilter,
  onChooseProduct,
  onAddProduct,
}: {
  products: Product[];
  onShop: () => void;
  onFilter: (filter: HomeDiscoveryFilter) => void;
  onChooseProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
}) {
  const picks = useMemo(
    () => [...products].filter((product) => product.imageUrl).sort((a, b) => score(b) - score(a)).slice(0, 3),
    [products],
  );
  const main = picks[0];
  const more = picks.slice(1);

  const runQuickAction = (product: Product) => {
    if (needsDetails(product)) onChooseProduct(product);
    else onAddProduct(product);
  };

  return (
    <section id="gifts" className="relative z-10 w-full max-w-[1540px] px-3 pt-3 sm:px-6 md:px-8 lg:px-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-[#fffaf3]/90 shadow-[0_24px_70px_rgba(58,37,26,.11)] md:rounded-[2.6rem]">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-20 top-8 w-56 opacity-25 mix-blend-multiply lg:opacity-10" alt="" />
        <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-20 -top-10 w-72 opacity-25 mix-blend-multiply" alt="" />

        <div className="relative z-10 grid lg:grid-cols-[.8fr_1.2fr]">
          <div className="relative flex flex-col justify-center overflow-hidden px-5 py-7 text-center sm:px-8 sm:py-8 lg:px-10 lg:py-8 lg:text-left xl:px-12">
            <video
              aria-hidden="true"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-[0.50] motion-reduce:hidden sm:opacity-[0.58] lg:opacity-[0.88]"
            >
              <source src="/media/hero-carousel.mp4" type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,243,.62)_0%,rgba(255,250,243,.48)_48%,rgba(255,250,243,.70)_100%)] lg:bg-[linear-gradient(90deg,rgba(255,250,243,.68)_0%,rgba(255,250,243,.56)_48%,rgba(255,250,243,.44)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fffaf3]/70 to-transparent lg:h-28 lg:from-[#fffaf3]/50" />

            <div className="relative z-10">
              <span className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-boutique-brown/12 bg-white/80 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-boutique-brown-light shadow-sm backdrop-blur-sm lg:mx-0">
                <Sparkles className="h-3.5 w-3.5 text-boutique-wood" /> For the first hello
              </span>
              <h1 className="mt-4 font-serif text-[40px] leading-[.98] tracking-[-.035em] text-boutique-brown sm:text-[48px] lg:text-[54px] xl:text-[58px]">
                <span className="whitespace-nowrap">Baby Gifts Made</span><br />Just for Them
              </h1>
              <p className="mx-auto mt-4 max-w-[540px] text-[14px] leading-relaxed text-boutique-brown-light sm:text-[16px] lg:mx-0 lg:text-[17px]">Thoughtful pieces for newborn arrivals, baby showers and first celebrations — with names, sizes and special details chosen just for them.</p>
              <div className="mx-auto mt-5 flex w-full max-w-[510px] flex-col gap-2 sm:flex-row lg:mx-0">
                <button type="button" onClick={onShop} className="group relative flex h-[56px] flex-1 items-center justify-center transition-transform hover:-translate-y-0.5">
                  <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-contain drop-shadow-md" alt="" />
                  <span className="relative z-10 flex items-center gap-2 font-bold text-boutique-brown">Shop Baby Gifts <ArrowRight className="h-4 w-4" /></span>
                </button>
                <button type="button" onClick={() => onFilter('new-arrivals')} className="relative flex h-[54px] flex-1 items-center justify-center transition-transform hover:-translate-y-0.5">
                  <img src="/btn-paw-blank-cream.png" className="absolute inset-0 h-full w-full object-contain drop-shadow-sm" alt="" />
                  <span className="relative z-10 text-sm font-semibold text-boutique-brown-light">See New Arrivals</span>
                </button>
              </div>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden border-t border-boutique-brown/8 bg-[radial-gradient(circle_at_45%_38%,#fff,rgba(247,230,211,.72)_60%,rgba(226,201,172,.35))] sm:min-h-[400px] lg:min-h-[430px] lg:border-l lg:border-t-0">
            <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute left-[4%] top-[7%] w-10 opacity-35" alt="" />
            <img src="/toy-teddy-ring-teether.png" className="pointer-events-none absolute bottom-[3%] right-[2%] z-30 w-16 opacity-75 sm:w-20" alt="" />
            {main ? <>
              <div className="absolute left-[5%] top-[5%] z-20 rounded-[1rem] border border-boutique-brown/10 bg-[#fffaf3]/94 px-3.5 py-2.5 shadow-sm backdrop-blur-md">
                <p className="text-[8px] font-bold uppercase tracking-[.18em] text-boutique-wood">Featured gift</p>
                <div className="mt-1 flex items-center gap-3"><p className="max-w-[220px] truncate text-[11px] font-bold text-boutique-brown">{main.name}</p><span className="font-serif text-[17px] text-boutique-brown">${main.price.toFixed(2)}</span></div>
              </div>

              <div className="absolute bottom-[7%] left-[5%] right-[5%] top-[18%] rounded-[1.8rem] border border-white/70 bg-white/48 shadow-[0_20px_50px_rgba(58,37,26,.11)] sm:right-[24%]">
                <Link to={`/products/${main.slug || main.id}`} className="group absolute inset-0 flex items-center justify-center rounded-[1.8rem]" aria-label={`View ${main.name}`}>
                  <img src={main.imageUrl} alt={main.name} fetchPriority="high" className="h-[90%] w-[92%] object-contain drop-shadow-[0_18px_26px_rgba(58,37,26,.16)] transition-transform duration-500 group-hover:scale-[1.025]" />
                </Link>
                <button
                  type="button"
                  onClick={() => runQuickAction(main)}
                  className="absolute bottom-3.5 left-3.5 z-20 inline-flex items-center gap-1.5 rounded-full bg-boutique-brown px-4 py-2.5 text-[11px] font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
                >
                  {needsDetails(main) ? 'Choose Details' : 'Add to Bag'} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="absolute bottom-[6%] right-[4%] top-[20%] hidden w-[205px] content-center gap-2.5 sm:grid">
                {more.map((product) => (
                  <div key={product.id} className="group relative grid min-h-[112px] grid-cols-[68px_1fr] items-center gap-2 rounded-[1.15rem] border border-boutique-brown/10 bg-[#fffaf3]/94 p-2.5 text-left shadow-md transition-transform hover:-translate-y-0.5">
                    <Link to={`/products/${product.slug || product.id}`} className="contents" aria-label={`View ${product.name}`}>
                      <img src={product.imageUrl} alt={product.name} loading="lazy" className="h-[68px] w-[68px] object-contain transition-transform group-hover:scale-105" />
                      <div className="min-w-0 pr-7">
                        <p className="line-clamp-2 text-[10px] font-bold leading-tight text-boutique-brown">{product.name}</p>
                        <p className="mt-1 text-[11px] font-semibold text-boutique-wood">${product.price.toFixed(2)}</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => runQuickAction(product)}
                      aria-label={needsDetails(product) ? `Choose details for ${product.name}` : `Add ${product.name} to bag`}
                      className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-boutique-brown/10 bg-white text-boutique-brown shadow-sm transition-colors hover:bg-[#fff4df]"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
                ))}
              </div>
            </> : <div className="absolute inset-[9%] flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-boutique-brown/15 bg-white/40 text-center"><Gift className="h-7 w-7 text-boutique-wood" /><p className="mt-3 font-serif text-2xl text-boutique-brown">Loading the gift collection</p><p className="mt-2 max-w-sm px-5 text-sm text-boutique-brown-light">Only storefront catalog images are shown here.</p></div>}
          </div>
        </div>

        <div className="relative z-20 border-t border-boutique-brown/10 bg-white/42 px-3 py-2 sm:px-5">
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 sm:justify-center sm:overflow-visible">
            {discoveryPills.map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => onFilter(pill.value)}
                className="flex-none snap-start rounded-full border border-boutique-brown/12 bg-[#fffaf3]/92 px-4 py-2 text-xs font-bold text-boutique-brown-light shadow-sm transition-colors hover:border-boutique-wood/30 hover:bg-white hover:text-boutique-brown"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-20 grid grid-cols-2 border-t border-boutique-brown/10 bg-white/58 sm:grid-cols-4">
          {trustItems.map(({ label, icon: Icon }, index) => (
            <div key={label} className={`flex min-h-[48px] items-center justify-center gap-2 px-3 text-center ${index % 2 ? 'border-l border-boutique-brown/10' : ''} ${index >= 2 ? 'border-t border-boutique-brown/10 sm:border-t-0' : ''} ${index > 0 ? 'sm:border-l sm:border-boutique-brown/10' : ''}`}>
              <Icon className="h-4 w-4 shrink-0 text-boutique-wood" strokeWidth={1.8} />
              <span className="text-[10px] font-bold leading-tight text-boutique-brown sm:text-[11px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
