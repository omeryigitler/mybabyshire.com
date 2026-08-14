import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../store/useStore';

export function HomeShopMoments({ products }: { products: Product[] }) {
  const moments = useMemo(() => {
    const find = (term: string) => products.find((product) => `${product.name} ${product.description} ${product.ageRange || ''}`.toLowerCase().includes(term));
    return [
      { title: 'The First Hello', detail: 'Newborn moments', product: find('newborn') },
      { title: 'First Birthday', detail: 'One very big little milestone', product: find('birthday') },
      { title: 'Made with Their Name', detail: 'A detail that makes it theirs', product: find('name') },
    ].filter((item) => item.product) as Array<{ title: string; detail: string; product: Product }>;
  }, [products]);

  if (moments.length < 2) return null;

  return (
    <section className="relative z-20 mx-auto mt-10 w-full max-w-[1480px] px-4 sm:px-6 md:mt-14 md:px-8">
      <div className="mb-5 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[.2em] text-boutique-wood">Every little milestone has a feeling</span>
        <h2 className="mt-2 font-serif text-3xl text-boutique-brown md:text-[40px]">Shop by Moment</h2>
      </div>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:px-0">
        {moments.map(({ title, detail, product }) => (
          <Link key={title} to={`/products/${product.slug || product.id}`} className="group relative min-h-[205px] w-[82vw] max-w-[430px] flex-none snap-center overflow-hidden rounded-[1.7rem] border border-boutique-brown/10 bg-white/70 p-5 text-left shadow-[0_14px_38px_rgba(58,37,26,.08)] transition-transform hover:-translate-y-0.5 md:w-auto">
            <div className="relative z-10 w-[56%]">
              <span className="text-[10px] font-bold uppercase tracking-[.15em] text-boutique-wood">{detail}</span>
              <h3 className="mt-2 font-serif text-2xl leading-tight text-boutique-brown">{title}</h3>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-boutique-brown">See the gift <ArrowRight className="h-3.5 w-3.5" /></span>
            </div>
            <div className="absolute bottom-3 right-2 top-3 flex w-[42%] items-center justify-center rounded-[1.25rem] bg-[#fffaf3]/80">
              <img src={product.imageUrl} alt={product.name} loading="lazy" className="h-[90%] w-[90%] object-contain transition-transform group-hover:scale-105" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
