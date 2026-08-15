import React, { useMemo, useRef, useState } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoVisible, setVideoVisible] = useState(true);

  const runQuickAction = (product: Product) => {
    if (needsDetails(product)) onChooseProduct(product);
    else onAddProduct(product);
  };

  const handleHeroVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;

    if (video.duration - video.currentTime <= 0.65) {
      setVideoVisible(false);
    }
  };

  const restartHeroVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    requestAnimationFrame(() => {
      void video.play().catch(() => undefined);
      setVideoVisible(true);
    });
  };

  return (
    <section id="gifts" className="relative z-10 w-full max-w-[1540px] px-3 pt-2 sm:px-6 md:px-8 lg:px-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-[#fffaf3]/90 shadow-[0_24px_70px_rgba(58,37,26,.11)] md:rounded-[2.6rem]">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-20 top-8 w-56 opacity-25 mix-blend-multiply lg:opacity-10" alt="" />
        <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-20 -top-10 w-72 opacity-20 mix-blend-multiply" alt="" />

        <div className="relative z-10 grid lg:grid-cols-[.8fr_1.2fr]">
          <div className="relative flex flex-col justify-center overflow-hidden px-5 py-6 text-center sm:px-8 sm:py-7 lg:px-10 lg:py-6 lg:text-left xl:px-12">
            <video
              ref={videoRef}
              aria-hidden="true"
              autoPlay
              muted
              playsInline
              preload="metadata"
              onTimeUpdate={handleHeroVideoTimeUpdate}
              onEnded={restartHeroVideo}
              className={`pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ease-in-out motion-reduce:hidden ${videoVisible ? 'opacity-[0.50] sm:opacity-[0.58] lg:opacity-[0.88]' : 'opacity-0'}`}
            >
              <source src="/media/hero-carousel.mp4" type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,243,.62)_0%,rgba(255,250,243,.48)_48%,rgba(255,250,243,.70)_100%)] lg:bg-[linear-gradient(90deg,rgba(255,250,243,.68)_0%,rgba(255,250,243,.56)_48%,rgba(255,250,243,.44)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#fffaf3]/70 to-transparent lg:h-24 lg:from-[#fffaf3]/50" />

            <div className="relative z-10">
              <span className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-boutique-brown/12 bg-white/80 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-boutique-brown-light shadow-sm backdrop-blur-sm lg:mx-0">
                <Sparkles className="h-3.5 w-3.5 text-boutique-wood" /> For the first hello
              </span>
              <h1 className="mt-3.5 font-serif text-[40px] leading-[.98] tracking-[-.035em] text-boutique-brown sm:text-[48px] lg:text-[52px] xl:text-[56px]">
                <span className="whitespace-nowrap">Baby Gifts Made</span><br />Just for Them
              </h1>
              <p className="mx-auto mt-3.5 max-w-[520px] text-[14px] leading-relaxed text-boutique-brown-light sm:text-[15px] lg:mx-0 lg:text-[16px]">Thoughtful gifts for newborn arrivals and first celebrations, made with their name and special details.</p>
              <div className="mx-auto mt-4 hidden w-full max-w-[500px] gap-2 sm:flex lg:mx-0">
                <button type="button" onClick={onShop} className="group relative flex aspect-[866/288] flex-1 items-center justify-center transition-transform hover:-translate-y-0.5">
                  <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-contain drop-shadow-md" alt="" />
                  <span className="relative z-10 flex items-center gap-2 font-bold text-boutique-brown">Shop Baby Gifts <ArrowRight className="h-4 w-4" /></span>
                </button>
                <button type="button" onClick={() => onFilter('new-arrivals')} className="relative flex aspect-[866/288] flex-1 items-center justify-center transition-transform hover:-translate-y-0.5">
                  <img src="/btn-paw-blank-cream.png" className="absolute inset-0 h-full w-full object-contain drop-shadow-sm" alt="" />
                  <span className="relative z-10 text-sm font-semibold text-boutique-brown-light">See New Arrivals</span>
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-20 overflow-visible border-t border-boutique-brown/10 bg-[#fffaf3]/96 px-3 py-2.5 sm:hidden">
            <div className="mx-auto grid w-full max-w-[312px] grid-cols-2 items-center gap-1.5 overflow-visible">
              <button type="button" onClick={onShop} className="group relative flex aspect-[866/288] w-full items-center justify-center overflow-visible transition-transform active:scale-[0.99]">
                <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-contain drop-shadow-md" alt="" />
                <span className="relative z-10 flex items-center gap-1 text-[10px] font-bold text-boutique-brown">Shop Baby Gifts <ArrowRight className="h-3 w-3" /></span>
              </button>
              <button type="button" onClick={() => onFilter('new-arrivals')} className="relative flex aspect-[866/288] w-full items-center justify-center overflow-visible transition-transform active:scale-[0.99]">
                <img src="/btn-paw-blank-cream.png" className="absolute inset-0 h-full w-full object-contain drop-shadow-sm" alt="" />
                <span className="relative z-10 text-[10px] font-semibold text-boutique-brown-light">See New Arrivals</span>
              </button>
            </div>
          </div>

          <div className="relative min-h-[350px] overflow-hidden border-t border-boutique-brown/8 bg-[radial-gradient(circle_at_42%_36%,#fffdf9_0%,#fff8ee_47%,rgba(242,221,198,.74)_100%)] sm:min-h-[370px] lg:min-h-[370px] lg:border-l lg:border-t-0">
            <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute left-[4%] top-[7%] w-9 opacity-25" alt="" />
            <img src="/toy-teddy-ring-teether.png" className="pointer-events-none absolute bottom-[2%] right-[1.5%] z-30 w-14 opacity-62 sm:w-16" alt="" />
            {main ? <>
              <div className="absolute left-[5%] right-[5%] top-[4%] z-20 min-h-[60px] rounded-[1rem] border border-boutique-brown/10 bg-[#fffaf3]/92 px-3.5 py-2 shadow-[0_8px_24px_rgba(58,37,26,.07)] backdrop-blur-md sm:right-auto sm:min-w-[300px]">
                <div className="grid min-h-[40px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0 self-stretch flex flex-col justify-center">
                    <p className="text-[8px] font-bold uppercase tracking-[.18em] text-boutique-wood">Featured gift</p>
                    <p className="mt-1 truncate text-[11px] font-bold text-boutique-brown">{main.name}</p>
                  </div>
                  <span className="flex h-full min-w-[64px] items-center justify-center whitespace-nowrap font-serif text-[18px] leading-none text-boutique-brown">${main.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="absolute bottom-[5%] left-[5%] right-[5%] top-[19%] overflow-hidden rounded-[1.8rem] border border-white/80 bg-boutique-bg bg-pattern bg-[length:360px_360px] shadow-[0_18px_44px_rgba(58,37,26,.09)] sm:right-[25%] sm:bg-[length:430px_430px]">
                <div className="pointer-events-none absolute inset-0 z-0 bg-[#fffaf3]/38" />
                <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_43%,rgba(255,255,255,.44)_0%,rgba(255,250,243,.16)_58%,rgba(226,201,172,.08)_100%)]" />
                <Link to={`/products/${main.slug || main.id}`} className="group absolute inset-0 z-10 flex items-center justify-center rounded-[1.8rem]" aria-label={`View ${main.name}`}>
                  <img src={main.imageUrl} alt={main.name} fetchPriority="high" className="h-[98%] w-[98%] object-contain drop-shadow-[0_18px_26px_rgba(58,37,26,.14)] transition-transform duration-500 group-hover:scale-[1.035] sm:h-[102%] sm:w-[102%]" />
                </Link>
                <button
                  type="button"
                  onClick={() => runQuickAction(main)}
                  className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-boutique-brown px-4 py-2.5 text-[11px] font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
                >
                  {needsDetails(main) ? 'Choose Details' : 'Add to Bag'} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="absolute bottom-[5%] right-[3%] top-[19%] hidden w-[210px] content-center gap-3 sm:grid">
                {more.map((product) => (
                  <div key={product.id} className="group relative min-h-[108px] overflow-hidden rounded-[1.55rem] border border-boutique-brown/10 bg-[linear-gradient(145deg,rgba(255,253,249,.98),rgba(255,247,237,.94))] p-2.5 text-left shadow-[0_12px_30px_rgba(58,37,26,.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(58,37,26,.11)]">
                    <Link to={`/products/${product.slug || product.id}`} className="grid grid-cols-[70px_1fr] items-center gap-2.5" aria-label={`View ${product.name}`}>
                      <div className="flex h-[76px] w-[70px] items-center justify-center rounded-[1.15rem] border border-white/90 bg-white/66 shadow-[inset_0_0_0_1px_rgba(226,201,172,.10)]">
                        <img src={product.imageUrl} alt={product.name} loading="lazy" className="h-[68px] w-[64px] object-contain transition-transform duration-300 group-hover:scale-105" />
                      </div>
                      <div className="min-w-0 pb-5 pr-4">
                        <p className="line-clamp-2 font-serif text-[11px] font-semibold leading-[1.15] text-boutique-brown">{product.name}</p>
                        <p className="mt-1.5 text-[11px] font-bold text-boutique-wood">${product.price.toFixed(2)}</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => runQuickAction(product)}
                      aria-label={needsDetails(product) ? `Choose details for ${product.name}` : `Add ${product.name} to bag`}
                      className="absolute bottom-2.5 right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-boutique-wood/20 bg-[#fffaf3] text-boutique-brown shadow-[0_5px_12px_rgba(58,37,26,.10)] transition-all hover:border-boutique-wood/35 hover:bg-white hover:text-boutique-wood"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </> : <div className="absolute inset-[9%] flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-boutique-brown/15 bg-white/40 text-center"><Gift className="h-7 w-7 text-boutique-wood" /><p className="mt-3 font-serif text-2xl text-boutique-brown">Loading the gift collection</p><p className="mt-2 max-w-sm px-5 text-sm text-boutique-brown-light">Only storefront catalog images are shown here.</p></div>}
          </div>
        </div>

        <div className="relative z-20 border-t border-boutique-brown/10 bg-white/42 px-3 pb-2 pt-1 sm:px-5 sm:py-1.5">
          <div className="-mx-1 flex snap-x items-center gap-2 overflow-x-auto px-1 pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:overflow-visible sm:py-0">
            {discoveryPills.map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => onFilter(pill.value)}
                className="flex-none snap-start rounded-full border border-boutique-brown/12 bg-[#fffaf3]/92 px-4 py-1.5 text-xs font-bold text-boutique-brown-light shadow-sm transition-colors hover:border-boutique-wood/30 hover:bg-white hover:text-boutique-brown"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-20 grid grid-cols-2 border-t border-boutique-brown/10 bg-white/58 sm:grid-cols-4">
          {trustItems.map(({ label, icon: Icon }, index) => (
            <div key={label} className={`flex min-h-[44px] items-center justify-center gap-2 px-3 text-center ${index % 2 ? 'border-l border-boutique-brown/10' : ''} ${index >= 2 ? 'border-t border-boutique-brown/10 sm:border-t-0' : ''} ${index > 0 ? 'sm:border-l sm:border-boutique-brown/10' : ''}`}>
              <Icon className="h-4 w-4 shrink-0 text-boutique-wood" strokeWidth={1.8} />
              <span className="text-[10px] font-bold leading-tight text-boutique-brown sm:text-[11px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
