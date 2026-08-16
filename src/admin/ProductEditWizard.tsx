import React, { useEffect, useState } from 'react';
import { ChevronDown, Save, X } from 'lucide-react';
import { getAdminToken } from './adminAuth';
import { WizardBasicsStep } from './WizardBasicsStep';
import { WizardMediaStep } from './WizardMediaStep';
import { WizardPricingStep } from './WizardPricingStep';
import { WizardDetailsStep } from './WizardDetailsStep';
import { WizardOrganizationStep } from './WizardOrganizationStep';
import { WizardPersonalizationStep } from './WizardPersonalizationStep';
import { validateProductWizardStep, type ProductWizardDraft } from './productWizardDraft';
import { AdminNoticeDialog, type AdminNotice } from './AdminNoticeDialog';
import { DEFAULT_PRODUCT_FIELDS, type PersonalizationBuilderField } from './PersonalizationFieldBuilder';
import { encodeCardDesign, parseCardDesign } from '../utils/cardDesign';

type Category = { id: string; name: string };
type ApiProduct = Record<string, any>;

const validationSteps = [1, 2, 3, 4, 5, 7];

const normalizeFields = (fields: any[]): PersonalizationBuilderField[] => {
  if (!Array.isArray(fields) || !fields.length) return DEFAULT_PRODUCT_FIELDS.map((field) => ({ ...field, options: field.options ? [...field.options] : undefined }));
  return fields.map((field, index) => ({
    id: String(field.id || field.fieldKey || `field-${index}`),
    fieldKey: String(field.fieldKey || '').trim(),
    type: ['text', 'color', 'select', 'date'].includes(field.type) ? field.type : 'text',
    label: String(field.label || '').trim(),
    placeholder: field.placeholder || '',
    helpText: field.helpText || '',
    maxLength: field.maxLength ?? null,
    options: Array.isArray(field.options) ? field.options.map(String).filter(Boolean) : [],
    required: Boolean(field.required),
  })) as PersonalizationBuilderField[];
};

const productToDraft = (product: ApiProduct): ProductWizardDraft => {
  const design = parseCardDesign(product.bgImage);
  return {
    name: product.name || '', description: product.description || '', images: product.imageUrl ? [{ url: product.imageUrl, publicId: product.publicId, id: product.id }] : [],
    price: product.price != null ? String(product.price) : '', salePrice: product.salePrice != null ? String(product.salePrice) : '', sku: product.sku || '', stockQuantity: String(product.stockQuantity ?? 0),
    ageRange: product.ageRange || '', material: product.material || '', preparationTime: product.preparationTime || '', careInstructions: product.careInstructions || '', categoryId: product.categoryId || '',
    status: product.status === 'draft' ? 'draft' : 'active', promotionBadge: product.bestseller ? 'bestseller' : product.newArrival ? 'newArrival' : product.featured ? 'featured' : 'none',
    cloudShape: design.cloud, panelShape: design.panel, cardColor: design.color, createCloudVariants: false,
    personalizationRequired: Boolean(product.personalizationRequired), personalizationFields: normalizeFields(product.personalizationFields),
  };
};

const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <section className="rounded-[12px] border border-[#e2e2e2] bg-white p-4 sm:p-6">
    <div className="mb-5 border-b border-[#eeeeee] pb-4">
      <h2 className="text-lg font-semibold tracking-[-0.015em] text-[#202020]">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-[#777]">{description}</p>}
    </div>
    {children}
  </section>
);

export const ProductEditWizard = ({ productId, onCancel, onSaved }: { productId: string; onCancel: () => void; onSaved: () => void | Promise<void> }) => {
  const [draft, setDraft] = useState<ProductWizardDraft | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const update = (patch: Partial<ProductWizardDraft>) => setDraft((current) => current ? ({ ...current, ...patch }) : current);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const token = getAdminToken();
        const [productResponse, categoryResponse] = await Promise.all([
          fetch(`/api/admin/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const productData = await productResponse.json();
        const categoryData = await categoryResponse.json();
        if (!productResponse.ok) throw new Error(productData.details || productData.error || 'Could not load product.');
        if (!categoryResponse.ok) throw new Error(categoryData.details || categoryData.error || 'Could not load categories.');
        if (!cancelled) {
          const nextDraft = productToDraft(productData);
          setDraft(nextDraft);
          setAdvancedOpen(nextDraft.personalizationRequired);
          setCategories(Array.isArray(categoryData) ? categoryData : []);
        }
      } catch (error) {
        if (!cancelled) setNotice({ kind: 'error', title: 'Product could not be loaded', message: 'The editor could not load the catalog data.', issues: [(error as Error).message] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId]);

  const save = async () => {
    if (!draft) return;
    const issues = validationSteps.flatMap((step) => validateProductWizardStep(draft, step));
    if (issues.length) {
      setNotice({ kind: 'error', title: 'Product is not ready to save', message: 'Complete the required product information first.', issues });
      return;
    }

    setSaving(true);
    try {
      const bgImage = encodeCardDesign({ cloud: draft.cloudShape, panel: draft.panelShape, color: draft.cardColor });
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({
          name: draft.name.trim(), description: draft.description.trim(), price: Number(draft.price), salePrice: draft.salePrice ? Number(draft.salePrice) : null,
          imageUrl: draft.images[0]?.url, publicId: draft.images[0]?.publicId, bgImage,
          sku: draft.sku.trim(), stockQuantity: Number(draft.stockQuantity) || 0, categoryId: draft.categoryId || null, status: draft.status,
          featured: draft.promotionBadge === 'featured', newArrival: draft.promotionBadge === 'newArrival', bestseller: draft.promotionBadge === 'bestseller',
          ageRange: draft.ageRange.trim(), material: draft.material.trim(), careInstructions: draft.careInstructions.trim(), preparationTime: draft.preparationTime.trim(),
          personalizationRequired: draft.personalizationRequired, personalizationFields: draft.personalizationRequired ? draft.personalizationFields : [],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Product update failed.');
      await onSaved();
    } catch (error) {
      setNotice({ kind: 'error', title: 'Product could not be updated', message: 'Nothing was changed.', issues: [(error as Error).message] });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) return <div className="flex min-h-[420px] items-center justify-center rounded-[12px] border border-[#e2e2e2] bg-white text-sm font-medium text-[#777]">Loading product editor...</div>;

  return (
    <div className="space-y-4 pb-24">
      <div className="sticky top-0 z-30 flex flex-col gap-4 rounded-[12px] border border-[#e2e2e2] bg-white/95 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Catalog</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-[#202020]">Edit product</h1>
          <p className="mt-1 max-w-xl truncate text-sm text-[#777]">{draft.name || 'Product'} · Variant stock is managed from Inventory.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="commerce-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-semibold hover:bg-[#f7f7f7]"><X className="h-4 w-4" /> Cancel</button>
          <button type="button" onClick={() => void save()} disabled={saving} className="commerce-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>

      <Section title="Product information" description="Customer-facing title and description."><WizardBasicsStep draft={draft} update={update} /></Section>
      <Section title="Media" description="Primary product photography shown across the storefront."><WizardMediaStep images={draft.images} onImagesChange={(images) => update({ images })} /></Section>
      <Section title="Pricing & base stock" description="Base price and SKU. Use Inventory for exact Color × Size stock and optional variant pricing."><WizardPricingStep draft={draft} update={update} /></Section>
      <Section title="Product details" description="Material, sizing guidance, care and preparation details."><WizardDetailsStep draft={draft} update={update} /></Section>
      <Section title="Organization & visibility" description="Category, storefront status and merchandising badge."><WizardOrganizationStep draft={draft} categories={categories} update={update} /></Section>

      <section className="overflow-hidden rounded-[12px] border border-[#e2e2e2] bg-white">
        <button type="button" onClick={() => setAdvancedOpen((open) => !open)} className="commerce-focus flex w-full items-center justify-between gap-4 p-4 text-left sm:p-6" aria-expanded={advancedOpen}>
          <div><h2 className="text-lg font-semibold tracking-[-0.015em] text-[#202020]">Advanced customization</h2><p className="mt-1 text-sm leading-6 text-[#777]">Optional customer-input fields. Leave disabled for standard blank apparel.</p></div>
          <ChevronDown className={`h-5 w-5 shrink-0 text-[#777] transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
        </button>
        {advancedOpen && <div className="border-t border-[#eeeeee] p-4 sm:p-6"><WizardPersonalizationStep draft={draft} update={update} /></div>}
      </section>

      {notice && <AdminNoticeDialog notice={notice} onClose={() => setNotice(null)} />}
    </div>
  );
};
