import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Package, Plus, RefreshCcw, Save, Tag, Trash2 } from 'lucide-react';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';
import { requestAdminConfirm } from './adminDialogs';

type Category = { id: string; name: string; slug: string; description: string; imageUrl?: string; productCount: number };
const inputClass = 'commerce-focus h-11 w-full rounded-[9px] border border-[#dedede] bg-white px-3.5 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]';
const labelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]';

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
  const [feedback, setFeedback] = useState('');

  const resetForm = () => { setEditingCategoryId(null); setName(''); setSlug(''); setDescription(''); setImageUrl(''); };

  const loadData = async () => {
    setIsLoading(true);
    setFeedback('');
    try {
      const token = getAdminToken();
      const [categoryResponse, productResponse] = await Promise.all([
        fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [categoryData, productData] = await Promise.all([categoryResponse.json(), productResponse.json()]);
      if (!categoryResponse.ok) throw new Error(categoryData.details || categoryData.error || 'Could not load categories.');
      if (!productResponse.ok) throw new Error(productData.details || productData.error || 'Could not load products.');
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const stats = useMemo(() => ({
    active: products.filter((product) => (product.status || 'active') !== 'draft').length,
    draft: products.filter((product) => product.status === 'draft').length,
    uncategorized: products.filter((product) => !product.categoryId).length,
  }), [products]);

  const startEdit = (category: Category) => {
    setEditingCategoryId(category.id); setName(category.name); setSlug(category.slug); setDescription(category.description || ''); setImageUrl(category.imageUrl || ''); setFeedback('');
  };

  const saveCategory = async () => {
    if (!name.trim()) return setFeedback('Category name is required.');
    setIsSaving(true); setFeedback('');
    try {
      const response = await fetch(editingCategoryId ? `/api/admin/categories?id=${encodeURIComponent(editingCategoryId)}` : '/api/admin/categories', {
        method: editingCategoryId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), description: description.trim(), imageUrl: imageUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Category could not be saved.');
      resetForm();
      await loadData();
      setFeedback('Category saved.');
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    const confirmed = await requestAdminConfirm({ title: `Delete ${category.name}?`, message: 'Products assigned to this category will remain in the catalog without this category.' });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/admin/categories?id=${encodeURIComponent(category.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getAdminToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Category could not be deleted.');
      if (editingCategoryId === category.id) resetForm();
      await loadData();
    } catch (error) {
      setFeedback((error as Error).message);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Catalog</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em]">Categories</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Create catalog groups and assign products from the product editor.</p></div><button type="button" onClick={() => void loadData()} disabled={isLoading} className="commerce-focus inline-flex min-h-11 items-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-semibold hover:bg-[#f7f7f7] disabled:opacity-50"><RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh</button></div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Categories" value={categories.length} icon={Tag} /><Metric label="Active products" value={stats.active} icon={Package} /><Metric label="Draft products" value={stats.draft} icon={Package} /><Metric label="Uncategorized" value={stats.uncategorized} icon={Package} /></div>
      {feedback && <div className="rounded-[9px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#666]">{feedback}</div>}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white">
          <div className="border-b border-[#ececec] p-5"><h2 className="font-semibold">Category library</h2><p className="mt-1 text-xs text-[#888]">{categories.length} saved categor{categories.length === 1 ? 'y' : 'ies'}</p></div>
          <div className="divide-y divide-[#eeeeee]">{isLoading && <div className="p-8 text-center text-sm text-[#777]">Loading categories...</div>}{!isLoading && categories.length === 0 && <div className="p-8 text-center text-sm text-[#777]">No categories yet.</div>}{!isLoading && categories.map((category) => <div key={category.id} className="flex flex-col gap-4 p-5 hover:bg-[#fafafa] md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{category.name}</h3><span className="rounded-full bg-[#f1f1f1] px-2.5 py-1 text-[10px] font-semibold text-[#666]">{category.productCount} products</span></div><p className="mt-1 text-xs text-[#888]">/{category.slug}</p>{category.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666]">{category.description}</p>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => startEdit(category)} className="commerce-focus inline-flex items-center gap-1.5 rounded-[8px] border border-[#dedede] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#f7f7f7]"><Edit3 className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => void deleteCategory(category)} className="commerce-focus inline-flex items-center gap-1.5 rounded-[8px] border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button></div></div>)}</div>
        </section>

        <aside className="h-fit rounded-[12px] border border-[#e3e3e3] bg-white p-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#f3f3f3]">{editingCategoryId ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</div><div><h2 className="font-semibold">{editingCategoryId ? 'Edit category' : 'New category'}</h2><p className="mt-1 text-xs text-[#888]">Name, URL slug and optional image.</p></div></div><div className="mt-5 space-y-4"><div><label className={labelClass}>Name</label><input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Baby Tees" /></div><div><label className={labelClass}>Slug</label><input value={slug} onChange={(event) => setSlug(event.target.value)} className={inputClass} placeholder="Auto-generated if blank" /></div><div><label className={labelClass}>Description</label><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="commerce-focus w-full rounded-[9px] border border-[#dedede] bg-white px-3.5 py-3 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" placeholder="Short collection description" /></div><div><label className={labelClass}>Image URL</label><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className={inputClass} placeholder="Optional" /></div><div className="flex gap-2">{editingCategoryId && <button type="button" onClick={resetForm} className="commerce-focus flex-1 rounded-[9px] border border-[#dedede] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f7f7f7]">Cancel</button>}<button type="button" onClick={() => void saveCategory()} disabled={isSaving} className="commerce-focus inline-flex flex-1 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-4 py-3 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50"><Save className="h-4 w-4" /> {isSaving ? 'Saving…' : 'Save'}</button></div></div></aside>
      </div>
    </div>
  );
};

const Metric = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) => <div className="rounded-[11px] border border-[#e3e3e3] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">{label}</p><div className="mt-2 flex items-center gap-2"><Icon className="h-4 w-4 text-[#888]" /><span className="text-xl font-semibold sm:text-2xl">{value}</span></div></div>;
