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

  const cardContent = (
    <article
      className={`relative isolate z-10 mx-auto grid min-h-[198px] w-full max-w-[540px] grid-cols-[42%_58%] items-center justify-items-stretch gap-0 px-5 py-5 text-left transition-transform sm:min-h-[214px] sm:px-7 sm:py-6 md:min-h-[292px] md:grid-cols-[45%_55%] md:px-10 md:py-10 ${
        preview ? '' : 'group hover:-translate-y-1'
      }`}
    >
      <CardDesignFrame value={backgroundImage} className="absolute inset-0 -z-10 h-full w-full opacity-95 drop-shadow-[var(--shadow-cloud-float)]" legacyClassName="absolute inset-0 -z-10 h-full w-full object-cover opacity-95 drop-shadow-[var(--shadow-cloud-float)]" />
      <div className="relative z-10 flex h-[132px] w-full max-w-[142px] items-center justify-center self-center sm:h-[146px] sm:max-w-[158px] md:h-[198px] md:max-w-[214px]">
        <div className="absolute inset-2 rounded-[44%_56%_47%_53%/38%_40%_60%_62%] border border-white/55 bg-white/35 shadow-[inset_0_0_30px_rgba(255,255,255,0.55)]"></div>
        <div className={`relative z-10 h-[124px] w-full max-w-[134px] drop-shadow-lg transition-transform duration-500 ease-out sm:h-[138px] sm:max-w-[150px] md:h-[184px] md:max-w-none ${preview ? '' : 'group-hover:scale-105'}`}>
          <img src={product.imageUrl} className="h-full w-full object-contain" alt="" />
        </div>
        {product.badge && <div className="absolute -bottom-1 right-0 rounded-full border border-[#d4b497]/30 bg-[#fdfaf6] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#3a251a] shadow-sm md:-bottom-2 md:px-3 md:text-[10px]">{product.badge}</div>}
      </div>
      <div className="relative z-10 flex h-[158px] w-full max-w-[205px] flex-col justify-start self-center px-1 sm:h-[170px] sm:max-w-[230px] sm:px-2 md:h-[206px] md:max-w-[270px] md:translate-y-3 md:pl-3 md:pr-3">
        <h3 className="mb-1.5 min-h-[2.4em] overflow-hidden font-serif text-[0.98rem] font-medium leading-tight text-[#3a251a] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-[1.05rem] md:mb-2 md:min-h-[2.55em] md:text-[1.08rem] xl:text-[1.18rem]">{product.name}</h3>
        <p className="mb-1.5 min-h-[2.8em] overflow-hidden text-[10px] font-medium leading-[1.4] text-[#5a4234] opacity-90 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-[11px] md:mb-3 md:min-h-[4.2em] md:text-[12px] md:leading-relaxed md:[-webkit-line-clamp:3] xl:text-[13px]">{product.description}</p>
        {(product.ratingCount ?? 0) > 0 && (
          <div className="mb-1 flex items-center justify-start gap-1.5 md:mb-2">
            <StarRating value={product.ratingAverage ?? 0} size={14} />
            <span className="text-[10px] font-medium text-[#5a4234] opacity-80 md:text-[11px]">({product.ratingCount})</span>
          </div>
        )}
        <p className="mb-1.5 font-sans text-base font-bold text-[#3a251a] md:mb-3 md:text-[1.05rem] xl:text-lg">${product.price.toFixed(2)}</p>
        <button type="button" onClick={handleAction} disabled={preview} className={`group/btn relative mt-auto flex h-9 w-[136px] items-center justify-center self-start transition-transform sm:h-10 sm:w-[148px] xl:h-11 xl:w-[168px] ${preview ? 'cursor-default' : 'cursor-pointer hover:-translate-y-0.5'}`}>
          <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-contain drop-shadow-sm transition-all group-active/btn:drop-shadow-none" alt="" />
          <span className="relative z-10 flex items-center gap-1.5 text-[11px] font-bold text-[#4a3328] sm:text-xs xl:text-sm">{actionLabel}</span>
        </button>
      </div>
    </article>
  );

  if (preview) return cardContent;

  return <Link to={detailPath} className="block w-full">{cardContent}</Link>;
};
