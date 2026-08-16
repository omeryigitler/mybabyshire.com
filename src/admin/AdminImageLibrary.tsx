import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Image as ImageIcon, Package, RefreshCcw, Search } from 'lucide-react';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';

type LibraryImage = { key: string; label: string; url: string; productName: string; sku?: string };

export const AdminImageLibrary = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  const loadProducts = async () => {
    setIsLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${getAdminToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not load media library.');
      setProducts(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { void loadProducts(); }, []);

  const images = useMemo<LibraryImage[]>(() => products.filter((product) => Boolean(product.imageUrl)).map((product) => ({ key: `${product.id}-primary`, label: 'Primary image', url: product.imageUrl, productName: product.name, sku: product.sku })), [products]);
  const filteredImages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return images;
    return images.filter((image) => `${image.productName} ${image.sku || ''} ${image.label}`.toLowerCase().includes(query));
  }, [images, searchTerm]);

  const copy = async (image: LibraryImage) => {
    await navigator.clipboard?.writeText(image.url);
    setCopied(image.key);
    window.setTimeout(() => setCopied(''), 1400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Content</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em]">Media</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Primary catalog imagery currently attached to products. Decorative legacy assets are no longer part of the commerce media library.</p></div><button type="button" onClick={() => void loadProducts()} disabled={isLoading} className="commerce-focus inline-flex min-h-11 items-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-semibold hover:bg-[#f7f7f7] disabled:opacity-50"><RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh</button></div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><Metric label="Media items" value={images.length} icon={ImageIcon} /><Metric label="Products" value={products.length} icon={Package} /><Metric label="Products with image" value={products.filter((product) => Boolean(product.imageUrl)).length} icon={ImageIcon} /></div>
      {error && <div className="rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-4 sm:p-5">
        <div className="relative max-w-sm"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search product or SKU" className="commerce-focus h-11 w-full rounded-[9px] border border-[#dedede] bg-white pl-10 pr-4 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" /></div>
        {isLoading && <div className="py-12 text-center text-sm text-[#777]">Loading media...</div>}
        {!isLoading && filteredImages.length === 0 && <div className="py-12 text-center text-sm text-[#777]">No product images found.</div>}
        {!isLoading && filteredImages.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredImages.map((image) => <article key={image.key} className="overflow-hidden rounded-[11px] border border-[#e5e5e5] bg-white"><div className="flex aspect-square items-center justify-center bg-[#fafafa] p-4"><img src={image.url} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" alt="" /></div><div className="border-t border-[#eeeeee] p-4"><p className="truncate text-sm font-semibold">{image.productName}</p><p className="mt-1 text-xs text-[#888]">{image.sku || 'No base SKU'}</p><button type="button" onClick={() => void copy(image)} className="commerce-focus mt-3 inline-flex items-center gap-1.5 rounded-[8px] border border-[#dedede] px-3 py-2 text-xs font-semibold hover:bg-[#f7f7f7]"><Copy className="h-3.5 w-3.5" /> {copied === image.key ? 'Copied' : 'Copy URL'}</button></div></article>)}</div>}
      </section>
    </div>
  );
};

const Metric = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) => <div className="rounded-[11px] border border-[#e3e3e3] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">{label}</p><div className="mt-2 flex items-center gap-2"><Icon className="h-4 w-4 text-[#888]" /><span className="text-xl font-semibold sm:text-2xl">{value}</span></div></div>;
