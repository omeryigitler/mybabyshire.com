import React, { useEffect, useMemo, useState } from 'react';
import { Edit, Package, Plus, RefreshCcw, Search, Sparkles, Star, Tags, Trash, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';
import { CardDesignFrame } from '../components/CardDesignFrame';

const StatCard = ({ title, value, note, icon: Icon }: { title: string; value: string | number; note: string; icon: React.ComponentType<{ className?: string }> }) => (
  <div className="relative overflow-hidden rounded-[1.7rem] border border-boutique-brown/10 bg-white/80 p-5 shadow-[0_16px_40px_rgba(58,37,26,0.07)] backdrop-blur-sm">
    <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-8 -top-10 w-32 opacity-25 mix-blend-multiply" alt="" />
    <div className="relative z-10 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">{title}</p>
        <p className="mt-4 font-serif text-4xl leading-none text-boutique-brown">{value}</p>
        <p className="mt-2 text-xs text-boutique-brown-light">{note}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm"><Icon className="h-5 w-5" /></div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status?: string }) => {
  const value = status || 'active';
  const classes = value === 'draft'
    ? 'bg-gray-100 text-gray-700 border-gray-200'
    : 'bg-green-100 text-green-800 border-green-200';

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}>{value}</span>;
};

const FeatureBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex rounded-full border border-boutique-brown/10 bg-white px-2.5 py-1 text-[11px] font-bold text-boutique-brown-light shadow-sm">{children}</span>
);

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadProducts = async () => {
    setIsLoading(true);

    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      if (!response.ok) throw new Error(data.details || data.error || 'Could not load products.');

      setProducts(data);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(`Delete ${product.name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      if (!response.ok) throw new Error(data.details || data.error || 'Could not delete product.');

      setProducts((currentProducts) => currentProducts.filter((item) => item.id !== product.id));
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => product.name.toLowerCase().includes(query) || String(product.description || '').toLowerCase().includes(query) || String(product.status || '').toLowerCase().includes(query));
  }, [products, searchTerm]);

  useEffect(() => { loadProducts(); }, []);

  const activeProducts = products.filter((product) => (product.status || 'active') !== 'draft').length;
  const draftProducts = products.filter((product) => product.status === 'draft').length;
  const personalizedProducts = products.filter((product: any) => product.personalizationRequired || product.personalizationEnabled || product.personalizationFields?.length > 0).length;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-7 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-12 -top-14 w-64 opacity-30 mix-blend-multiply" alt="" />
        <img src="/toy-abc-blocks.png" className="pointer-events-none absolute right-12 bottom-5 w-16 -rotate-6 opacity-35 mix-blend-multiply" alt="" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light">
              <Sparkles className="h-4 w-4" /> Product studio
            </div>
            <h1 className="font-serif text-5xl leading-none text-boutique-brown">Products</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">Manage Little Wonders gifts, product images, pricing, visibility, and personalization readiness.</p>
          </div>
          <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-boutique-brown px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Products" value={isLoading ? '—' : products.length} icon={Package} note="All gifts in the catalog" />
        <StatCard title="Active" value={isLoading ? '—' : activeProducts} icon={Star} note="Visible products ready to sell" />
        <StatCard title="Draft / Personalized" value={isLoading ? '—' : `${draftProducts} / ${personalizedProducts}`} icon={Wand2} note="Drafts and custom gifts" />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/82 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 border-b border-boutique-brown/10 p-5">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-boutique-brown/35" />
            <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products..." className="w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] py-3 pl-12 pr-4 text-sm text-boutique-brown outline-none transition-all placeholder:text-boutique-brown/45 focus:ring-2 focus:ring-boutique-wood/25" />
          </div>
          <button onClick={loadProducts} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-4 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-boutique-brown/10 bg-[#fffaf3]/70 text-xs uppercase tracking-[0.14em] text-boutique-brown/55">
              <th className="px-6 py-4 font-bold">Product</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Card design</th>
              <th className="px-6 py-4 font-bold">Price</th>
              <th className="px-6 py-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-boutique-brown/10 text-sm">
            {isLoading && <tr><td colSpan={5} className="px-6 py-10 text-center text-boutique-brown-light">Loading products...</td></tr>}
            {!isLoading && filteredProducts.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-boutique-brown-light">No products found.</td></tr>}
            {!isLoading && filteredProducts.map((product) => (
              <tr key={product.id} className="transition-colors hover:bg-[#fffaf3]/70">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[1.4rem] border border-boutique-brown/10 bg-[#fffaf3] shadow-sm">
                      {product.bgImage && <CardDesignFrame value={product.bgImage} className="absolute inset-0 h-full w-full opacity-40" legacyClassName="absolute inset-0 h-full w-full object-cover opacity-40" />}
                      <img src={product.imageUrl} className="relative z-10 h-full w-full object-contain p-2" alt="" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-xl leading-tight text-boutique-brown">{product.name}</h3>
                      <p className="mt-1 max-w-sm truncate text-xs text-boutique-brown-light">{product.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(product as any).featured && <FeatureBadge>Featured</FeatureBadge>}
                        {((product as any).newArrival || (product as any).isNewArrival) && <FeatureBadge>New arrival</FeatureBadge>}
                        {((product as any).bestseller || (product as any).isBestseller) && <FeatureBadge>Bestseller</FeatureBadge>}
                        {((product as any).personalizationRequired || (product as any).personalizationEnabled || (product as any).personalizationFields?.length > 0) && <FeatureBadge>Personalized</FeatureBadge>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><StatusBadge status={product.status} /></td>
                <td className="px-6 py-4">
                  <div className="relative h-12 w-28 overflow-hidden rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] shadow-sm">
                    <CardDesignFrame value={product.bgImage} className="h-full w-full opacity-80" legacyClassName="h-full w-full object-cover opacity-80" />
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-boutique-brown">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/admin/products/${product.id}/edit`} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-boutique-brown/10 bg-white text-boutique-brown shadow-sm hover:bg-[#fff4df]" aria-label={`Edit ${product.name}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleDelete(product)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 shadow-sm hover:bg-red-50" aria-label={`Delete ${product.name}`}>
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
