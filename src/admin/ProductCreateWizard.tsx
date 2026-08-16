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
import { validateProductWizardStep, validateProductWizardThrough } from './productWizardDraft';
import { AdminNoticeDialog, type AdminNotice } from './AdminNoticeDialog';

type Category = { id: string; name: string };

export const ProductCreateWizard = () => {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<null | (() => void)>(null);
  const [navigateAfterNotice, setNavigateAfterNotice] = useState(false);
  const { draft, update, clear } = useProductWizardState();
  const { addProduct } = useStore();
  const navigate = useNavigate();

  const showIssues = (targetStep: number, issues: string[]) => {
    setStep(targetStep);
    setNotice({ kind: 'error', title: `Complete step ${targetStep} first`, message: 'Every required field must be complete before you can move forward.', issues });
  };

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
        setNotice({ kind: 'error', title: 'Categories could not be loaded', message: 'Nothing was changed. Try again before continuing.', issues: [(error as Error).message] });
      }
    })();
  }, [step, categories.length]);

  const categoryName = useMemo(() => categories.find((category) => category.id === draft.categoryId)?.name || 'No category', [categories, draft.categoryId]);

  const next = () => {
    const issues = validateProductWizardStep(draft, step);
    if (issues.length) return showIssues(step, issues);
    setStep((current) => Math.min(8, current + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeStep = (targetStep: number) => {
    if (targetStep <= step) return setStep(targetStep);
    for (let candidate = 1; candidate < targetStep; candidate += 1) {
      const issues = validateProductWizardStep(draft, candidate);
      if (issues.length) return showIssues(candidate, issues);
    }
    setStep(targetStep);
  };

  const discard = () => { clear(); navigate('/admin/products'); };

  const cancel = () => {
    const hasProgress = Boolean(draft.name.trim() || draft.description.trim() || draft.images.length || draft.price || draft.ageRange.trim() || draft.material.trim() || draft.preparationTime.trim() || draft.careInstructions.trim() || draft.categoryId);
    if (!hasProgress) return discard();
    setPendingConfirm(() => discard);
    setNotice({ kind: 'confirm', title: 'Discard this product draft?', message: 'All information entered in the product editor will be cleared.' });
  };

  const save = async () => {
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
      const products = await saveProductWizardDraft(draft);
      products.forEach(addProduct);
      clear();
      setNavigateAfterNotice(true);
      setNotice({ kind: 'success', title: 'Product saved', message: 'The product is now stored in the catalog.' });
    } catch (error) {
      console.error(error);
      setNotice({ kind: 'error', title: 'Product could not be saved', message: 'Nothing was published. Fix the issue and try again.', issues: [(error as Error).message] });
    } finally {
      setSaving(false);
    }
  };

  const closeNotice = () => {
    setNotice(null);
    setPendingConfirm(null);
    if (navigateAfterNotice) { setNavigateAfterNotice(false); navigate('/admin/products'); }
  };

  const confirmNotice = () => {
    const action = pendingConfirm;
    setNotice(null);
    setPendingConfirm(null);
    action?.();
  };

  const content = step === 1 ? <WizardBasicsStep draft={draft} update={update} />
    : step === 2 ? <WizardMediaStep images={draft.images} onImagesChange={(images) => update({ images })} />
    : step === 3 ? <WizardPricingStep draft={draft} update={update} />
    : step === 4 ? <WizardDetailsStep draft={draft} update={update} />
    : step === 5 ? <WizardOrganizationStep draft={draft} categories={categories} update={update} />
    : step === 6 ? <WizardCardStyleStep draft={draft} update={update} />
    : step === 7 ? <WizardPersonalizationStep draft={draft} update={update} />
    : <WizardReviewStep draft={draft} categoryName={categoryName} />;

  return <>
    <ProductWizardPage step={step} onCancel={cancel} onBack={() => setStep((current) => Math.max(1, current - 1))} onNext={next} onStepChange={changeStep} finalAction={<button type="button" onClick={save} disabled={saving} className="commerce-focus min-h-10 rounded-[8px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50">{saving ? 'Saving...' : 'Save Product'}</button>}>
      {content}
    </ProductWizardPage>
    {notice && <AdminNoticeDialog notice={notice} onClose={closeNotice} onConfirm={notice.kind === 'confirm' ? confirmNotice : undefined} />}
  </>;
};
