import React from 'react';
import { useStore, Product } from '../store/useStore';

interface ProductCardProps {
  product: Product;
  preview?: boolean;
}

export const ProductCard = ({ product, preview = false }: ProductCardProps) => {
  const { openPersonalizationModal } = useStore();
  const actionLabel = product.personalizationRequired ? 'Personalize' : 'View Details';
  const backgroundImage = product.bgImage || '/product-card-cloud-blue.png';
  const handleAction = () => {
    if (!preview) {
      openPersonalizationModal(product);
    }
  };

  return (
    <article
      className={`relative isolate z-10 mx-auto grid min-h-[410px] w-full max-w-[520px] grid-cols-1 items-center justify-items-center gap-3 px-10 pb-14 pt-16 text-center transition-transform md:min-h-[266px] md:grid-cols-[48%_52%] md:justify-items-stretch md:gap-0 md:px-8 md:py-8 md:text-left ${
        preview ? '' : 'group hover:-translate-y-1'
      }`}
    >
      <img
        src={backgroundImage}
        className="absolute inset-0 -z-10 h-full w-full object-fill opacity-95 drop-shadow-[var(--shadow-cloud-float)]"
        alt=""
      />

      <div className="relative z-10 flex h-[184px] w-[184px] items-center justify-center self-end md:h-[190px] md:w-full md:max-w-[205px] md:self-center">
        <div className="absolute inset-2 rounded-[44%_56%_47%_53%/38%_40%_60%_62%] border border-white/55 bg-white/35 shadow-[inset_0_0_30px_rgba(255,255,255,0.55)]"></div>
        <div
          className={`relative z-10 h-[172px] w-[172px] drop-shadow-lg transition-transform duration-500 ease-out md:h-[178px] md:w-full ${
            preview ? '' : 'group-hover:scale-105'
          }`}
        >
          <img
            src={product.imageUrl}
            className="h-full w-full object-contain"
            alt=""
          />
        </div>
        {product.badge && (
          <div className="absolute -bottom-2 right-0 rounded-full border border-[#d4b497]/30 bg-[#fdfaf6] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#3a251a] shadow-sm">
            {product.badge}
          </div>
        )}
      </div>

      <div className="relative z-10 flex w-full max-w-[250px] flex-col justify-center self-start px-2 md:max-w-none md:self-center md:pl-2 md:pr-3">
        <h3 className="mb-2 font-serif text-[1.35rem] font-medium leading-tight text-[#3a251a] md:text-[1.08rem] xl:text-[1.18rem]">
          {product.name}
        </h3>
        <p className="mb-3 text-sm font-medium leading-relaxed text-[#5a4234] opacity-90 md:min-h-[42px] md:text-[12px] xl:text-[13px]">
          {product.description}
        </p>
        <p className="mb-4 font-sans text-lg font-bold text-[#3a251a] md:mb-3 md:text-[1.05rem] xl:text-lg">
          ${product.price.toFixed(2)}
        </p>

        <button
          type="button"
          onClick={handleAction}
          disabled={preview}
          className={`group/btn relative flex h-11 w-[168px] items-center justify-center self-center transition-transform md:h-10 md:w-[148px] md:self-start xl:h-11 xl:w-[168px] ${
            preview ? 'cursor-default' : 'cursor-pointer hover:-translate-y-0.5'
          }`}
        >
          <img
            src="/btn-paw-blank-taupe.png"
            className="absolute inset-0 h-full w-full object-fill drop-shadow-sm transition-all group-active/btn:drop-shadow-none"
            alt=""
          />
          <span className="relative z-10 flex items-center gap-1.5 text-sm font-bold text-[#4a3328] md:text-xs xl:text-sm">
            {actionLabel}
          </span>
        </button>
      </div>
    </article>
  );
};
