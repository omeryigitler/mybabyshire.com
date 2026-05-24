import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Package, RefreshCcw, Search, Sparkles } from 'lucide-react';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';

type LibraryImage = { key: string; label: string; url: string; productName?: string; type: 'Product' | 'Cloud' | 'Decor'; };

export const AdminImageLibrary = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not load image library.');
      setProducts(data);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const images = useMemo<LibraryImage[]>(() => {
    const productImages = products.flatMap((product) => {
      const list: LibraryImage[] = [];
      if (product.imageUrl) list.push({ key: `${product.id}-product`, label: 'Primary product image', url: product.imageUrl, productName: product.name, type: 'Product' });
      if (product.bgImage) list.push({ key: `${product.id}-cloud`, label: 'Storefront cloud background', url: product.bgImage, productName: product.name, type: 'Cloud' });
      return list;
    });

    const designImages: LibraryImage[] = [
      { key: 'pattern', label: 'Storefront pattern', url: '/toy-pattern.png', type: 'Decor' },
      { key: 'blue-cloud', label: 'Blue watercolor cloud', url: '/cloud-watercolor-blue-light.png', type: 'Decor' },
      { key: 'pink-cloud', label: 'Pink watercolor cloud', url: '/cloud-watercolor-pink.png', type: 'Decor' },
      { key: 'blocks', label: 'Toy blocks', url: '/toy-abc-blocks.png', type: 'Decor' },
      { key: 'star', label: 'Wooden star', url: '/toy-wooden-star-solid.png', type: 'Decor' },
    ];

    return [...productImages, ...designImages];
  }, [products]);

  const filteredImages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return images;
    return images.filter((image) => image.label.toLowerCase().includes(query) || image.type.toLowerCase().includes(query) || image.productName?.toLowerCase().includes(query));
  }, [images, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-7 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-12 -top-14 w-64 opacity-30 mix-blend-multiply" alt="" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light"><Sparkles className="h-4 w-4" /> Visual assets</div>
            <h1 className="font-serif text-5xl leading-none text-boutique-brown">Image Library</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">Review product images, cloud backgrounds, and brand decoration assets used across the storefront and back office.</p>
          </div>
          <button onClick={loadProducts} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-5 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50"><RefreshCcw className="h-4 w-4" /> Refresh</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-sm"><ImageIcon className="mb-4 h-6 w-6 text-boutique-brown" /><p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">Images</p><p className="mt-3 font-serif text-4xl text-boutique-brown">{isLoading ? '—' : images.length}</p></div>
        <div className="rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-sm"><Package className="mb-4 h-6 w-6 text-boutique-brown" /><p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">Product images</p><p className="mt-3 font-serif text-4xl text-boutique-brown">{isLoading ? '—' : images.filter((image) => image.type === 'Product').length}</p></div>
        <div className="rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-sm"><Sparkles className="mb-4 h-6 w-6 text-boutique-brown" /><p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">Design assets</p><p className="mt-3 font-serif text-4xl text-boutique-brown">{isLoading ? '—' : images.filter((image) => image.type !== 'Product').length}</p></div>
      </div>

      <div className="rounded-[2rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <div className="relative max-w-sm"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-boutique-brown/35" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search images..." className="w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] py-3 pl-12 pr-4 text-sm text-boutique-brown outline-none placeholder:text-boutique-brown/45 focus:ring-2 focus:ring-boutique-wood/25" /></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading && <div className="text-sm text-boutique-brown-light">Loading image library...</div>}
          {!isLoading && filteredImages.map((image) => (
            <div key={image.key} className="overflow-hidden rounded-[1.5rem] border border-boutique-brown/10 bg-[#fffaf3] shadow-sm">
              <div className="flex h-40 items-center justify-center bg-white/70 p-4"><img src={image.url} className="max-h-full max-w-full object-contain" alt="" /></div>
              <div className="p-4"><div className="flex items-center justify-between gap-2"><p className="truncate font-bold text-boutique-brown">{image.label}</p><span className="rounded-full border border-boutique-brown/10 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-boutique-brown-light">{image.type}</span></div>{image.productName && <p className="mt-1 truncate text-xs text-boutique-brown-light">{image.productName}</p>}<button onClick={() => navigator.clipboard?.writeText(image.url)} className="mt-3 rounded-full border border-boutique-brown/10 bg-white px-3 py-2 text-xs font-bold text-boutique-brown hover:bg-[#fff4df]">Copy URL</button></div>
            </div>
          ))}
          {!isLoading && filteredImages.length === 0 && <div className="text-sm text-boutique-brown-light">No images found.</div>}
        </div>
      </div>
    </div>
  );
};
