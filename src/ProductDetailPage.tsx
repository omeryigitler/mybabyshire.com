import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BrandLogo } from './components/BrandLogo';
import { CartDrawer } from './components/CartDrawer';
import { PersonalizationModal } from './components/PersonalizationModal';
import { ProductReviews } from './components/ProductReviews';
import { StarRating } from './components/StarRating';
import { Product, ProductVariant, useStore } from './store/useStore';
import { useSeo } from './utils/seo';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { openPersonalizationModal, addToCart, openCart } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [variantError, setVariantError] = useState('');

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
        const loadedProduct = await response.json();
        if (loadedProduct.status && loadedProduct.status !== 'active') {
          throw new Error('Product is not active');
        }
        setProduct(loadedProduct);
      } catch (error) {
        console.error('Failed to load product:', error);
        setProduct(null);
      } finally {
        setProductLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  const variants = useMemo(
    () => (product?.variants || []).filter((variant) => variant.active !== false),
    [product?.variants],
  );
  const colors = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.color || '').filter(Boolean))),
    [variants],
  );
  const sizes = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.size || '').filter(Boolean))),
    [variants],
  );

  useEffect(() => {
    setVariantError('');
    if (!variants.length) {
      setSelectedColor('');
      setSelectedSize('');
      return;
    }

    setSelectedColor(colors.length === 1 ? colors[0] : variants.length === 1 ? variants[0].color || '' : '');
    setSelectedSize(sizes.length === 1 ? sizes[0] : variants.length === 1 ? variants[0].size || '' : '');
  }, [product?.id, variants.length]);

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!variants.length) return null;
    return variants.find((variant) => {
      const colorMatches = colors.length === 0 || variant.color === selectedColor;
      const sizeMatches = sizes.length === 0 || variant.size === selectedSize;
      return colorMatches && sizeMatches;
    }) || null;
  }, [colors.length, selectedColor, selectedSize, sizes.length, variants]);

  const hasPersonalization = Boolean(product?.personalizationRequired || product?.personalizationFields?.length);
  const selectedPrice = selectedVariant?.price ?? product?.price ?? 0;
  const variantPrices = variants.map((variant) => variant.price ?? product?.price ?? 0);
  const minimumVariantPrice = variantPrices.length ? Math.min(...variantPrices) : product?.price ?? 0;
  const displayPrice = variants.length && !selectedVariant ? minimumVariantPrice : selectedPrice;
  const hasPriceRange = variants.length > 1 && new Set(variantPrices.map((price) => price.toFixed(2))).size > 1;

  const isColorAvailable = (color: string) => variants.some((variant) => (
    variant.color === color
    && (sizes.length === 0 || !selectedSize || variant.size === selectedSize)
    && variant.stockQuantity > 0
  ));

  const isSizeAvailable = (size: string) => variants.some((variant) => (
    variant.size === size
    && (colors.length === 0 || !selectedColor || variant.color === selectedColor)
    && variant.stockQuantity > 0
  ));

  const addProductDirectly = (variant: ProductVariant | null) => {
    if (!product) return;
    addToCart({ product, variant, quantity: 1, personalizationData: {} });
    openCart();
  };

  const handlePrimaryAction = () => {
    if (!product) return;

    if (variants.length) {
      if (!selectedVariant) {
        setVariantError(`Choose ${[colors.length ? 'color' : '', sizes.length ? 'size' : ''].filter(Boolean).join(' and ')} before adding this item.`);
        return;
      }
      if (selectedVariant.stockQuantity <= 0) {
        setVariantError('This variant is sold out. Please choose another option.');
        return;
      }
    }

    setVariantError('');
    if (hasPersonalization) {
      openPersonalizationModal(product, selectedVariant);
      return;
    }
    addProductDirectly(selectedVariant);
  };

  const productJsonLd = useMemo(() => {
    if (!product) return null;
    const hasVariants = Boolean(product.variants?.length);
    const inStock = hasVariants ? (product.stockQuantity ?? 0) > 0 : (product.stockQuantity ?? 0) > 0;
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.imageUrl || undefined,
      offers: {
        '@type': 'Offer',
        price: minimumVariantPrice || product.price,
        priceCurrency: 'USD',
        availability: hasVariants
          ? inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
          : inStock ? 'https://schema.org/InStock' : 'https://schema.org/MadeToOrder',
      },
      ...((product.ratingCount ?? 0) > 0
        ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.ratingAverage, reviewCount: product.ratingCount } }
        : {}),
    };
  }, [minimumVariantPrice, product]);

  useSeo({
    title: product?.name,
    description: product?.description || undefined,
    image: product?.imageUrl || undefined,
    type: 'product',
    jsonLd: productJsonLd,
  });

  return (
    <div className="min-h-screen bg-white font-sans text-[#202020]">
      <CartDrawer />
      <PersonalizationModal />

      <div className="border-b border-[#ececec] bg-[#f8e9ed] px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-[#4e3d42] sm:text-xs">
        Free shipping on orders over $150
      </div>

      <header className="sticky top-0 z-40 border-b border-[#e9e9e9] bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="commerce-focus inline-flex items-center gap-2 text-sm font-semibold text-[#555] hover:text-[#202020]">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to shop</span>
          </Link>
          <Link to="/" className="group/logo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-label="MY BABY SHIRE home">
            <BrandLogo variant="nav" className="!h-[38px] sm:!h-[44px] md:!h-[48px] !drop-shadow-none" />
          </Link>
          <button type="button" onClick={openCart} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]" aria-label="Open cart"><ShoppingBag className="h-5 w-5" /></button>
        </div>
      </header>

      <main className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6 md:py-10 lg:px-8 lg:py-12">
        {productLoading && <div className="py-24 text-center text-sm text-[#777]">Loading product...</div>}

        {!productLoading && !product && (
          <div className="mx-auto max-w-lg py-24 text-center">
            <h1 className="text-3xl font-semibold">Product not found</h1>
            <p className="mt-3 text-sm text-[#777]">This item may be unavailable or still in draft.</p>
            <Link to="/" className="commerce-focus mt-6 inline-flex rounded-[9px] bg-[#202020] px-5 py-3 text-sm font-semibold text-white">Return to shop</Link>
          </div>
        )}

        {product && (
          <>
            <div className="grid gap-8 md:grid-cols-[minmax(0,1.08fr)_minmax(340px,.92fr)] lg:gap-14">
              <div>
                <div className="relative aspect-square overflow-hidden rounded-[12px] border border-[#e8e8e8] bg-[#f7f7f7]">
                  <div className="absolute inset-0 bg-[linear-gradient(145deg,#fff_0%,#f7f7f7_72%,#f6e9ed_100%)]" />
                  <img src={product.imageUrl} alt={product.name} className="relative z-10 h-full w-full object-contain p-7 sm:p-10 lg:p-14" />
                  {product.badge && <span className="absolute left-4 top-4 z-20 rounded-[7px] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm ring-1 ring-black/5">{product.badge}</span>}
                </div>
              </div>

              <section className="md:sticky md:top-[104px] md:self-start">
                {product.categoryName && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#888]">{product.categoryName}</p>}
                <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl lg:text-[44px]">{product.name}</h1>

                {(product.ratingCount ?? 0) > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <StarRating value={product.ratingAverage ?? 0} size={16} />
                    <span className="text-xs font-semibold">{(product.ratingAverage ?? 0).toFixed(1)}</span>
                    <span className="text-xs text-[#777]">({product.ratingCount} reviews)</span>
                  </div>
                )}

                <div className="mt-5 flex items-center gap-3">
                  <p className="text-2xl font-semibold">{hasPriceRange && !selectedVariant ? 'From ' : ''}${displayPrice.toFixed(2)}</p>
                  {!variants.length && product.salePrice && product.salePrice > product.price && <p className="text-base text-[#999] line-through">${product.salePrice.toFixed(2)}</p>}
                </div>

                <p className="mt-5 text-[15px] leading-7 text-[#666]">{product.description}</p>

                {variants.length > 0 && (
                  <div className="mt-7 space-y-5 border-y border-[#ededed] py-5">
                    {colors.length > 0 && (
                      <div>
                        <div className="mb-2.5 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#555]">Color</span>
                          {selectedColor && <span className="text-xs text-[#777]">{selectedColor}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {colors.map((color) => {
                            const available = isColorAvailable(color);
                            const active = selectedColor === color;
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => { setSelectedColor(color); setVariantError(''); }}
                                className={`commerce-focus min-h-10 rounded-[8px] border px-3.5 text-sm font-medium ${active ? 'border-[#202020] bg-[#202020] text-white' : available ? 'border-[#d8d8d8] bg-white hover:border-[#888]' : 'border-[#e5e5e5] bg-[#f7f7f7] text-[#aaa] line-through'}`}
                              >
                                {color}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {sizes.length > 0 && (
                      <div>
                        <div className="mb-2.5 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#555]">Size</span>
                          {selectedSize && <span className="text-xs text-[#777]">{selectedSize}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((size) => {
                            const available = isSizeAvailable(size);
                            const active = selectedSize === size;
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => { setSelectedSize(size); setVariantError(''); }}
                                className={`commerce-focus min-h-10 min-w-12 rounded-[8px] border px-3.5 text-sm font-medium ${active ? 'border-[#202020] bg-[#202020] text-white' : available ? 'border-[#d8d8d8] bg-white hover:border-[#888]' : 'border-[#e5e5e5] bg-[#f7f7f7] text-[#aaa] line-through'}`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedVariant && (
                      <div className="flex items-center justify-between gap-4 text-xs text-[#666]">
                        <span>SKU {selectedVariant.sku}</span>
                        <span className={selectedVariant.stockQuantity > 0 ? 'font-semibold text-[#316942]' : 'font-semibold text-red-600'}>
                          {selectedVariant.stockQuantity > 0 ? `${selectedVariant.stockQuantity} in stock` : 'Sold out'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {hasPersonalization && (
                  <div className="mt-6 flex items-start gap-3 rounded-[10px] border border-[#eadde1] bg-[#fbf4f6] p-4">
                    <Heart className="mt-0.5 h-4 w-4 shrink-0 text-[#855764]" />
                    <div><p className="text-sm font-semibold text-[#553a42]">Options required</p><p className="mt-1 text-xs leading-relaxed text-[#765d64]">Choose the required product details before adding this item to your cart.</p></div>
                  </div>
                )}

                {variantError && <p role="alert" className="mt-4 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{variantError}</p>}

                <div className="mt-6 grid gap-2.5">
                  <button type="button" onClick={handlePrimaryAction} className="commerce-focus flex min-h-[52px] w-full items-center justify-center rounded-[9px] bg-[#202020] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#383838]">
                    {hasPersonalization ? 'Choose options & add to cart' : 'Add to cart'}
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 border-y border-[#ededed] py-5 text-center text-[11px] font-medium text-[#666]">
                  <span className="flex flex-col items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#202020]" /> Secure checkout</span>
                  <span className="flex flex-col items-center gap-2"><Truck className="h-4 w-4 text-[#202020]" /> US shipping</span>
                  <span className="flex flex-col items-center gap-2"><Sparkles className="h-4 w-4 text-[#202020]" /> Made for you</span>
                </div>

                <div className="mt-6 divide-y divide-[#ededed] border-y border-[#ededed]">
                  {product.material && <InfoRow label="Material" value={product.material} />}
                  {product.ageRange && <InfoRow label="Age range" value={product.ageRange} />}
                  {product.preparationTime && <InfoRow label="Preparation" value={product.preparationTime} />}
                  {typeof product.stockQuantity === 'number' && <InfoRow label="Availability" value={variants.length ? product.stockQuantity > 0 ? `${product.stockQuantity} units across variants` : 'Sold out' : product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Made to order'} />}
                  {product.careInstructions && <InfoRow label="Care" value={product.careInstructions} />}
                </div>
              </section>
            </div>

            <div className="mt-14 border-t border-[#ededed] pt-4 sm:mt-20">
              <ProductReviews slug={product.slug || slug || ''} productId={product.id} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[110px_1fr] gap-4 py-3.5 text-sm">
    <span className="font-semibold text-[#333]">{label}</span>
    <span className="leading-relaxed text-[#6f6f6f]">{value}</span>
  </div>
);