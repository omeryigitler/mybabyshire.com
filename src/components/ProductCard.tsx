import React from 'react';
import { Link } from 'react-router-dom';
import { useStore, Product } from '../store/useStore';
import { CardDesignFrame } from './CardDesignFrame';
import { StarRating } from './StarRating';

interface ProductCardProps {
  product: Product;
  preview?: boolean;
}

export const ProductCard = ({ product, preview = false }: ProductCardProps) => {
  const { openPersonalizationModal } = useStore();
  const hasDetails = Boolean(product.personalizationRequired || product.personalizationFields?.length);
  const actionLabel = hasDetails ? 'Choose Details' : 'View Details';
  const backgroundImage = product.bgImage || '/product-card-cloud-blue.png';
  const detailPath = `/products/${product.slug || product.id}`;

  const handleAction = (event: React.MouseEvent) => {
    if (preview) return;

    if (hasDetails) {
      event.preventDefault();
      openPersonalizationModal(product);
    }
  };

  const articleLayout = preview
    ? 'min-h-[206px] grid-cols-[48%_52%] px-4 py-4'
    : 'min-h-[204px] grid-cols-[48%_52%] px-4 py-4 sm:min-h-[226px] sm:grid-cols-[47%_53%] sm:px-6 sm:py-5 md:min-h-[292px] md:px-8 md:py-8';

  const imageShellLayout = preview
    ? 'h-[148px] max-w-[160px]'
    : 'h-[146px] max-w-[158px] sm:h-[166px] sm:max-w-[180px] md:h-[220px] md:max-w-[236px]';

  const imageLayout = preview
    ? 'h-[140px] max-w-[152px]'
    : 'h-[138px] max-w-[150px] sm:h-[158px] sm:max-w-[172px] md:h-[208px] md:max-w-[224px]';

  const contentLayout = preview
    ? 'h-[158px] max-w-[190px] px-0.5'
    : 'h-[156px] max-w-[190px] px-0.5 sm:h-[176px] sm:max-w-[220px] sm:px-1 md:h-[210px] md:max-w-[252px] md:translate-y-2 md:px-2';

  const titleLayout = preview
    ? 'text-[0.9rem]'
    : 'text-[0.9rem] sm:text-[0.96rem] md:text-[1.02rem] xl:text-[1.08rem]';

  const descriptionLayout = preview
    ? 'text-[9px]'
    : 'text-[9px] sm:text-[10px] md:text-[11px] xl:text-[11.5px]';

  const cardContent = (
    <article
      className={`relative isolate z-10 mx-auto grid w-full max-w-[540px] items-center justify-items-stretch gap-0 text-left transition-transform ${articleLayout} ${
        preview ? '' : 'group hover:-translate-y-1'
      }`}
    >
      <CardDesignFrame
        value={backgroundImage}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-x-0 top-[2px] -z-10 h-[calc(100%-4px)] w-full opacity-95 drop-shadow-[var(--shadow-cloud-float)]"
        legacyClassName="absolute inset-x-0 top-[2px] -z-10 h-[calc(100%-4px)] w-full object-contain opacity-95 drop-shadow-[var(--shadow-cloud-float)]"
      />

      <div className={`relative z-10 flex w-full items-center justify-center self-center ${imageShellLayout}`}>
        <div className="absolute inset-1.5 rounded-[44%_56%_47%_53%/38%_40%_60%_62%] border border-white/55 bg-white/35 shadow-[inset_0_0_30px_rgba(255,255,255,0.55)]" />
        <div className={`relative z-10 w-full drop-shadow-lg transition-transform duration-500 ease-out ${imageLayout} ${preview ? '' : 'group-hover:scale-[1.04]'}`}>
          <img src={product.imageUrl} className="h-full w-full scale-[1.07] object-contain" alt={product.name} />
        </div>
        {product.badge && (
          <div className="absolute -bottom-1 right-0 rounded-full border border-[#d4b497]/30 bg-[#fdfaf6] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#3a251a] shadow-sm md:-bottom-2 md:px-3 md:text-[10px]">
            {product.badge}
          </div>
        )}
      </div>

      <div className={`relative z-10 flex w-full flex-col justify-start self-center ${contentLayout}`}>
        <h3 className={`mb-1 min-h-[2.2em] overflow-hidden font-serif font-medium leading-[1.08] text-[#3a251a] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] md:mb-1.5 ${titleLayout}`}>
          {product.name}
        </h3>
        <p className={`mb-1.5 min-h-[2.7em] overflow-hidden font-medium leading-[1.38] text-[#5a4234] opacity-90 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] md:mb-2.5 md:min-h-[4.05em] md:[-webkit-line-clamp:3] ${descriptionLayout}`}>
          {product.description}
        </p>
        {(product.ratingCount ?? 0) > 0 && (
          <div className="mb-1 flex items-center justify-start gap-1.5 md:mb-1.5">
            <StarRating value={product.ratingAverage ?? 0} size={13} />
            <span className="text-[9px] font-medium text-[#5a4234] opacity-80 md:text-[10px]">({product.ratingCount})</span>
          </div>
        )}
        <p className="mb-1.5 font-sans text-[15px] font-bold text-[#3a251a] md:mb-2.5 md:text-[17px]">${product.price.toFixed(2)}</p>
        <button
          type="button"
          onClick={handleAction}
          disabled={preview}
          className={`group/btn relative mt-auto flex aspect-[866/288] w-[120px] items-center justify-center self-start overflow-visible transition-transform sm:w-[132px] md:w-[142px] xl:w-[148px] ${preview ? 'cursor-default' : 'cursor-pointer hover:-translate-y-0.5'}`}
        >
          <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-contain drop-shadow-sm transition-all group-active/btn:drop-shadow-none" alt="" />
          <span className="relative z-10 flex items-center gap-1.5 text-[9.5px] font-bold text-[#4a3328] sm:text-[10.5px] md:text-[11px] xl:text-xs">{actionLabel}</span>
        </button>
      </div>
    </article>
  );

  if (preview) return cardContent;

  return <Link to={detailPath} className="block w-full">{cardContent}</Link>;
};
