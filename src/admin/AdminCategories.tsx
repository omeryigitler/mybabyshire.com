import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, CheckCircle2, Edit3, Package, Plus, RefreshCcw, Save, Sparkles, Tag, Trash2, Wand2 } from 'lucide-react';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  productCount: number;
};

const inputClass = 'w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] px-4 py-3 text-sm text-boutique-brown outline-none placeholder:text-boutique-brown/35 focus:ring-2 focus:ring-boutique-wood/25';

const StatCard = ({ title, count, note, icon: Icon }: { title: string; count: number | string; note: string; icon: React.ComponentType<{ className?: string }> }) => (
  <div className="relative overflow-hidden rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-[0_16px_40px_rgba(58,37,26,0.07)] backdrop-blur-sm">
    <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-8 -top-10 w-32 opacity-25 mix-blend-multiply" alt="" />
    <div className="relative z-10 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">{title}</p>
        <p className="mt-4 font-serif text-4xl leading-none text-boutique-brown">{count}</p>
        <p className="mt-2 text-xs text-boutique-brown-light">{note}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm"><Icon className="h-5 w-5" /></div>
    </div>
  </div>
);

export const AdminCategories = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const resetForm = () => {
    setEditingCategoryId(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const [categoryResponse, productResponse] = await Promise.all([
        fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [categoryData, productData] = await Promise.all([
        categoryResponse.json(),
        productResponse.json(),
      ]);
      if (!categoryResponse.ok) throw new Error(categoryData.details || categoryData.error || 'Could not load categories.');
      if (!productResponse.ok) throw new Error(productData.details || productData.error || 'Could not load products.');
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => {
    const active = products.filter((product) => (product.status || 'active') !== 'draft').length;
    const draft = products.filter((product) => product.status === 'draft').length;
    const featured = products.filter((product: any) => product.featured).length;
    const newArrival = products.filter((product: any) => product.newArrival).length;
    const bestseller = products.filter((product: any) => product.bestseller).length;
    const personalized = products.filter((product: any) => product.personalizationEnabled || product.personalizationFields?.length > 0 || product.personalizationRequired).length;
    return { active, draft, featured, newArrival, bestseller, personalized };
  }, [products]);

  const startEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || '');
    setImageUrl(category.imageUrl || '');
  };

  const saveCategory = async () => {
    if (!name.trim()) {
      alert('Category name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const token = getAdminToken();
      const response = await fetch(editingCategoryId ? `/api/admin/categories/${editingCategoryId}` : '/api/admin/categories', {
        method: editingCategoryId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Category could not be saved.');

      setCategories((current) => {
        if (!editingCategoryId) return [data, ...current].sort((left, right) => left.name.localeCompare(right.name));
        return current.map((category) => (category.id === data.id ? data : category));
      });
      resetForm();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    const confirmed = window.confirm(`Delete "${category.name}"? Products in this category will be moved to "No category".`);
    if (!confirmed) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Category could not be deleted.');
      setCategories((current) => current.filter((item) => item.id !== category.id));
      if (editingCategoryId === category.id) resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-7 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-12 -top-14 w-64 opacity-30 mix-blend-multiply" alt="" />
        <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute right-10 bottom-6 w-10 rotate-12 opacity-35 mix-blend-multiply" alt="" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light"><Sparkles className="h-4 w-4" /> Catalog groups</div>
            <h1 className="font-serif text-5xl leading-none text-boutique-brown">Categories</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">Create storefront categories and assign products to them from the product editor.</p>
          </div>
          <button onClick={loadData} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-5 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50"><RefreshCcw className="h-4 w-4" /> Refresh</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Active Products" count={isLoading ? '-' : stats.active} note="Visible gifts in the storefront" icon={CheckCircle2} />
        <StatCard title="Draft Products" count={isLoading ? '-' : stats.draft} note="Hidden products waiting for review" icon={Package} />
        <StatCard title="Featured" count={isLoading ? '-' : stats.featured} note="Highlighted products" icon={Tag} />
        <StatCard title="New Arrivals" count={isLoading ? '-' : stats.newArrival} note="Freshly promoted gifts" icon={Sparkles} />
        <StatCard title="Bestsellers" count={isLoading ? '-' : stats.bestseller} note="Top promotional group" icon={Boxes} />
        <StatCard title="Personalized" count={isLoading ? '-' : stats.personalized} note="Custom gift products" icon={Wand2} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/82 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
          <div className="border-b border-boutique-brown/10 p-5">
            <h2 className="font-serif text-3xl text-boutique-brown">Category Library</h2>
            <p className="mt-1 text-sm text-boutique-brown-light">{categories.length} saved categor{categories.length === 1 ? 'y' : 'ies'}</p>
          </div>
          <div className="divide-y divide-boutique-brown/10">
            {isLoading && <div className="p-8 text-center text-sm text-boutique-brown-light">Loading categories...</div>}
            {!isLoading && categories.length === 0 && <div className="p-8 text-center text-sm text-boutique-brown-light">No categories yet. Add the first one from the panel.</div>}
            {!isLoading && categories.map((category) => (
              <div key={category.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-[#fffaf3]/70 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-boutique-brown">{category.name}</h3>
                    <span className="rounded-full border border-boutique-brown/10 bg-[#fff4df] px-2.5 py-1 text-[11px] font-bold text-boutique-brown-light">{category.productCount} products</span>
                  </div>
                  <p className="mt-1 text-xs text-boutique-brown-light">/{category.slug}</p>
                  {category.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">{category.description}</p>}
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button onClick={() => startEdit(category)} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-4 py-2 text-xs font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df]"><Edit3 className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => deleteCategory(category)} className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-[2rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm">{editingCategoryId ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}</div>
            <div>
              <h2 className="font-bold text-boutique-brown">{editingCategoryId ? 'Edit Category' : 'New Category'}</h2>
              <p className="text-xs text-boutique-brown-light">Names, slugs and descriptions are saved in the database.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Name</label><input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Personalized Blankets" /></div>
            <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Slug</label><input value={slug} onChange={(event) => setSlug(event.target.value)} className={inputClass} placeholder="Auto-generated if blank" /></div>
            <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Description</label><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} placeholder="Short admin/storefront description..." /></div>
            <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Image URL</label><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className={inputClass} placeholder="Optional category image" /></div>
            <div className="flex gap-2">
              {editingCategoryId && <button onClick={resetForm} className="flex-1 rounded-full border border-boutique-brown/10 bg-white px-4 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df]">Cancel</button>}
              <button onClick={saveCategory} disabled={isSaving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-boutique-brown px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-boutique-wood disabled:opacity-50"><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
