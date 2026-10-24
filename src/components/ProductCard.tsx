import React, { useMemo } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, useStore } from '../store/useStore';

interface ProductCardProps {
  product: Product;
  preview?: boolean;
}

const COLOR_SWATCHES: Record<string, string> = {
  black: '#202020', white: '#ffffff', ivory: '#f4f0e6', cream: '#eee6d7', natural: '#e7dcc7', beige: '#d8c8ae', tan: '#c3a984', brown: '#765744', gray: '#9b9b9b', grey: '#9b9b9b', charcoal: '#55585b', red: '#b94a4a', pink: '#e6b8c3', blush: '#e9c8ce', rose: '#c98793', orange: '#d98b52', yellow: '#e2c85d', green: '#789174', olive: '#7c815a', sage: '#9dac93', mint: '#b8d8c4', blue: '#7798b6', navy: '#394b64', lavender: '#b7a8cc', purple: '#806b98',
};

const swatchColor = (name: string) => {
  const normalized = name.trim().toLowerCase();
  const exact = COLOR_SWATCHES[normalized];
  if (exact) return exact;
  const partial = Object.entries(COLOR_SWATCHES).find(([key]) => normalized.includes(key));
  return partial?.[1] || '#d9d9d9';
};

const clampCardZoom = (value: number | undefined) => {
  const zoom = Number(value);
  return Number.isFinite(zoom) ? Math.max(1, Math.min(5, zoom)) : 1;
};

type CropValues = { x?: number; y?: number; width?: number; height?: number };

const cropStyle = ({ x, y, width, height }: CropValues): React.CSSProperties | null => {
  const cropX = Number(x);
  const cropY = Number(y);
  const cropWidth = Number(width);
  const cropHeight = Number(height);
  if (![cropX, cropY, cropWidth, cropHeight].every(Number.isFinite)) return null;
  if (cropWidth <= 0 || cropHeight <= 0 || cropX < 0 || cropY < 0 || cropX + cropWidth > 100.1 || cropY + cropHeight > 100.1) return null;
  return {
    position: 'absolute',
    left: `${-(cropX / cropWidth) * 100}%`,
    top: `${-(cropY / cropHeight) * 100}%`,
    width: `${10000 / cropWidth}%`,
    height: `${10000 / cropHeight}%`,
    maxWidth: 'none',
    maxHeight: 'none',
  };
};

const CardImage = ({ src, alt, crop, focusX, focusY, zoom, eager = false }: { src: string; alt: string; crop: CropValues; focusX?: number; focusY?: number; zoom?: number; eager?: boolean }) => {
  const exactCrop = cropStyle(crop);
  if (exactCrop) {
    return <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} style={exactCrop} className="select-none" />;
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      style={{ objectPosition: `${focusX ?? 50}% ${focusY ?? 50}%`, transform: `scale(${clampCardZoom(zoom)})`, transformOrigin: 'center' }}
      className="h-full w-full select-none object-cover will-change-transform"
    />
  );
};

export const ProductCard = ({ product, preview = false }: ProductCardProps) => {
  const { openPersonalizationModal } = useStore();
  const hasPersonalization = Boolean(product.personalizationRequired || product.personalizationFields?.length);
  const etsyOnlyMode = import.meta.env.VITE_ETSY_ONLY_MODE === 'true';
  const detailPath = `/products/${product.slug || product.id}`;
  const hasComparePrice = Boolean(product.salePrice && product.salePrice > product.price);
  const activeVariants = (product.variants || []).filter((variant) => variant.active !== false);
  const colorOptions = useMemo(() => Array.from(new Set(activeVariants.map((variant) => variant.color || '').filter(Boolean))), [activeVariants]);
  const variantPrices = activeVariants.map((variant) => variant.price ?? product.price);
  const lowestPrice = variantPrices.length ? Math.min(...variantPrices) : product.price;
  const hasVariantPriceRange = variantPrices.length > 1 && new Set(variantPrices.map((price) => Number(price).toFixed(2))).size > 1;

  const handleCustomize = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!preview) openPersonalizationModal(product);
  };

  return (
    <article className={`group flex h-full min-w-0 flex-col ${preview ? 'max-w-sm' : ''}`}>
      <Link
        to={preview ? '#' : detailPath}
        onClick={preview ? (event) => event.preventDefault() : undefined}
        className="commerce-focus relative block aspect-[4/5] overflow-hidden rounded-[10px] border border-[#e8e8e8] bg-[#f7f7f7]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#ffffff_0%,#f7f7f7_72%,#f5e9ec_100%)]" />
        <div className={`absolute inset-0 z-10 overflow-hidden transition-all duration-300 ease-out ${product.hoverImageUrl ? 'group-hover:opacity-0' : 'group-hover:scale-[1.01]'}`}>
          <CardImage
            src={product.imageUrl}
            alt={product.name}
            eager={preview}
            focusX={product.imageFocusX}
            focusY={product.imageFocusY}
            zoom={product.imageZoom}
            crop={{ x: product.imageCropX, y: product.imageCropY, width: product.imageCropWidth, height: product.imageCropHeight }}
          />
        </div>
        {product.hoverImageUrl && (
          <div className="absolute inset-0 z-10 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:scale-[1.01] group-hover:opacity-100">
            <CardImage
              src={product.hoverImageUrl}
              alt=""
              focusX={product.hoverImageFocusX}
              focusY={product.hoverImageFocusY}
              zoom={product.hoverImageZoom}
              crop={{ x: product.hoverImageCropX, y: product.hoverImageCropY, width: product.hoverImageCropWidth, height: product.hoverImageCropHeight }}
            />
          </div>
        )}

        {(product.badge || product.newArrival || product.bestseller) && (
          <span className="absolute left-2 top-2 z-20 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#202020] shadow-sm ring-1 ring-black/5">
            {product.bestseller ? 'Best seller' : product.newArrival ? 'New' : product.badge}
          </span>
        )}

        {hasPersonalization && (
          <span className="absolute bottom-2 left-2 z-20 inline-flex items-center gap-1.5 rounded-md bg-[#f8e9ed]/95 px-2.5 py-1.5 text-[10px] font-semibold text-[#5a3540] backdrop-blur-sm">
            <Sparkles className="h-3 w-3" /> Customizable
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-3 sm:pt-4">
        {product.categoryName && <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">{product.categoryName}</p>}
        <Link to={preview ? '#' : detailPath} onClick={preview ? (event) => event.preventDefault() : undefined} className="commerce-focus line-clamp-2 text-[13px] font-semibold leading-snug text-[#202020] transition-colors hover:text-[#895b67] sm:text-[15px]">
          {product.name}
        </Link>

        {colorOptions.length > 0 && (
          <div className="mt-2 flex min-h-5 items-center gap-1.5" aria-label={`${colorOptions.length} color options`}>
            {colorOptions.slice(0, 6).map((color) => <span key={color} title={color} className="h-4.5 w-4.5 rounded-full border border-black/15 ring-1 ring-white" style={{ backgroundColor: swatchColor(color) }} />)}
            {colorOptions.length > 6 && <span className="ml-0.5 text-[10px] font-medium text-[#777]">+{colorOptions.length - 6}</span>}
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 text-sm sm:text-[15px]">
          <span className="font-semibold text-[#202020]">{hasVariantPriceRange ? 'From ' : ''}${lowestPrice.toFixed(2)}</span>
          {!activeVariants.length && hasComparePrice && <span className="text-[#9a9a9a] line-through">${product.salePrice!.toFixed(2)}</span>}
        </div>

        <div className="mt-auto pt-3 sm:pt-4">
          {hasPersonalization && !etsyOnlyMode ? (
            <button type="button" onClick={handleCustomize} disabled={preview} className="commerce-focus inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#202020] bg-[#202020] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#3a3a3a] disabled:cursor-default disabled:opacity-70 sm:text-sm">
              Customize <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link to={preview ? '#' : detailPath} onClick={preview ? (event) => event.preventDefault() : undefined} className="commerce-focus inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#dcdcdc] bg-white px-3 py-2.5 text-xs font-semibold text-[#202020] transition-colors hover:border-[#202020] sm:text-sm">
              View product <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};
