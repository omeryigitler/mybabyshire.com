import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeo } from './utils/seo';
import { ArrowLeft, Gift, Heart, ShieldCheck, ShoppingBag, Truck, X } from 'lucide-react';
import { CartDrawer } from './components/CartDrawer';
import { CardDesignFrame } from './components/CardDesignFrame';
import { PersonalizationModal } from './components/PersonalizationModal';
import { BrandLogo } from './components/BrandLogo';
import { StarRating } from './components/StarRating';
import { ProductReviews } from './components/ProductReviews';
import { Product, useStore } from './store/useStore';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { openPersonalizationModal, addToCart, openCart } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [showSkipModal, setShowSkipModal] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) {
        setProductLoading(false);
        return;
      }

      setProductLoading(true);
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);
        if (!response.ok) throw new Error('Product API failed');
        setProduct(await response.json());
      } catch (error) {
        console.error('Failed to load product:', error);
        setProduct(null);
      } finally {
        setProductLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

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

  const productJsonLd = useMemo(() => {
    if (!product) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.imageUrl || undefined,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'USD',
        availability: (product.stockQuantity ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/MadeToOrder',
      },
      ...((product.ratingCount ?? 0) > 0
        ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.ratingAverage, reviewCount: product.ratingCount } }
        : {}),
    };
  }, [product]);

  useSeo({
    title: product?.name,
    description: product?.description || undefined,
    image: product?.imageUrl || undefined,
    type: 'product',
    jsonLd: productJsonLd,
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-boutique-bg font-sans text-boutique-brown">
      <CartDrawer />
      <PersonalizationModal />
      <div className="pointer-events-none fixed inset-0 z-0 bg-pattern bg-[length:400px_400px] opacity-30"></div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.95)_0%,rgba(252,250,246,0.68)_38%,rgba(252,250,246,0)_74%)]"></div>

      {showSkipModal && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3a251a]/25 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-[#fcfaf6] p-7 text-center shadow-2xl">
            <img loading="lazy" src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -left-12 -top-10 w-44 opacity-45 mix-blend-multiply" alt="" />
            <img loading="lazy" src="/toy-wooden-star-solid.png" className="pointer-events-none absolute bottom-6 right-8 w-12 rotate-12 opacity-35 mix-blend-multiply" alt="" />

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

      <header className="relative z-20 flex min-h-[74px] items-center justify-between border-b border-boutique-brown/10 bg-boutique-bg/85 px-4 py-3 backdrop-blur-md sm:px-6 md:min-h-[86px] md:px-12">
        <Link to="/" className="relative z-20 inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light hover:text-boutique-brown">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to shop</span>
        </Link>
        <Link to="/" className="group/logo absolute left-1/2 top-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center" aria-label="MY BABY SHIRE home">
          <BrandLogo variant="nav" />
        </Link>
        <button onClick={openCart} className="relative z-20 rounded-full p-2 text-boutique-brown hover:bg-white/70 hover:text-boutique-wood">
          <ShoppingBag size={22} strokeWidth={1.5} />
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:py-10">
        {productLoading && <p className="text-center text-boutique-brown-light">Loading product...</p>}

        {!productLoading && !product && (
          <div className="mx-auto max-w-xl rounded-3xl border border-boutique-brown/10 bg-white/75 p-10 text-center shadow-sm">
            <h1 className="font-serif text-4xl text-boutique-brown">Product not found</h1>
            <p className="mt-3 text-boutique-brown-light">This item may be unavailable or still in draft.</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white">Return to shop</Link>
          </div>
        )}

        {product && (
          <>
            <div className="relative grid gap-6 md:grid-cols-[52%_48%] md:items-start lg:gap-8">
              <img loading="lazy" src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-16 top-2 z-0 hidden w-52 opacity-38 mix-blend-multiply md:block" alt="" />
              <img loading="lazy" src="/toy-wooden-star-teether.png" className="pointer-events-none absolute right-[8%] top-0 z-0 hidden w-16 rotate-12 opacity-55 mix-blend-multiply md:block" alt="" />
              <img loading="lazy" src="/toy-pull-duck.png" className="pointer-events-none absolute -right-8 bottom-8 z-0 hidden w-32 -rotate-6 opacity-50 mix-blend-multiply xl:block" alt="" />

              <div className="relative z-10 rounded-[2.2rem] border border-boutique-brown/10 bg-white/58 p-4 shadow-[0_24px_70px_rgba(58,37,26,0.08)] backdrop-blur-sm md:p-6">
                <div className="absolute inset-3 rounded-[1.8rem] border border-dashed border-boutique-brown/10"></div>
                <CardDesignFrame value={product.bgImage} className="absolute left-1/2 top-1/2 h-[76%] w-[86%] -translate-x-1/2 -translate-y-1/2 opacity-42 drop-shadow-[0_16px_28px_rgba(58,37,26,0.08)]" legacyClassName="absolute left-1/2 top-1/2 h-[76%] w-[86%] -translate-x-1/2 -translate-y-1/2 object-fill opacity-42 drop-shadow-[0_16px_28px_rgba(58,37,26,0.08)]" />
                <img loading="lazy" src="/toy-wooden-star-solid.png" className="absolute left-7 top-7 w-9 rotate-12 opacity-42 mix-blend-multiply" alt="" />
                <img loading="lazy" src="/cloud-watercolor-blue-light.png" className="absolute bottom-6 right-6 w-28 opacity-22 mix-blend-multiply" alt="" />

                <div className="relative mx-auto flex aspect-square max-w-[560px] items-center justify-center rounded-[2rem] bg-white/18">
                  <img src={product.imageUrl} className="max-h-[82%] max-w-[82%] object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.03]" alt={product.name} />
                  {product.badge && <span className="absolute right-5 top-5 rounded-full border border-[#d4b497]/30 bg-[#fdfaf6] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#3a251a] shadow-sm">{product.badge}</span>}
                </div>
              </div>

              <section className="relative z-10 overflow-hidden rounded-[2.2rem] border border-boutique-brown/10 bg-white/82 p-6 shadow-[0_24px_70px_rgba(58,37,26,0.08)] backdrop-blur-sm md:p-7 lg:p-8">
                <img loading="lazy" src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-16 -top-16 w-52 opacity-22 mix-blend-multiply" alt="" />
                <div className="relative z-10">
                  {product.personalizationRequired && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-boutique-brown-light"><Heart className="h-3.5 w-3.5" /> Customizable</span>
                    </div>
                  )}

                  <h1 className="max-w-[13ch] font-serif text-[2.55rem] leading-[1.04] text-boutique-brown sm:text-5xl md:text-[3.05rem] lg:text-[3.35rem]">{product.name}</h1>

                  {(product.ratingCount ?? 0) > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <StarRating value={product.ratingAverage ?? 0} size={17} />
                      <span className="text-sm font-bold text-boutique-brown">{(product.ratingAverage ?? 0).toFixed(1)}</span>
                      <span className="text-sm text-boutique-brown-light">({product.ratingCount} {product.ratingCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  )}

                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-boutique-brown-light lg:text-[17px]">{product.description}</p>

                  <div className="mt-4 flex items-end gap-3">
                    <p className="text-3xl font-bold text-boutique-brown lg:text-[2.15rem]">${product.price.toFixed(2)}</p>
                    {product.salePrice && <p className="pb-1 text-base text-boutique-brown-light line-through">${product.salePrice.toFixed(2)}</p>}
                  </div>

                  <div className="mt-5 rounded-[1.6rem] border border-boutique-brown/10 bg-[#fffaf3]/90 p-3.5 shadow-sm">
                    {product.personalizationRequired && (
                      <div className="mb-3 flex items-start gap-2 rounded-2xl bg-white/75 px-3 py-2.5 text-xs leading-relaxed text-boutique-brown-light">
                        <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-boutique-brown" />
                        <span>Add your custom details in the next step before adding this gift to your cart.</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-2.5">
                      <button type="button" onClick={handlePrimaryAction} className="relative flex h-13 min-h-[52px] items-center justify-center overflow-hidden rounded-full bg-boutique-brown px-6 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood sm:text-base">
                        {product.personalizationRequired ? 'Personalize This Gift' : 'Add to Cart'}
                      </button>
                      {product.personalizationRequired && (
                        <button type="button" onClick={() => setShowSkipModal(true)} className="rounded-full border border-boutique-brown/15 bg-white px-6 py-3 text-sm font-bold text-boutique-brown shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-bg">
                          Buy Without Personalization
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid gap-2 text-[11px] font-medium text-boutique-brown-light sm:grid-cols-3">
                      <span className="flex items-center gap-1"><Gift className="h-3.5 w-3.5" /> Gift-ready</span>
                      <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> USA shipping</span>
                      <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Secure checkout</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2.5 text-sm text-boutique-brown-light sm:grid-cols-2">
                    {product.material && <InfoCard label="Material" value={product.material} />}
                    {product.ageRange && <InfoCard label="Age Range" value={product.ageRange} />}
                    {product.preparationTime && <InfoCard label="Preparation" value={product.preparationTime} />}
                    {typeof product.stockQuantity === 'number' && <InfoCard label="Availability" value={product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Made to order'} />}
                  </div>

                  {product.careInstructions && (
                    <div className="mt-4 rounded-2xl border border-boutique-brown/10 bg-boutique-bg/72 p-4">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider text-boutique-brown">Care Instructions</h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-boutique-brown-light">{product.careInstructions}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
            <ProductReviews slug={product.slug || slug || ''} productId={product.id} />
          </>
        )}
      </main>
    </div>
  );
}

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-boutique-brown/10 bg-white/78 p-3 shadow-sm">
    <p className="text-[10px] font-bold uppercase tracking-wider text-boutique-brown/60">{label}</p>
    <p className="mt-1 text-[13px] font-medium leading-snug text-boutique-brown">{value}</p>
  </div>
);
