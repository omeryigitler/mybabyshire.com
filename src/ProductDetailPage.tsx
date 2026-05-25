import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Gift, Heart, ShieldCheck, ShoppingBag, Sparkles, Truck, X } from 'lucide-react';
import { CartDrawer } from './components/CartDrawer';
import { CardDesignFrame } from './components/CardDesignFrame';
import { PersonalizationModal } from './components/PersonalizationModal';
import { useStore } from './store/useStore';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { products, loadProducts, productsLoading, openPersonalizationModal, addToCart, openCart } = useStore();
  const [showSkipModal, setShowSkipModal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const product = useMemo(() => products.find((item) => item.slug === slug || item.id === slug), [products, slug]);

  const addProductWithoutPersonalization = () => {
    if (!product) return;
    addToCart({ product, quantity: 1, personalizationData: {} });
    setShowSkipModal(false);
    openCart();
  };

  const handlePrimaryAction = () => {
    if (!product) return;
    if (product.personalizationRequired) {
      openPersonalizationModal(product);
      return;
    }
    addProductWithoutPersonalization();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-boutique-bg font-sans text-boutique-brown">
      <CartDrawer />
      <PersonalizationModal />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-45 bg-pattern bg-[length:400px_400px]"></div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.92)_0%,rgba(252,250,246,0.55)_34%,rgba(252,250,246,0)_72%)]"></div>

      {showSkipModal && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3a251a]/25 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-[#fcfaf6] p-7 text-center shadow-2xl">
            <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -left-12 -top-10 w-44 opacity-45 mix-blend-multiply" alt="" />
            <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute bottom-6 right-8 w-12 rotate-12 opacity-35 mix-blend-multiply" alt="" />

            <button onClick={() => setShowSkipModal(false)} className="absolute right-4 top-4 rounded-full bg-white/70 p-2 text-boutique-brown-light hover:bg-boutique-wood/10">
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-boutique-brown/10 bg-white text-boutique-brown shadow-sm">
              <Gift className="h-8 w-8" />
            </div>

            <h2 className="relative z-10 font-serif text-3xl text-boutique-brown">Continue Without Personalization?</h2>
            <p className="relative z-10 mx-auto mt-3 max-w-sm text-sm leading-relaxed text-boutique-brown-light">
              This gift is extra special with custom details. Are you sure you want to add <span className="font-semibold text-boutique-brown">{product.name}</span> without personalization?
            </p>

            <div className="relative z-10 mt-6 rounded-2xl border border-boutique-brown/10 bg-white/75 p-4 text-left">
              <div className="flex items-center gap-3">
                <img src={product.imageUrl} className="h-16 w-16 rounded-xl bg-boutique-bg object-contain p-2" alt="" />
                <div>
                  <p className="font-serif text-base font-medium text-boutique-brown">{product.name}</p>
                  <p className="text-sm font-bold text-boutique-brown-light">${product.price.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex flex-col gap-3">
              <button onClick={addProductWithoutPersonalization} className="rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-boutique-wood">
                Yes, Add Without Personalization
              </button>
              <button onClick={() => setShowSkipModal(false)} className="rounded-full border border-boutique-brown/15 bg-white px-5 py-3 text-sm font-bold text-boutique-brown hover:bg-boutique-bg">
                Go Back & Personalize
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="relative z-20 flex items-center justify-between border-b border-boutique-brown/10 bg-boutique-bg/85 px-6 py-5 backdrop-blur-md md:px-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light hover:text-boutique-brown">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>
        <Link to="/" className="flex items-center gap-2 font-serif text-3xl text-boutique-brown">
          Little Wonders <img src="/decorative-moon-star.png" className="h-7 w-7 object-contain opacity-75" alt="" />
        </Link>
        <button onClick={openCart} className="rounded-full p-2 text-boutique-brown hover:bg-white/70 hover:text-boutique-wood">
          <ShoppingBag size={22} strokeWidth={1.5} />
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8 md:py-14">
        {productsLoading && <p className="text-center text-boutique-brown-light">Loading product...</p>}

        {!productsLoading && !product && (
          <div className="mx-auto max-w-xl rounded-3xl border border-boutique-brown/10 bg-white/75 p-10 text-center shadow-sm">
            <h1 className="font-serif text-4xl text-boutique-brown">Product not found</h1>
            <p className="mt-3 text-boutique-brown-light">This item may be unavailable or still in draft.</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white">Return to shop</Link>
          </div>
        )}

        {product && (
          <div className="relative grid gap-8 md:grid-cols-[52%_48%] md:items-center">
            <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-20 top-0 z-0 hidden w-64 opacity-55 mix-blend-multiply md:block" alt="" />
            <img src="/toy-wooden-star-teether.png" className="pointer-events-none absolute right-[8%] top-0 z-0 hidden w-20 rotate-12 opacity-70 mix-blend-multiply md:block" alt="" />
            <img src="/toy-pull-duck.png" className="pointer-events-none absolute -right-10 bottom-8 z-0 hidden w-36 -rotate-6 opacity-65 mix-blend-multiply xl:block" alt="" />

            <div className="relative z-10 rounded-[2.2rem] border border-boutique-brown/10 bg-white/55 p-5 shadow-[0_24px_70px_rgba(58,37,26,0.10)] backdrop-blur-sm md:p-8">
              <div className="absolute inset-3 rounded-[1.8rem] border border-dashed border-boutique-brown/10"></div>
              <CardDesignFrame value={product.bgImage} className="absolute left-1/2 top-1/2 h-[78%] w-[88%] -translate-x-1/2 -translate-y-1/2 opacity-55 drop-shadow-[0_16px_28px_rgba(58,37,26,0.10)]" legacyClassName="absolute left-1/2 top-1/2 h-[78%] w-[88%] -translate-x-1/2 -translate-y-1/2 object-fill opacity-55 drop-shadow-[0_16px_28px_rgba(58,37,26,0.10)]" />
              <img src="/toy-wooden-star-solid.png" className="absolute left-8 top-8 w-10 rotate-12 opacity-55 mix-blend-multiply" alt="" />
              <img src="/cloud-watercolor-blue-light.png" className="absolute bottom-6 right-6 w-32 opacity-35 mix-blend-multiply" alt="" />

              <div className="relative mx-auto flex aspect-square max-w-[540px] items-center justify-center rounded-[2rem] bg-white/25">
                <img src={product.imageUrl} className="max-h-[70%] max-w-[70%] object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105" alt={product.name} />
                {product.badge && <span className="absolute right-6 top-6 rounded-full border border-[#d4b497]/30 bg-[#fdfaf6] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#3a251a] shadow-sm">{product.badge}</span>}
              </div>
            </div>

            <section className="relative z-10 overflow-hidden rounded-[2.2rem] border border-boutique-brown/10 bg-white/75 p-7 shadow-[0_24px_70px_rgba(58,37,26,0.10)] backdrop-blur-sm md:p-10">
              <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-16 -top-16 w-56 opacity-35 mix-blend-multiply" alt="" />
              <div className="relative z-10">
                <div className="mb-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-boutique-bg px-4 py-2 text-xs font-bold uppercase tracking-wider text-boutique-brown-light">
                    <Sparkles className="h-4 w-4" /> Handmade in the USA
                  </span>
                  {product.personalizationRequired && <span className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-boutique-brown-light"><Heart className="h-4 w-4" /> Customizable</span>}
                </div>

                <h1 className="font-serif text-4xl leading-tight text-boutique-brown md:text-6xl">{product.name}</h1>
                <p className="mt-5 text-lg leading-relaxed text-boutique-brown-light">{product.description}</p>

                <div className="mt-6 flex items-end gap-3">
                  <p className="text-4xl font-bold text-boutique-brown">${product.price.toFixed(2)}</p>
                  {product.salePrice && <p className="pb-1 text-lg text-boutique-brown-light line-through">${product.salePrice.toFixed(2)}</p>}
                </div>

                <div className="mt-7 grid gap-3 text-sm text-boutique-brown-light sm:grid-cols-2">
                  {product.material && <InfoCard label="Material" value={product.material} />}
                  {product.ageRange && <InfoCard label="Age Range" value={product.ageRange} />}
                  {product.preparationTime && <InfoCard label="Preparation" value={product.preparationTime} />}
                  {typeof product.stockQuantity === 'number' && <InfoCard label="Availability" value={product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Made to order'} />}
                </div>

                {product.careInstructions && (
                  <div className="mt-6 rounded-2xl border border-boutique-brown/10 bg-boutique-bg/80 p-5">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-boutique-brown">Care Instructions</h2>
                    <p className="mt-2 text-sm leading-relaxed text-boutique-brown-light">{product.careInstructions}</p>
                  </div>
                )}

                <div className="mt-8 rounded-[1.8rem] border border-boutique-brown/10 bg-[#fffaf3]/80 p-4">
                  <div className="flex flex-col gap-3">
                    <button type="button" onClick={handlePrimaryAction} className="relative flex h-14 items-center justify-center overflow-hidden rounded-full bg-boutique-brown px-6 text-base font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood">
                      {product.personalizationRequired ? 'Personalize This Gift' : 'Add to Cart'}
                    </button>
                    {product.personalizationRequired && (
                      <button type="button" onClick={() => setShowSkipModal(true)} className="rounded-full border border-boutique-brown/15 bg-white px-6 py-4 text-base font-bold text-boutique-brown shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-bg">
                        Buy Without Personalization
                      </button>
                    )}
                  </div>
                  <div className="mt-4 grid gap-2 text-xs font-medium text-boutique-brown-light sm:grid-cols-3">
                    <span className="flex items-center gap-1"><Gift className="h-3.5 w-3.5" /> Gift-ready</span>
                    <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> USA shipping</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Secure checkout</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-boutique-brown/10 bg-white/75 p-4 shadow-sm">
    <p className="text-[11px] font-bold uppercase tracking-wider text-boutique-brown/60">{label}</p>
    <p className="mt-1 font-medium text-boutique-brown">{value}</p>
  </div>
);
