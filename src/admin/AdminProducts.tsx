import React, { useEffect, useMemo, useState } from 'react';
import { Edit, Package, Plus, RefreshCcw, Search, Trash, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';
import { ProductCreateWizard } from './ProductCreateWizard';
import { ProductEditWizard } from './ProductEditWizard';
import { clearProductWizardDraft, readProductWizardDraft } from './productWizardDraft';
import { AdminNoticeDialog, type AdminNotice } from './AdminNoticeDialog';

const StatusBadge = ({ status }: { status?: string }) => {
  const value = status || 'active';
  const isDraft = value === 'draft';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDraft ? 'bg-[#f1f1f1] text-[#666]' : 'bg-[#eaf5ee] text-[#316942]'}`}>{value}</span>;
};

const FeatureBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex rounded-full border border-[#e4e4e4] bg-white px-2 py-0.5 text-[10px] font-medium text-[#666]">{children}</span>
);

export const AdminProducts = () => {
  const [showArchive, setShowArchive] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const showError = (title: string, message: string, issues?: string[]) => setNotice({ kind: 'error', title, message, issues });
  const askConfirmation = (title: string, message: string, action: () => void) => {
    setConfirmAction(() => action);
    setNotice({ kind: 'confirm', title, message });
  };

  const restoreRecord = async (id: string) => {
    try {
      const response = await fetch('/api/admin/archive/restore', { method: 'POST', headers: { Authorization: `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'product', id }) });
      if (!response.ok) throw new Error('Archive restore failed.');
      await loadProducts();
    } catch (error) { showError('Restore failed', (error as Error).message); }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/products' + (showArchive ? '?archive=true' : ''), { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not load products.');
      setProducts(data);
    } catch (error) {
      showError('Products could not be loaded', 'The catalog was not changed.', [(error as Error).message]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not delete product.');
      setProducts((currentProducts) => currentProducts.filter((item) => item.id !== product.id));
    } catch (error) {
      showError('Product could not be deleted', 'Nothing was removed.', [(error as Error).message]);
    }
  };

  const handleDelete = (product: Product) => askConfirmation(
    'Delete this product?',
    `${product.name} will be permanently removed. This action cannot be undone.`,
    () => { void deleteProduct(product); },
  );

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => (
      product.name.toLowerCase().includes(query)
      || String(product.description || '').toLowerCase().includes(query)
      || String(product.status || '').toLowerCase().includes(query)
      || String(product.sku || '').toLowerCase().includes(query)
    ));
  }, [products, searchTerm]);

  useEffect(() => { void loadProducts(); }, [showArchive]);

  useEffect(() => {
    const shouldCreate = searchParams.get('create') === '1';
    const editId = searchParams.get('edit');
    if (!shouldCreate && !editId) return;
    if (shouldCreate) setIsCreateOpen(true);
    if (editId) setEditingProductId(editId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('create');
    nextParams.delete('edit');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!isCreateOpen && !editingProductId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isCreateOpen, editingProductId]);

  const activeProducts = products.filter((product) => (product.status || 'active') !== 'draft').length;
  const draftProducts = products.filter((product) => product.status === 'draft').length;
  const lowStockProducts = products.filter((product) => typeof product.stockQuantity === 'number' && product.stockQuantity <= 5).length;

  const discardCreate = () => {
    clearProductWizardDraft();
    setIsCreateOpen(false);
  };

  const closeCreate = () => {
    const draft = readProductWizardDraft();
    const hasProgress = Boolean(
      draft.name.trim() || draft.description.trim() || draft.images.length || draft.price || draft.ageRange.trim()
      || draft.material.trim() || draft.preparationTime.trim() || draft.careInstructions.trim() || draft.categoryId,
    );
    if (!hasProgress) return discardCreate();
    askConfirmation('Discard this product draft?', 'All information entered in the product editor will be cleared.', discardCreate);
  };

  const closeEdit = () => askConfirmation('Close product editor?', 'Any unsaved changes will be discarded.', () => setEditingProductId(null));

  const createSaved = async () => {
    setIsCreateOpen(false);
    await loadProducts();
    setNotice({ kind: 'success', title: 'Product saved', message: 'The product is now stored in the catalog. Add Color × Size inventory from the Inventory page if needed.' });
  };

  const editSaved = async () => {
    setEditingProductId(null);
    await loadProducts();
    setNotice({ kind: 'success', title: 'Product updated', message: 'The catalog changes are live for this product.' });
  };

  const runConfirmation = () => {
    const action = confirmAction;
    setNotice(null);
    setConfirmAction(null);
    action?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Catalog</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em] text-[#202020]">Products</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Prepare your own products here for future website sales. Only Etsy products are currently shown in the storefront; website products are saved as drafts.</p>
        </div>
        <button type="button" onClick={() => setIsCreateOpen(true)} className="commerce-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-[#383838]">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => setShowArchive(!showArchive)} className="commerce-focus rounded-lg border px-4 py-2 text-sm font-semibold">{showArchive ? 'Back to current records' : 'View archive'}</button><p className="text-sm text-[#777]">{showArchive ? 'Archived records are retained and can be restored.' : 'Previous records are archived. New records appear here.'}</p></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Total" value={isLoading ? '—' : products.length} />
        <Metric label="Active" value={isLoading ? '—' : activeProducts} />
        <Metric label="Draft" value={isLoading ? '—' : draftProducts} />
        <Metric label="Low stock" value={isLoading ? '—' : lowStockProducts} />
      </div>

      <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#ececec] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" />
            <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name, SKU or status" className="commerce-focus h-11 w-full rounded-[9px] border border-[#dedede] bg-white pl-10 pr-4 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" />
          </div>
          <button type="button" onClick={() => void loadProducts()} disabled={isLoading} className="commerce-focus inline-flex h-11 items-center justify-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-medium hover:bg-[#f7f7f7] disabled:opacity-50">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead><tr className="border-b border-[#ececec] bg-[#fafafa] text-[10px] font-bold uppercase tracking-[0.12em] text-[#888]"><th className="px-5 py-3.5">Product</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5">SKU</th><th className="px-5 py-3.5">Base stock</th><th className="px-5 py-3.5">Price</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-[#eeeeee] text-sm">
              {isLoading && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#777]">Loading products...</td></tr>}
              {!isLoading && filteredProducts.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#777]">No products found.</td></tr>}
              {!isLoading && filteredProducts.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-[#fafafa]">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-[9px] border border-[#e5e5e5] bg-[#f7f7f7]"><img src={product.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain p-1.5" /></div><div className="min-w-0"><p className="max-w-[340px] truncate font-semibold text-[#202020]">{product.name}</p><div className="mt-1.5 flex flex-wrap gap-1">{product.featured && <FeatureBadge>Featured</FeatureBadge>}{product.newArrival && <FeatureBadge>New</FeatureBadge>}{product.bestseller && <FeatureBadge>Best seller</FeatureBadge>}{Boolean(product.personalizationRequired || product.personalizationFields?.length) && <FeatureBadge>Custom</FeatureBadge>}</div></div></div></td>
                  <td className="px-5 py-4"><StatusBadge status={product.status} /></td>
                  <td className="px-5 py-4 text-[#666]">{product.sku || '—'}</td>
                  <td className="px-5 py-4"><span className={(product.stockQuantity ?? 0) <= 5 ? 'font-semibold text-[#a34d4d]' : 'text-[#555]'}>{product.stockQuantity ?? 0}</span></td>
                  <td className="px-5 py-4 font-semibold text-[#202020]">${product.price.toFixed(2)}</td>
                  <td className="px-5 py-4"><div className="flex items-center justify-end gap-1.5">{showArchive && <button type="button" onClick={() => void restoreRecord(product.id)} className="rounded-lg border px-3 py-2 text-xs">Restore as draft</button>}<button type="button" onClick={() => setEditingProductId(product.id)} className="commerce-focus inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#dedede] bg-white hover:border-[#aaa] hover:bg-[#f7f7f7]" aria-label={`Edit ${product.name}`}><Edit className="h-4 w-4" /></button><button type="button" onClick={() => handleDelete(product)} className="commerce-focus inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#f0dede] bg-white text-[#a24e4e] hover:bg-red-50" aria-label={`Delete ${product.name}`}><Trash className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isCreateOpen && <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/30 p-3 backdrop-blur-[2px] sm:p-5"><div className="relative w-full max-w-[1100px] rounded-[12px] border border-[#dedede] bg-[#f7f7f7] p-3 shadow-2xl sm:p-5"><button type="button" onClick={closeCreate} className="commerce-focus absolute right-4 top-4 z-[120] inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dedede] bg-white hover:bg-[#f5f5f5]" aria-label="Close product editor"><X className="h-4.5 w-4.5" /></button><ProductCreateWizard onCancel={closeCreate} onSaved={createSaved} /></div></div>}

      {editingProductId && <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/30 p-3 backdrop-blur-[2px] sm:p-5"><div className="relative w-full max-w-[1100px] rounded-[12px] border border-[#dedede] bg-[#f7f7f7] p-3 shadow-2xl sm:p-5"><button type="button" onClick={closeEdit} className="commerce-focus absolute right-4 top-4 z-[120] inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dedede] bg-white hover:bg-[#f5f5f5]" aria-label="Close product editor"><X className="h-4.5 w-4.5" /></button><ProductEditWizard productId={editingProductId} onCancel={closeEdit} onSaved={editSaved} /></div></div>}

      {notice && <AdminNoticeDialog notice={notice} onClose={() => { setNotice(null); setConfirmAction(null); }} onConfirm={notice.kind === 'confirm' ? runConfirmation : undefined} />}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-[11px] border border-[#e3e3e3] bg-white p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">{label}</p><div className="mt-2 flex items-center gap-2"><Package className="h-4 w-4 text-[#888]" /><span className="text-xl font-semibold text-[#202020] sm:text-2xl">{value}</span></div></div>
);
