import React, { useEffect, useMemo, useState } from 'react';
import { getAdminToken } from './adminAuth';
import { ProductWizardPage } from './ProductWizardPage';
import { WizardBasicsStep } from './WizardBasicsStep';
import { WizardMediaStep } from './WizardMediaStep';
import { WizardPricingStep } from './WizardPricingStep';
import { WizardDetailsStep } from './WizardDetailsStep';
import { WizardOrganizationStep } from './WizardOrganizationStep';
import { WizardCardStyleStep } from './WizardCardStyleStep';
import { WizardPersonalizationStep } from './WizardPersonalizationStep';
import { WizardReviewStep } from './WizardReviewStep';
import { validateProductWizardStep, validateProductWizardThrough, type ProductWizardDraft } from './productWizardDraft';
import { AdminNoticeDialog, type AdminNotice } from './AdminNoticeDialog';
import { DEFAULT_PRODUCT_FIELDS, type PersonalizationBuilderField } from './PersonalizationFieldBuilder';
import { encodeCardDesign, parseCardDesign } from '../utils/cardDesign';

type Category = { id: string; name: string };
type ApiProduct = Record<string, any>;

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

export const ProductEditWizard = ({ productId, onCancel, onSaved }: { productId: string; onCancel: () => void; onSaved: () => void | Promise<void> }) => {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ProductWizardDraft | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<null | (() => void)>(null);

  const update = (patch: Partial<ProductWizardDraft>) => setDraft((current) => current ? ({ ...current, ...patch }) : current);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/products/${productId}`, { headers: { Authorization: `Bearer ${getAdminToken()}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.details || data.error || 'Could not load product.');
        if (!cancelled) setDraft(productToDraft(data));
      } catch (error) {
        console.error(error);
        if (!cancelled) setNotice({ kind: 'error', title: 'Product could not be loaded', message: 'The editor was not opened.', issues: [(error as Error).message] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId]);

  useEffect(() => {
    if (step !== 5 || categories.length) return;
    (async () => {
      try {
        const response = await fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${getAdminToken()}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Categories could not be loaded.');
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setNotice({ kind: 'error', title: 'Categories could not be loaded', message: 'Try again before continuing.', issues: [(error as Error).message] });
      }
    })();
  }, [step, categories.length]);

  const categoryName = useMemo(() => categories.find((category) => category.id === draft?.categoryId)?.name || 'Current category', [categories, draft?.categoryId]);
  const showIssues = (targetStep: number, issues: string[]) => { setStep(targetStep); setNotice({ kind: 'error', title: `Complete step ${targetStep} first`, message: 'Every required field must be complete before you can move forward.', issues }); };

  const next = () => {
    if (!draft) return;
    const issues = validateProductWizardStep(draft, step);
    if (issues.length) return showIssues(step, issues);
    setStep((current) => Math.min(8, current + 1));
  };

  const changeStep = (targetStep: number) => {
    if (!draft) return;
    if (targetStep <= step) return setStep(targetStep);
    for (let candidate = 1; candidate < targetStep; candidate += 1) {
      const issues = validateProductWizardStep(draft, candidate);
      if (issues.length) return showIssues(candidate, issues);
    }
    setStep(targetStep);
  };

  const cancel = () => { setPendingConfirm(() => onCancel); setNotice({ kind: 'confirm', title: 'Close product editor?', message: 'Any unsaved changes will be discarded.' }); };

  const save = async () => {
    if (!draft) return;
    const allIssues = validateProductWizardThrough(draft, 7);
    if (allIssues.length) {
      for (let candidate = 1; candidate <= 7; candidate += 1) {
        const issues = validateProductWizardStep(draft, candidate);
        if (issues.length) return showIssues(candidate, issues);
      }
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
      setNotice({ kind: 'success', title: 'Product updated', message: 'Your changes are saved to the catalog.' });
    } catch (error) {
      console.error(error);
      setNotice({ kind: 'error', title: 'Product could not be updated', message: 'Nothing was changed. Fix the issue and try again.', issues: [(error as Error).message] });
    } finally {
      setSaving(false);
    }
  };

  const closeNotice = async () => {
    const wasSuccess = notice?.kind === 'success';
    setNotice(null);
    setPendingConfirm(null);
    if (wasSuccess) await onSaved();
  };

  const confirmNotice = () => {
    const action = pendingConfirm;
    setNotice(null);
    setPendingConfirm(null);
    action?.();
  };

  if (loading || !draft) return <div className="flex min-h-[420px] items-center justify-center rounded-[12px] border border-[#e2e2e2] bg-white text-sm font-medium text-[#777]">Loading product editor...</div>;

  const content = step === 1 ? <WizardBasicsStep draft={draft} update={update} />
    : step === 2 ? <WizardMediaStep images={draft.images} onImagesChange={(images) => update({ images })} />
    : step === 3 ? <WizardPricingStep draft={draft} update={update} />
    : step === 4 ? <WizardDetailsStep draft={draft} update={update} />
    : step === 5 ? <WizardOrganizationStep draft={draft} categories={categories} update={update} />
    : step === 6 ? <WizardCardStyleStep draft={draft} update={update} />
    : step === 7 ? <WizardPersonalizationStep draft={draft} update={update} />
    : <WizardReviewStep draft={draft} categoryName={categoryName} />;

  return <>
    <ProductWizardPage step={step} onCancel={cancel} onBack={() => setStep((current) => Math.max(1, current - 1))} onNext={next} onStepChange={changeStep} finalAction={<button type="button" onClick={save} disabled={saving} className="commerce-focus min-h-10 rounded-[8px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50">{saving ? 'Updating...' : 'Update Product'}</button>}>
      {content}
    </ProductWizardPage>
    {notice && <AdminNoticeDialog notice={notice} onClose={closeNotice} onConfirm={notice.kind === 'confirm' ? confirmNotice : undefined} />}
  </>;
};
