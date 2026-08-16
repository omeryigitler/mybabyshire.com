import React, { useEffect, useState } from 'react';
import { ChevronDown, Save, X } from 'lucide-react';
import { getAdminToken } from './adminAuth';
import { WizardBasicsStep } from './WizardBasicsStep';
import { WizardMediaStep } from './WizardMediaStep';
import { WizardPricingStep } from './WizardPricingStep';
import { WizardDetailsStep } from './WizardDetailsStep';
import { WizardOrganizationStep } from './WizardOrganizationStep';
import { WizardPersonalizationStep } from './WizardPersonalizationStep';
import { useProductWizardState } from './useProductWizardState';
import { saveProductWizardDraft } from './saveProductWizardDraft';
import { validateProductWizardStep } from './productWizardDraft';
import { AdminNoticeDialog, type AdminNotice } from './AdminNoticeDialog';

type Category = { id: string; name: string };

const validationSteps = [1, 2, 3, 4, 5, 7];

const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <section className="rounded-[12px] border border-[#e2e2e2] bg-white p-4 sm:p-6">
    <div className="mb-5 border-b border-[#eeeeee] pb-4">
      <h2 className="text-lg font-semibold tracking-[-0.015em] text-[#202020]">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-[#777]">{description}</p>}
    </div>
    {children}
  </section>
);

export const ProductCreateWizard = ({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void | Promise<void> }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { draft, update, clear } = useProductWizardState();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${getAdminToken()}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Categories could not be loaded.');
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) setNotice({ kind: 'error', title: 'Categories could not be loaded', message: 'Reload the editor and try again.', issues: [(error as Error).message] });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    const issues = validationSteps.flatMap((step) => validateProductWizardStep(draft, step));
    if (issues.length) {
      setNotice({ kind: 'error', title: 'Product is not ready to save', message: 'Complete the required product information first.', issues });
      return;
    }

    setSaving(true);
    try {
      await saveProductWizardDraft(draft);
      clear();
      await onSaved();
    } catch (error) {
      setNotice({ kind: 'error', title: 'Product could not be saved', message: 'Nothing was published.', issues: [(error as Error).message] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="sticky top-0 z-30 flex flex-col gap-4 rounded-[12px] border border-[#e2e2e2] bg-white/95 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Catalog</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-[#202020]">Add product</h1>
          <p className="mt-1 text-sm text-[#777]">Create the product here. Manage Color × Size inventory from Inventory after saving.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="commerce-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-semibold hover:bg-[#f7f7f7]"><X className="h-4 w-4" /> Cancel</button>
          <button type="button" onClick={() => void save()} disabled={saving} className="commerce-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save product'}</button>
        </div>
      </div>

      <Section title="Product information" description="Customer-facing title and description."><WizardBasicsStep draft={draft} update={update} /></Section>
      <Section title="Media" description="Use a clean primary product image. Additional variant imagery can be managed as the catalog grows."><WizardMediaStep images={draft.images} onImagesChange={(images) => update({ images })} /></Section>
      <Section title="Pricing & base stock" description="Base price and SKU. For products with Color × Size variants, manage exact stock in Inventory."><WizardPricingStep draft={draft} update={update} /></Section>
      <Section title="Product details" description="Material, sizing guidance, care and preparation details."><WizardDetailsStep draft={draft} update={update} /></Section>
      <Section title="Organization & visibility" description="Choose category, storefront status and merchandising badge."><WizardOrganizationStep draft={draft} categories={categories} update={update} /></Section>

      <section className="overflow-hidden rounded-[12px] border border-[#e2e2e2] bg-white">
        <button type="button" onClick={() => setAdvancedOpen((open) => !open)} className="commerce-focus flex w-full items-center justify-between gap-4 p-4 text-left sm:p-6" aria-expanded={advancedOpen}>
          <div><h2 className="text-lg font-semibold tracking-[-0.015em] text-[#202020]">Advanced customization</h2><p className="mt-1 text-sm leading-6 text-[#777]">Optional customer-input fields for products that require names, dates or other custom information.</p></div>
          <ChevronDown className={`h-5 w-5 shrink-0 text-[#777] transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
        </button>
        {advancedOpen && <div className="border-t border-[#eeeeee] p-4 sm:p-6"><WizardPersonalizationStep draft={draft} update={update} /></div>}
      </section>

      {notice && <AdminNoticeDialog notice={notice} onClose={() => setNotice(null)} />}
    </div>
  );
};
