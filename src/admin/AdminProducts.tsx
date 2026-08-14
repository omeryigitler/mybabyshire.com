import React, { useEffect, useMemo, useState } from 'react';
import { Edit, Package, Plus, RefreshCcw, Search, Sparkles, Star, Trash, Wand2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';
import { CardDesignFrame } from '../components/CardDesignFrame';
import { Button, PageHeader, StatCard } from './ui';
import { ProductCreateWizard } from './ProductCreateWizard';
import { ProductEditWizard } from './ProductEditWizard';
import { clearProductWizardDraft, readProductWizardDraft, validateProductWizardStep, validateProductWizardThrough } from './productWizardDraft';
import { saveProductWizardDraft } from './saveProductWizardDraft';
import { AdminNoticeDialog, type AdminNotice } from './AdminNoticeDialog';
import { PRODUCT_WIZARD_STEPS } from './ProductWizardHeader';

const StatusBadge = ({ status }: { status?: string }) => {
  const value = status || 'active';
  const classes = value === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-green-100 text-green-800 border-green-200';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classes}`}>{value}</span>;
};

const FeatureBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex rounded-full border border-boutique-brown/10 bg-white px-2.5 py-1 text-[11px] font-bold text-boutique-brown-light shadow-sm">{children}</span>
);

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const showError = (title: string, message: string, issues?: string[]) => setNotice({ kind: 'error', title, message, issues });
  const askConfirmation = (title: string, message: string, action: () => void) => {
    setConfirmAction(() => action);
    setNotice({ kind: 'confirm', title, message });
  };

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
      showError('Products could not be loaded', 'The catalog was not changed.', [(error as Error).message]);
    } finally { setIsLoading(false); }
  };

  const deleteProduct = async (product: Product) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not delete product.');
      setProducts((currentProducts) => currentProducts.filter((item) => item.id !== product.id));
    } catch (error) {
      console.error(error);
      showError('Product could not be deleted', 'Nothing was removed.', [(error as Error).message]);
    }
  };

  const handleDelete = (product: Product) => askConfirmation('Delete this product?', `${product.name} will be permanently removed. This action cannot be undone.`, () => { void deleteProduct(product); });

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => product.name.toLowerCase().includes(query) || String(product.description || '').toLowerCase().includes(query) || String(product.status || '').toLowerCase().includes(query));
  }, [products, searchTerm]);

  useEffect(() => { loadProducts(); }, []);

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
  const personalizedProducts = products.filter((product: any) => product.personalizationRequired || product.personalizationEnabled || product.personalizationFields?.length > 0).length;

  const discardCreate = () => { clearProductWizardDraft(); setIsCreateOpen(false); };
  const closeCreate = () => {
    const draft = readProductWizardDraft();
    const hasProgress = Boolean(draft.name.trim() || draft.description.trim() || draft.images.length || draft.price || draft.ageRange.trim() || draft.material.trim() || draft.preparationTime.trim() || draft.careInstructions.trim() || draft.categoryId);
    if (!hasProgress) return discardCreate();
    askConfirmation('Discard this product draft?', 'All information entered in the 8-step wizard will be cleared.', discardCreate);
  };

  const closeEdit = () => askConfirmation('Close product editor?', 'Any unsaved changes in this wizard will be discarded.', () => setEditingProductId(null));

  const currentWizardStep = (root: HTMLDivElement) => {
    const stepText = Array.from(root.querySelectorAll('p')).map((node) => node.textContent?.trim() || '').find((text) => /^Step \d+ of 8$/.test(text));
    const match = stepText?.match(/^Step (\d+) of 8$/);
    return match ? Number(match[1]) : 1;
  };

  const blockWithIssues = (step: number, issues: string[]) => showError(`Complete step ${step} first`, 'Every required field must be complete before you can move forward.', issues);

  const handleWizardClickCapture = async (event: React.MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;
    const label = button.textContent?.replace(/\s+/g, ' ').trim() || '';
    const root = event.currentTarget;
    const draft = readProductWizardDraft();
    const currentStep = currentWizardStep(root);

    if (label === 'Cancel' || label === 'Products') {
      event.preventDefault(); event.stopPropagation(); closeCreate(); return;
    }

    if (label.startsWith('Next')) {
      const issues = validateProductWizardStep(draft, currentStep);
      if (issues.length) { event.preventDefault(); event.stopPropagation(); blockWithIssues(currentStep, issues); }
      return;
    }

    const targetStep = PRODUCT_WIZARD_STEPS.findIndex((stepLabel, index) => label.replace(/\s+/g, '') === `${index + 1}${stepLabel}`.replace(/\s+/g, '')) + 1;
    if (targetStep > currentStep) {
      for (let candidate = 1; candidate < targetStep; candidate += 1) {
        const issues = validateProductWizardStep(draft, candidate);
        if (issues.length) { event.preventDefault(); event.stopPropagation(); blockWithIssues(candidate, issues); return; }
      }
    }

    if (!label.includes('Save Product')) return;
    event.preventDefault(); event.stopPropagation();
    if (isSavingProduct) return;
    const issues = validateProductWizardThrough(draft, 7);
    if (issues.length) {
      for (let candidate = 1; candidate <= 7; candidate += 1) {
        const stepIssues = validateProductWizardStep(draft, candidate);
        if (stepIssues.length) { blockWithIssues(candidate, stepIssues); return; }
      }
    }

    setIsSavingProduct(true);
    try {
      await saveProductWizardDraft(draft);
      clearProductWizardDraft();
      setIsCreateOpen(false);
      await loadProducts();
      setNotice({ kind: 'success', title: 'Product saved', message: 'The product is now stored in the catalog.' });
    } catch (error) {
      console.error(error);
      showError('Product could not be saved', 'Nothing was published. Fix the issue and try again.', [(error as Error).message]);
    } finally { setIsSavingProduct(false); }
  };

  const runConfirmation = () => { const action = confirmAction; setNotice(null); setConfirmAction(null); action?.(); };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Product studio" icon={Sparkles} title="Products" description="Manage MY BABY SHIRE gifts, product images, pricing, visibility, and personalization readiness." actions={<Button variant="primary" icon={Plus} onClick={() => setIsCreateOpen(true)}>Add Product</Button>} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Products" value={isLoading ? '—' : products.length} icon={Package} hint="All gifts in the catalog" />
        <StatCard label="Active" value={isLoading ? '—' : activeProducts} icon={Star} tone="green" hint="Visible products ready to sell" />
        <StatCard label="Draft / Personalized" value={isLoading ? '—' : `${draftProducts} / ${personalizedProducts}`} icon={Wand2} tone="blue" hint="Drafts and custom gifts" />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/82 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 border-b border-boutique-brown/10 p-5">
          <div className="relative max-w-sm flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-boutique-brown/35" /><input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products..." className="w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] py-3 pl-12 pr-4 text-sm text-boutique-brown shadow-sm outline-none placeholder:text-boutique-brown/45 focus:ring-2 focus:ring-boutique-wood/25" /></div>
          <button onClick={loadProducts} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-4 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50"><RefreshCcw className="h-4 w-4" /> Refresh</button>
        </div>

        <table className="w-full border-collapse text-left">
          <thead><tr className="border-b border-boutique-brown/10 bg-[#fffaf3]/70 text-xs uppercase tracking-[0.14em] text-boutique-brown/55"><th className="px-6 py-4 font-bold">Product</th><th className="px-6 py-4 font-bold">Status</th><th className="px-6 py-4 font-bold">Card design</th><th className="px-6 py-4 font-bold">Price</th><th className="px-6 py-4 text-right font-bold">Actions</th></tr></thead>
          <tbody className="divide-y divide-boutique-brown/10 text-sm">
            {isLoading && <tr><td colSpan={5} className="px-6 py-10 text-center text-boutique-brown-light">Loading products...</td></tr>}
            {!isLoading && filteredProducts.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-boutique-brown-light">No products found.</td></tr>}
            {!isLoading && filteredProducts.map((product) => <tr key={product.id} className="transition-colors hover:bg-[#fffaf3]/70">
              <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[1.4rem] border border-boutique-brown/10 bg-[#fffaf3] shadow-sm">{product.bgImage && <CardDesignFrame value={product.bgImage} className="absolute inset-0 h-full w-full opacity-40" legacyClassName="absolute inset-0 h-full w-full object-cover opacity-40" />}<img src={product.imageUrl} className="relative z-10 h-full w-full object-contain p-2" alt="" /></div><div className="min-w-0"><h3 className="font-serif text-xl leading-tight text-boutique-brown">{product.name}</h3><p className="mt-1 max-w-sm truncate text-xs text-boutique-brown-light">{product.description}</p><div className="mt-2 flex flex-wrap gap-1.5">{(product as any).featured && <FeatureBadge>Featured</FeatureBadge>}{((product as any).newArrival || (product as any).isNewArrival) && <FeatureBadge>New arrival</FeatureBadge>}{((product as any).bestseller || (product as any).isBestseller) && <FeatureBadge>Bestseller</FeatureBadge>}{((product as any).personalizationRequired || (product as any).personalizationEnabled || (product as any).personalizationFields?.length > 0) && <FeatureBadge>Made for them</FeatureBadge>}</div></div></div></td>
              <td className="px-6 py-4"><StatusBadge status={product.status} /></td><td className="px-6 py-4"><div className="relative h-12 w-28 overflow-hidden rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] shadow-sm"><CardDesignFrame value={product.bgImage} className="h-full w-full opacity-80" legacyClassName="h-full w-full object-cover opacity-80" /></div></td><td className="px-6 py-4 font-bold text-boutique-brown">${product.price.toFixed(2)}</td>
              <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2"><button type="button" onClick={() => setEditingProductId(product.id)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-boutique-brown/10 bg-white text-boutique-brown shadow-sm hover:bg-[#fff4df]" aria-label={`Edit ${product.name}`}><Edit className="h-4 w-4" /></button><button onClick={() => handleDelete(product)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 shadow-sm hover:bg-red-50" aria-label={`Delete ${product.name}`}><Trash className="h-4 w-4" /></button></div></td>
            </tr>)}
          </tbody>
        </table>
      </div>

      {isCreateOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2f1c13]/45 p-3 backdrop-blur-[5px] sm:p-6"><div onClickCapture={handleWizardClickCapture} className="relative max-h-[calc(100vh-1.5rem)] w-full max-w-[1240px] overflow-y-auto rounded-[2rem] border border-white/60 bg-[#fbf6ef] p-3 shadow-[0_35px_100px_rgba(45,28,18,0.34)] sm:max-h-[calc(100vh-3rem)] sm:p-5"><button type="button" onClick={closeCreate} className="absolute right-4 top-4 z-[120] inline-flex h-11 w-11 items-center justify-center rounded-full border border-boutique-brown/10 bg-white/95 text-boutique-brown shadow-md hover:bg-[#fff4df]" aria-label="Close add product"><X className="h-5 w-5" /></button><ProductCreateWizard /></div></div>}

      {editingProductId && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2f1c13]/45 p-3 backdrop-blur-[5px] sm:p-6"><div className="relative max-h-[calc(100vh-1.5rem)] w-full max-w-[1240px] overflow-y-auto rounded-[2rem] border border-white/60 bg-[#fbf6ef] p-3 shadow-[0_35px_100px_rgba(45,28,18,0.34)] sm:max-h-[calc(100vh-3rem)] sm:p-5"><button type="button" onClick={closeEdit} className="absolute right-4 top-4 z-[120] inline-flex h-11 w-11 items-center justify-center rounded-full border border-boutique-brown/10 bg-white/95 text-boutique-brown shadow-md hover:bg-[#fff4df]" aria-label="Close edit product"><X className="h-5 w-5" /></button><ProductEditWizard productId={editingProductId} onCancel={() => setEditingProductId(null)} onSaved={async () => { setEditingProductId(null); await loadProducts(); setNotice({ kind: 'success', title: 'Product updated', message: 'The product list now reflects your saved changes.' }); }} /></div></div>}

      {notice && <AdminNoticeDialog notice={notice} onClose={() => { setNotice(null); setConfirmAction(null); }} onConfirm={notice.kind === 'confirm' ? runConfirmation : undefined} />}
    </div>
  );
};
