import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
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
import { useProductWizardState } from './useProductWizardState';
import { saveProductWizardDraft } from './saveProductWizardDraft';

type Category = { id: string; name: string };

export const ProductCreateWizard = () => {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const { draft, update, clear } = useProductWizardState();
  const { addProduct } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (step !== 5 || categories.length) return;
    (async () => {
      try {
        const response = await fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${getAdminToken()}` } });
        const data = await response.json();
        if (response.ok) setCategories(Array.isArray(data) ? data : []);
      } catch (error) { console.error(error); }
    })();
  }, [step, categories.length]);

  const categoryName = useMemo(() => categories.find((category) => category.id === draft.categoryId)?.name || 'No category', [categories, draft.categoryId]);

  const validate = () => {
    if (step === 1 && (!draft.name.trim() || !draft.description.trim())) return 'Add a product name and description.';
    if (step === 2 && !draft.images.length) return 'Upload one product image.';
    if (step === 3 && (!draft.price || Number(draft.price) <= 0)) return 'Enter a valid product price.';
    return '';
  };

  const next = () => {
    const error = validate();
    if (error) return alert(error);
    setStep((current) => Math.min(8, current + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => {
    if (confirm('Discard this product draft?')) { clear(); navigate('/admin/products'); }
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.description.trim() || !draft.images.length || !draft.price) return alert('Name, description, image and price are required.');
    setSaving(true);
    try {
      const products = await saveProductWizardDraft(draft);
      products.forEach(addProduct);
      clear();
      alert('Product saved successfully.');
      navigate('/admin/products');
    } catch (error) { console.error(error); alert((error as Error).message); }
    finally { setSaving(false); }
  };

  const content = step === 1 ? <WizardBasicsStep draft={draft} update={update} />
    : step === 2 ? <WizardMediaStep images={draft.images} onImagesChange={(images) => update({ images })} />
    : step === 3 ? <WizardPricingStep draft={draft} update={update} />
    : step === 4 ? <WizardDetailsStep draft={draft} update={update} />
    : step === 5 ? <WizardOrganizationStep draft={draft} categories={categories} update={update} />
    : step === 6 ? <WizardCardStyleStep draft={draft} update={update} />
    : step === 7 ? <WizardPersonalizationStep draft={draft} update={update} />
    : <WizardReviewStep draft={draft} categoryName={categoryName} />;

  return <ProductWizardPage step={step} onCancel={cancel} onBack={() => setStep((current) => Math.max(1, current - 1))} onNext={next} onStepChange={setStep} finalAction={<button type="button" onClick={save} disabled={saving} className="rounded-full bg-boutique-brown px-6 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Product'}</button>}>{content}</ProductWizardPage>;
};
