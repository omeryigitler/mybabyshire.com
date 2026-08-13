import React, { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Product } from '../store/useStore';
import { ProductCard } from './ProductCard';

export function CroShopAll({ products, loading, query, setQuery, searchRef }: { products: Product[]; loading: boolean; query: string; setQuery: (value: string) => void; searchRef: React.RefObject<HTMLInputElement | null> }) {
  const [category, setCategory] = React.useState('all');
  const [sort, setSort] = React.useState('featured');
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.categoryName).filter(Boolean) as string[])).sort(), [products]);
  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    const result = products.filter((p) => (!text || p.name.toLowerCase().includes(text) || (p.description || '').toLowerCase().includes(text)) && (category === 'all' || p.categoryName === category));
    if (sort === 'price-asc') return [...result].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...result].sort((a, b) => b.price - a.price);
    if (sort === 'rating') return [...result].sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
    return result;
  }, [products, query, category, sort]);

  return <section id="shop" className="scroll-mt-24 relative z-20 mx-auto mt-12 w-full max-w-[1620px] px-4 md:mt-16 md:px-8">
    <div className="mb-7 text-center"><h2 className="font-serif text-3xl text-boutique-brown md:text-[40px]">Shop All Gifts</h2><p className="mt-2 text-sm text-boutique-brown-light md:text-base">Browse the full collection, prices and made-for-you options.</p></div>
    <div className="mb-9 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-xs"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-boutique-brown/40" /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gifts..." className="w-full rounded-full border border-boutique-brown/15 bg-white/90 py-2.5 pl-10 pr-9 text-sm text-boutique-brown shadow-sm outline-none focus:ring-2 focus:ring-boutique-wood/25" />{query && <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-boutique-brown/40"><X className="h-4 w-4" /></button>}</div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {categories.length > 0 && <div className="flex flex-wrap gap-1.5">{['all', ...categories].map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-3.5 py-2 text-xs font-bold ${category === item ? 'bg-boutique-brown text-white' : 'border border-boutique-brown/12 bg-white/80 text-boutique-brown-light'}`}>{item === 'all' ? 'All' : item}</button>)}</div>}
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products" className="min-w-[190px] rounded-full border border-boutique-brown/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-boutique-brown shadow-sm outline-none">
          <option value="featured">Featured</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="rating">Top Rated</option>
        </select>
      </div>
    </div>
    {loading ? <p className="py-12 text-center text-sm text-boutique-brown-light">Loading products...</p> : visible.length === 0 ? <div className="rounded-[1.6rem] border border-boutique-brown/10 bg-white/70 px-6 py-16 text-center"><p className="font-serif text-2xl text-boutique-brown">No gifts found</p><p className="mt-2 text-sm text-boutique-brown-light">Try a different search or filter.</p></div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{visible.map((product) => <div key={product.id} className="flex"><ProductCard product={product} /></div>)}</div>}
  </section>;
}
