import React from 'react';
import { Link } from 'react-router-dom';
import { useStore, Product } from '../store/useStore';
import { CardDesignFrame } from './CardDesignFrame';

interface ProductCardProps {
  product: Product;
  preview?: boolean;
}

export const ProductCard = ({ product, preview = false }: ProductCardProps) => {
  const { openPersonalizationModal } = useStore();
  const actionLabel = product.personalizationRequired ? 'Personalize' : 'View Details';
  const backgroundImage = product.bgImage || '/product-card-cloud-blue.png';
  const detailPath = `/products/${product.slug || product.id}`;

  const handleAction = (event: React.MouseEvent) => {
    if (preview) return;

    if (product.personalizationRequired) {
      event.preventDefault();
      openPersonalizationModal(product);
    }
  };

  const cardContent = (
    <article
      className={`relative isolate z-10 mx-auto grid min-h-[430px] w-full max-w-[540px] grid-cols-1 items-center justify-items-center gap-3 px-10 pb-16 pt-16 text-center transition-transform md:min-h-[292px] md:grid-cols-[45%_55%] md:justify-items-stretch md:gap-0 md:px-10 md:py-10 md:text-left ${
        preview ? '' : 'group hover:-translate-y-1'
      }`}
    >
      <CardDesignFrame value={backgroundImage} className="absolute inset-0 -z-10 h-full w-full opacity-95 drop-shadow-[var(--shadow-cloud-float)]" legacyClassName="absolute inset-0 -z-10 h-full w-full object-fill opacity-95 drop-shadow-[var(--shadow-cloud-float)]" />
      <div className="relative z-10 flex h-[184px] w-[184px] items-center justify-center self-end md:h-[198px] md:w-full md:max-w-[214px] md:self-center">
        <div className="absolute inset-2 rounded-[44%_56%_47%_53%/38%_40%_60%_62%] border border-white/55 bg-white/35 shadow-[inset_0_0_30px_rgba(255,255,255,0.55)]"></div>
        <div className={`relative z-10 h-[172px] w-[172px] drop-shadow-lg transition-transform duration-500 ease-out md:h-[184px] md:w-full ${preview ? '' : 'group-hover:scale-105'}`}>
          <img src={product.imageUrl} className="h-full w-full object-contain" alt="" />
        </div>
        {product.badge && <div className="absolute -bottom-2 right-0 rounded-full border border-[#d4b497]/30 bg-[#fdfaf6] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#3a251a] shadow-sm">{product.badge}</div>}
      </div>
      <div className="relative z-10 flex h-[220px] w-full max-w-[260px] translate-y-2 flex-col justify-start self-start px-2 pt-1 md:h-[206px] md:max-w-[270px] md:translate-y-3 md:self-center md:pl-3 md:pr-3 md:pt-0">
        <h3 className="mb-2 min-h-[2.55em] overflow-hidden font-serif text-[1.35rem] font-medium leading-tight text-[#3a251a] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] md:text-[1.08rem] xl:text-[1.18rem]">{product.name}</h3>
        <p className="mb-3 min-h-[4.2em] overflow-hidden text-sm font-medium leading-relaxed text-[#5a4234] opacity-90 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] md:text-[12px] xl:text-[13px]">{product.description}</p>
        <p className="mb-3 font-sans text-lg font-bold text-[#3a251a] md:text-[1.05rem] xl:text-lg">${product.price.toFixed(2)}</p>
        <button type="button" onClick={handleAction} disabled={preview} className={`group/btn relative mt-auto flex h-11 w-[168px] items-center justify-center self-center transition-transform md:h-10 md:w-[148px] md:self-start xl:h-11 xl:w-[168px] ${preview ? 'cursor-default' : 'cursor-pointer hover:-translate-y-0.5'}`}>
          <img src="/btn-paw-blank-taupe.png" className="absolute inset-0 h-full w-full object-fill drop-shadow-sm transition-all group-active/btn:drop-shadow-none" alt="" />
          <span className="relative z-10 flex items-center gap-1.5 text-sm font-bold text-[#4a3328] md:text-xs xl:text-sm">{actionLabel}</span>
        </button>
      </div>
    </article>
  );

  if (preview) return cardContent;

  return <Link to={detailPath} className="block w-full">{cardContent}</Link>;
};
