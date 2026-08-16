import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, useStore } from '../store/useStore';

interface ProductCardProps {
  product: Product;
  preview?: boolean;
}

export const ProductCard = ({ product, preview = false }: ProductCardProps) => {
  const { openPersonalizationModal } = useStore();
  const hasPersonalization = Boolean(product.personalizationRequired || product.personalizationFields?.length);
  const detailPath = `/products/${product.slug || product.id}`;
  const hasComparePrice = Boolean(product.salePrice && product.salePrice > product.price);

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
        <img
          src={product.imageUrl}
          alt={product.name}
          loading={preview ? 'eager' : 'lazy'}
          decoding="async"
          className="relative z-10 h-full w-full object-contain p-5 transition-transform duration-300 ease-out group-hover:scale-[1.025] sm:p-7"
        />

        {(product.badge || product.newArrival || product.bestseller) && (
          <span className="absolute left-3 top-3 z-20 rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#202020] shadow-sm ring-1 ring-black/5">
            {product.bestseller ? 'Best seller' : product.newArrival ? 'New' : product.badge}
          </span>
        )}

        {hasPersonalization && (
          <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-md bg-[#f8e9ed]/95 px-2.5 py-1.5 text-[10px] font-semibold text-[#5a3540] backdrop-blur-sm">
            <Sparkles className="h-3 w-3" /> Customizable
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-3 sm:pt-4">
        {product.categoryName && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">{product.categoryName}</p>
        )}
        <Link
          to={preview ? '#' : detailPath}
          onClick={preview ? (event) => event.preventDefault() : undefined}
          className="commerce-focus line-clamp-2 text-[13px] font-semibold leading-snug text-[#202020] transition-colors hover:text-[#895b67] sm:text-[15px]"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-2 text-sm sm:text-[15px]">
          <span className="font-semibold text-[#202020]">${product.price.toFixed(2)}</span>
          {hasComparePrice && <span className="text-[#9a9a9a] line-through">${product.salePrice!.toFixed(2)}</span>}
        </div>

        <div className="mt-auto pt-3 sm:pt-4">
          {hasPersonalization ? (
            <button
              type="button"
              onClick={handleCustomize}
              disabled={preview}
              className="commerce-focus inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#202020] bg-[#202020] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#3a3a3a] disabled:cursor-default disabled:opacity-70 sm:text-sm"
            >
              Customize <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              to={preview ? '#' : detailPath}
              onClick={preview ? (event) => event.preventDefault() : undefined}
              className="commerce-focus inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#dcdcdc] bg-white px-3 py-2.5 text-xs font-semibold text-[#202020] transition-colors hover:border-[#202020] sm:text-sm"
            >
              View product <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};
