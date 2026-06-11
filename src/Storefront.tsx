import React, { useEffect } from 'react';
import { Search, ShoppingBag, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from './store/useStore';
import { CartDrawer } from './components/CartDrawer';
import { PersonalizationModal } from './components/PersonalizationModal';
import { ProductCard } from './components/ProductCard';
import { BrandLogo } from './components/BrandLogo';

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

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const productRows = products.reduce<typeof products[]>((rows, product, index) => {
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

  return (
    <div className="w-full min-h-screen bg-boutique-bg font-sans overflow-x-clip relative selection:bg-boutique-wood-light">
      <CartDrawer />
      <PersonalizationModal />

      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-pattern bg-[length:400px_400px]"></div>

      <header className="w-full flex items-center justify-between px-6 md:px-12 py-5 relative z-30 bg-boutique-bg/80 backdrop-blur-md border-b border-boutique-brown/5">
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-boutique-brown-light">
          <button type="button" onClick={() => scrollToSection('shop')} className="hover:text-boutique-wood transition-colors flex items-center gap-2">Shop <img src="/cloud-watercolor-pink.png" className="w-6 object-contain opacity-85 drop-shadow-[0_3px_5px_rgba(58,37,26,0.18)]" alt=""/></button>
          <button type="button" onClick={() => scrollToSection('personalization')} className="hover:text-boutique-wood transition-colors flex items-center gap-2">Personalization <img src="/cloud-watercolor-blue-light.png" className="w-6 object-contain opacity-85 drop-shadow-[0_3px_5px_rgba(58,37,26,0.18)]" alt=""/></button>
          <button type="button" onClick={() => scrollToSection('gifts')} className="hover:text-boutique-wood transition-colors flex items-center gap-2">Gifts <img src="/cloud-watercolor-blue-dense.png" className="w-6 object-contain opacity-85 drop-shadow-[0_3px_5px_rgba(58,37,26,0.18)]" alt=""/></button>
          <button type="button" onClick={() => scrollToSection('our-story')} className="hover:text-boutique-wood transition-colors">Our Story</button>
        </nav>

        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="group/logo flex flex-1 justify-center md:absolute md:left-1/2 md:-translate-x-1/2" aria-label="Back to MY BABY SHIRE home">
          <BrandLogo variant="header" />
        </button>

        <div className="flex items-center gap-3 md:gap-6 text-boutique-brown">
          <button type="button" onClick={() => scrollToSection('shop')} className="hover:text-boutique-wood transition-colors p-2"><Search size={22} strokeWidth={1.5} /></button>
          <Link to="/account" className="hover:text-boutique-wood transition-colors p-2" aria-label="Member account">
            <UserRound size={22} strokeWidth={1.5} />
          </Link>
          <button type="button" onClick={openCart} className="hover:text-boutique-wood transition-colors p-2 relative">
            <ShoppingBag size={22} strokeWidth={1.5} />
            {cartItemCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-boutique-brown text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartItemCount}</span>}
          </button>
        </div>
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-start pt-10 md:pt-4 pb-8 md:pb-0 overflow-visible">
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[150vw] md:w-[1400px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(252,250,246,1)_0%,rgba(252,250,246,0.9)_30%,rgba(252,250,246,0.5)_55%,rgba(252,250,246,0)_80%)] -translate-y-1/2 pointer-events-none -z-10"></div>

        <DecorativeElement src="/decorative-moon-star.png" className="hidden sm:block top-[2%] left-[4%] md:left-[8%] opacity-90 drop-shadow-md" rotate="-15deg" size="w-32 md:w-48" />
        <DecorativeElement src="/cloud-watercolor-pink.png" className="hidden sm:block top-[20%] left-[8%] md:left-[11%] opacity-95" rotate="5deg" size="w-40 md:w-64" />
        <DecorativeElement src="/toy-teddy-ring-teether.png" className="top-[35%] left-[2%] md:left-[8%] opacity-90 drop-shadow-md" rotate="-5deg" size="w-24 md:w-36" />
        <DecorativeElement src="/toy-wooden-star-solid.png" className="hidden sm:block top-[50%] left-[16%] md:left-[22%] opacity-80 drop-shadow-sm" rotate="15deg" size="w-12 md:w-16" />
        <DecorativeElement src="/cloud-watercolor-blue-light.png" className="hidden sm:block top-[5%] right-[2%] md:right-[4%] opacity-95" rotate="-5deg" size="w-48 md:w-72" />
        <DecorativeElement src="/toy-wooden-star-teether.png" className="hidden sm:block top-[26%] right-[12%] md:right-[18%] opacity-90 drop-shadow-md" rotate="15deg" size="w-16 md:w-24" />
        <DecorativeElement src="/toy-wooden-star-solid.png" className="hidden sm:block top-[40%] right-[6%] md:right-[10%] opacity-80 drop-shadow-sm" rotate="-20deg" size="w-12 md:w-16" />
        <DecorativeElement src="/toy-pull-duck.png" className="top-[45%] right-[2%] md:right-[10%] opacity-90 drop-shadow-md" rotate="-2deg" size="w-28 md:w-44" />

        <div className="inline-flex items-center gap-2 bg-boutique-bg border-2 border-boutique-brown/10 px-5 py-2.5 rounded-3xl mb-8 md:mb-5 text-sm font-bold text-boutique-brown shadow-sm relative">
          <div className="absolute inset-1 border border-dashed border-boutique-brown/20 rounded-2xl pointer-events-none hidden md:block"></div>
          <img src="https://flagcdn.com/w40/us.png" className="w-5 h-auto rounded-[2px] relative z-10 shadow-sm" alt="USA Flag" />
          <span className="relative z-10">Handmade in the USA</span>
        </div>

        <div id="gifts" className="scroll-mt-24 text-center max-w-4xl px-6 mb-6 md:mb-3 relative z-10 mt-2">
          <h1 className="font-serif text-[42px] leading-[1.15] md:text-[64px] text-boutique-brown mb-5 md:mb-4">
            <span className="relative inline-block">Personalized Baby Gifts<span className="absolute -right-10 -top-2 scale-75 md:scale-100"><SparkleIcon /></span></span><br/>Made with Love
          </h1>
          <p className="font-sans text-lg md:text-[20px] text-boutique-brown-light max-w-3xl mx-auto leading-relaxed">Welcome to our magical nursery boutique. Discover bespoke heirlooms, exquisitely soft blankets, and heartfelt gifts customized just for them.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 mb-5 md:mb-0 justify-center w-full max-w-2xl px-4 relative z-10">
          <button type="button" onClick={() => scrollToSection('shop')} className="relative flex items-center justify-center cursor-pointer min-w-[280px] md:min-w-[300px] h-[72px] md:h-[68px] hover:-translate-y-1 transition-transform group">
            <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 w-full h-full object-fill drop-shadow-md group-active:drop-shadow-sm transition-all" alt="" />
            <span className="relative z-10 flex items-center gap-2 font-bold text-boutique-brown text-[17px] md:text-lg px-8 text-center leading-tight">Shop Personalized Gifts</span>
          </button>
          <button type="button" onClick={() => scrollToSection('shop')} className="relative flex items-center justify-center cursor-pointer min-w-[280px] md:min-w-[300px] h-[72px] md:h-[68px] hover:-translate-y-1 transition-transform group">
            <img src="/btn-paw-blank-cream.png" className="absolute inset-0 w-full h-full object-fill drop-shadow-md group-active:drop-shadow-sm transition-all" alt="" />
            <span className="relative z-10 flex items-center gap-2 font-bold text-boutique-brown text-[17px] md:text-lg px-8 text-center leading-tight">Explore New Arrivals</span>
          </button>
        </div>

        {productsLoading && <p className="text-boutique-brown-light text-sm mb-6 relative z-20">Loading products...</p>}

        <div id="shop" className="scroll-mt-24 flex flex-col gap-y-14 px-4 md:px-8 w-full max-w-[1620px] mx-auto z-20 relative md:-mb-6 md:-mt-4">
          {productRows.map((row, rowIndex) => <div key={rowIndex} className="flex flex-col md:flex-row justify-center items-center md:items-stretch gap-6 md:gap-4 w-full">{row.map((product) => <div key={product.id} className="flex w-full max-w-[540px] md:w-[32.5%]"><ProductCard product={product} /></div>)}</div>)}
        </div>
      </main>

      <footer id="our-story" className="scroll-mt-24 w-full bg-boutique-bg border-t border-boutique-brown/10 relative z-20 pt-6 md:pt-8 pb-6 md:pb-8 mt-6">
        <div className="max-w-[1300px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 md:divide-x divide-y md:divide-y-0 divide-boutique-brown/15 relative z-10">
          <div className="flex flex-col items-start gap-2 py-4 md:py-0 md:pr-10">
             <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="group/logo mb-1 text-left" aria-label="Back to MY BABY SHIRE home">
               <BrandLogo variant="footer" />
             </button>
             <p className="font-sans text-boutique-brown-light leading-relaxed max-w-[260px] text-[13px] opacity-90">Crafting expertly personalized baby gifts and nursery essentials with love and care.</p>
          </div>

          <div className="flex flex-col gap-3 py-4 md:py-0 md:px-10">
            <h4 className="font-serif tracking-[0.1em] text-boutique-brown text-sm md:text-[14px] uppercase flex items-center gap-3 mb-1">SHOP <div className="flex items-end gap-2 translate-y-[-2px]"><img src="/toy-abc-blocks.png" className="w-[42px] h-auto object-contain mix-blend-multiply opacity-90 drop-shadow-sm" alt="" /><img src="/toy-wooden-train.png" className="w-[63px] h-auto object-contain mix-blend-multiply opacity-90 drop-shadow-sm" alt="" /></div></h4>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => scrollToSection('shop')} className="text-left hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">New Arrivals</button>
              <button type="button" onClick={() => scrollToSection('shop')} className="text-left hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">Personalized Gifts</button>
            </div>
          </div>

          <div id="personalization" className="scroll-mt-24 flex flex-col gap-3 py-4 md:py-0 md:px-10">
            <h4 className="font-serif tracking-[0.1em] text-boutique-brown text-sm md:text-[14px] uppercase flex items-center gap-3 mb-1">SUPPORT <img src="/toy-drum-blue.png" className="w-[60px] h-auto object-contain mix-blend-multiply translate-y-[-2px] drop-shadow-sm" alt="" /></h4>
            <div className="flex flex-col gap-2">
              <Link to="/account" className="hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">My Account</Link>
              <Link to="/track-order" className="hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">Track Your Order</Link>
              <button type="button" onClick={() => scrollToSection('personalization')} className="text-left hover:text-boutique-wood transition-colors text-boutique-brown-light opacity-90 text-[13px] md:text-[14px]">Personalization Help</button>
            </div>
          </div>

          <div className="flex flex-col gap-3 py-4 md:py-0 md:pl-10 relative">
            <h4 className="font-serif tracking-[0.1em] text-boutique-brown text-sm md:text-[14px] uppercase flex items-center gap-3 mb-1">STAY CONNECTED <img src="/toy-teddy-ring-teether.png" className="w-[51px] h-auto object-contain mix-blend-multiply translate-y-[-2px] drop-shadow-sm" alt="" /></h4>
            <p className="font-sans text-boutique-brown-light leading-relaxed opacity-90 text-[13px] md:text-[14px] max-w-[240px]">Join our newsletter for magical updates and early access to new collections.</p>
            <img src="/cloud-watercolor-blue-light.png" className="absolute -bottom-10 right-[0%] md:right-[-10%] w-[140px] h-auto object-contain mix-blend-multiply opacity-50 z-0 pointer-events-none md:translate-x-[50%]" alt="" />
          </div>
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
