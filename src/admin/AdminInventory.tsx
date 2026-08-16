import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Edit3, Plus, RefreshCcw, Search, Trash2, X } from 'lucide-react';
import type { Product, ProductVariant } from '../store/useStore';
import { getAdminToken } from './adminAuth';

type InventoryVariant = ProductVariant & {
  productName: string;
  productSlug: string;
};

type VariantDraft = {
  id?: string;
  productId: string;
  sku: string;
  color: string;
  size: string;
  price: string;
  stockQuantity: string;
  active: boolean;
};

const emptyDraft: VariantDraft = {
  productId: '',
  sku: '',
  color: '',
  size: '',
  price: '',
  stockQuantity: '0',
  active: true,
};

const inputClass = 'h-11 w-full rounded-[9px] border border-[#dcdcdc] bg-white px-3 text-sm outline-none focus:border-[#202020] focus:ring-1 focus:ring-[#202020]';

export const AdminInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<InventoryVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<VariantDraft | null>(null);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<InventoryVariant | null>(null);

  const authHeaders = () => ({ Authorization: `Bearer ${getAdminToken()}` });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsResponse, variantsResponse] = await Promise.all([
        fetch('/api/admin/products', { headers: authHeaders() }),
        fetch('/api/admin/variants', { headers: authHeaders() }),
      ]);
      const [productsData, variantsData] = await Promise.all([productsResponse.json(), variantsResponse.json()]);
      if (!productsResponse.ok) throw new Error(productsData.details || productsData.error || 'Products could not be loaded.');
      if (!variantsResponse.ok) throw new Error(variantsData.details || variantsData.error || 'Inventory could not be loaded.');
      setProducts(productsData);
      setVariants(variantsData);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return variants;
    return variants.filter((variant) => [variant.productName, variant.sku, variant.color, variant.size]
      .some((value) => String(value || '').toLowerCase().includes(query)));
  }, [search, variants]);

  const metrics = useMemo(() => ({
    variants: variants.length,
    units: variants.reduce((sum, variant) => sum + variant.stockQuantity, 0),
    low: variants.filter((variant) => variant.active && variant.stockQuantity > 0 && variant.stockQuantity <= 5).length,
    out: variants.filter((variant) => variant.active && variant.stockQuantity === 0).length,
  }), [variants]);

  const openCreate = () => {
    setError('');
    setDraft({ ...emptyDraft, productId: products[0]?.id || '' });
  };

  const openEdit = (variant: InventoryVariant) => {
    setError('');
    setDraft({
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      color: variant.color || '',
      size: variant.size || '',
      price: variant.price === null || variant.price === undefined ? '' : String(variant.price),
      stockQuantity: String(variant.stockQuantity),
      active: variant.active,
    });
  };

  const saveVariant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || saving) return;
    setError('');

    if (!draft.productId || !draft.sku.trim() || (!draft.color.trim() && !draft.size.trim())) {
      setError('Product, SKU and at least a color or size are required.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(draft.id ? `/api/admin/variants/${draft.id}` : '/api/admin/variants', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: draft.productId,
          sku: draft.sku,
          color: draft.color,
          size: draft.size,
          price: draft.price,
          stockQuantity: draft.stockQuantity,
          active: draft.active,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Variant could not be saved.');
      setDraft(null);
      await loadData();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deleteVariant = async () => {
    if (!deleteTarget) return;
    setError('');
    try {
      const response = await fetch(`/api/admin/variants/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Variant could not be deleted.');
      setDeleteTarget(null);
      await loadData();
    } catch (deleteError) {
      setError((deleteError as Error).message);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Catalog</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em]">Inventory</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Manage exact Color × Size SKUs and stock. Variant stock is enforced again during checkout.</p>
        </div>
        <button type="button" onClick={openCreate} disabled={!products.length} className="commerce-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-40"><Plus className="h-4 w-4" /> Add variant</button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Variants" value={loading ? '—' : metrics.variants} />
        <Metric label="Units in stock" value={loading ? '—' : metrics.units} />
        <Metric label="Low stock" value={loading ? '—' : metrics.low} />
        <Metric label="Out of stock" value={loading ? '—' : metrics.out} />
      </div>

      {error && <div role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#ececec] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU, color or size" className="h-11 w-full rounded-[9px] border border-[#dedede] pl-10 pr-3 text-sm outline-none focus:border-[#202020]" /></div>
          <button type="button" onClick={() => void loadData()} disabled={loading} className="commerce-focus inline-flex h-11 items-center justify-center gap-2 rounded-[9px] border border-[#dedede] px-3.5 text-sm font-semibold hover:bg-[#f7f7f7] disabled:opacity-50"><RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#777]">Loading inventory…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center p-10 text-center"><Boxes className="h-8 w-8 text-[#999]" /><p className="mt-3 text-sm font-semibold">No variants yet</p><p className="mt-1 max-w-sm text-xs leading-5 text-[#777]">Add Color × Size combinations when a product needs SKU-level stock. Products without variants keep their existing product-level stock behavior.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[#fafafa] text-[10px] font-bold uppercase tracking-[0.12em] text-[#888]"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Color</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {filtered.map((variant) => (
                  <tr key={variant.id} className="hover:bg-[#fcfcfc]">
                    <td className="px-4 py-3 font-semibold">{variant.productName}</td>
                    <td className="px-4 py-3 text-[#666]">{variant.color || '—'}</td>
                    <td className="px-4 py-3 text-[#666]">{variant.size || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{variant.sku}</td>
                    <td className="px-4 py-3">{variant.price === null || variant.price === undefined ? 'Base price' : `$${variant.price.toFixed(2)}`}</td>
                    <td className={`px-4 py-3 font-semibold ${variant.stockQuantity === 0 ? 'text-red-600' : variant.stockQuantity <= 5 ? 'text-amber-700' : 'text-[#202020]'}`}>{variant.stockQuantity}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${variant.active ? 'bg-green-50 text-green-700' : 'bg-[#f2f2f2] text-[#777]'}`}>{variant.active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={() => openEdit(variant)} className="commerce-focus inline-flex h-9 w-9 items-center justify-center rounded-[8px] hover:bg-[#f2f2f2]" aria-label={`Edit ${variant.sku}`}><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteTarget(variant)} className="commerce-focus inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-red-600 hover:bg-red-50" aria-label={`Delete ${variant.sku}`}><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
          <form onSubmit={saveVariant} className="w-full max-w-xl rounded-[14px] border border-[#dedede] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Inventory</p><h2 className="mt-1 text-2xl font-semibold">{draft.id ? 'Edit variant' : 'Add variant'}</h2></div><button type="button" onClick={() => setDraft(null)} className="commerce-focus inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f3f3f3]"><X className="h-4 w-4" /></button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold">Product</span><select value={draft.productId} onChange={(event) => setDraft({ ...draft, productId: event.target.value })} className={inputClass}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
              <label><span className="mb-1.5 block text-xs font-semibold">Color</span><input value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} className={inputClass} placeholder="Black" /></label>
              <label><span className="mb-1.5 block text-xs font-semibold">Size</span><input value={draft.size} onChange={(event) => setDraft({ ...draft, size: event.target.value })} className={inputClass} placeholder="2T" /></label>
              <label><span className="mb-1.5 block text-xs font-semibold">SKU</span><input value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} className={inputClass} placeholder="MBS-BLK-2T" /></label>
              <label><span className="mb-1.5 block text-xs font-semibold">Stock</span><input type="number" min="0" step="1" value={draft.stockQuantity} onChange={(event) => setDraft({ ...draft, stockQuantity: event.target.value })} className={inputClass} /></label>
              <label><span className="mb-1.5 block text-xs font-semibold">Price override <span className="font-normal text-[#888]">(optional)</span></span><input type="number" min="0.01" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} className={inputClass} placeholder="Use product price" /></label>
              <label className="flex items-end"><button type="button" onClick={() => setDraft({ ...draft, active: !draft.active })} className={`commerce-focus flex h-11 w-full items-center justify-between rounded-[9px] border px-3 text-sm font-semibold ${draft.active ? 'border-green-200 bg-green-50 text-green-800' : 'border-[#dedede] bg-[#f7f7f7] text-[#777]'}`}><span>{draft.active ? 'Active' : 'Inactive'}</span><span className={`h-3 w-3 rounded-full ${draft.active ? 'bg-green-600' : 'bg-[#aaa]'}`} /></button></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDraft(null)} className="commerce-focus min-h-11 rounded-[9px] border border-[#dedede] px-4 text-sm font-semibold hover:bg-[#f7f7f7]">Cancel</button><button type="submit" disabled={saving} className="commerce-focus min-h-11 rounded-[9px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50">{saving ? 'Saving…' : 'Save variant'}</button></div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]"><div className="w-full max-w-sm rounded-[14px] bg-white p-6 shadow-2xl"><h2 className="text-xl font-semibold">Delete variant?</h2><p className="mt-2 text-sm leading-6 text-[#666]">{deleteTarget.productName} · {[deleteTarget.color, deleteTarget.size].filter(Boolean).join(' / ')} · {deleteTarget.sku}</p><p className="mt-2 text-xs leading-5 text-[#888]">Existing order snapshots stay intact. New checkouts will no longer be able to select this SKU.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="commerce-focus min-h-11 rounded-[9px] border border-[#dedede] px-4 text-sm font-semibold">Cancel</button><button type="button" onClick={() => void deleteVariant()} className="commerce-focus min-h-11 rounded-[9px] bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">Delete</button></div></div></div>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-[10px] border border-[#e3e3e3] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
);
