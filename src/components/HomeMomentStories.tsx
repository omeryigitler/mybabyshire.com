import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Product } from '../store/useStore';

export function HomeMomentStories({ products, onSearch }: { products: Product[]; onSearch: (query: string) => void }) {
  const moments = useMemo(() => {
    const newborn = products.find((product) => `${product.name} ${product.description} ${product.ageRange || ''}`.toLowerCase().includes('newborn'));
    const birthday = products.find((product) => `${product.name} ${product.description}`.toLowerCase().includes('birthday'));
    const nameMade = products.find((product) => `${product.name} ${product.description}`.toLowerCase().includes('name'));

    return [
      newborn && { title: 'The First Hello', description: 'Soft, photo-ready pieces for announcements, tiny portraits and the first days everyone wants to remember.', query: 'newborn', product: newborn },
      birthday && { title: 'First Birthday', description: 'Joyful looks for party photos, cake-smash memories and that very first candle.', query: 'birthday', product: birthday },
      nameMade && { title: 'Made with Their Name', description: 'Start with a favorite design, then add the little details that make it unmistakably theirs.', query: 'name', product: nameMade },
    ].filter(Boolean) as Array<{ title: string; description: string; query: string; product: Product }>;
  }, [products]);

  if (moments.length < 2) return null;

  return (
    <section className="relative z-20 mx-auto mt-10 w-full max-w-[1480px] px-4 sm:px-6 md:mt-14 md:px-8">
      <div className="mb-6 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-boutique-wood sm:text-[11px]">Every little milestone has a feeling</span>
        <h2 className="mt-2 font-serif text-3xl text-boutique-brown md:text-[40px]">Shop by Moment</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-boutique-brown-light md:text-base">Start with the moment you are celebrating, then make the gift feel entirely theirs.</p>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {moments.map((moment) => (
          <button key={moment.title} type="button" onClick={() => onSearch(moment.query)} className="group relative flex min-h-[220px] w-[82vw] max-w-[430px] flex-none snap-center overflow-hidden rounded-[1.8rem] border border-boutique-brown/10 bg-white/65 p-5 text-left shadow-[0_16px_42px_rgba(58,37,26,0.08)] transition-transform hover:-translate-y-1 sm:min-h-[245px] md:w-auto md:max-w-none">
            <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-14 -top-10 w-40 opacity-30 mix-blend-multiply" alt="" />
            <div className="relative z-10 flex w-[58%] flex-col justify-end self-stretch pr-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-boutique-wood">Explore</span>
              <h3 className="mt-1 font-serif text-2xl leading-tight text-boutique-brown">{moment.title}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-boutique-brown-light sm:text-[13px]">{moment.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-boutique-brown">See the gifts <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
            </div>
            <div className="absolute bottom-3 right-1 top-3 flex w-[43%] items-center justify-center rounded-[1.4rem] bg-[#fffaf3]/65">
              <img src={moment.product.imageUrl} alt={moment.product.name} loading="lazy" className="h-[88%] w-[92%] object-contain drop-shadow-[0_16px_22px_rgba(58,37,26,0.15)] transition-transform duration-500 group-hover:scale-105" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
