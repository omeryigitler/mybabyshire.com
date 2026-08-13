import React from 'react';
import type { ProductWizardDraft } from './productWizardDraft';
import { WizardChoice, WizardFieldLabel, wizardInputClass } from './productWizardUi';

type Category = { id: string; name: string };

export const WizardOrganizationStep = ({ draft, categories, update }: { draft: ProductWizardDraft; categories: Category[]; update: (patch: Partial<ProductWizardDraft>) => void }) => (
  <div className="grid gap-6 lg:grid-cols-2">
    <div><WizardFieldLabel>Category</WizardFieldLabel><select value={draft.categoryId} onChange={(event) => update({ categoryId: event.target.value })} className={wizardInputClass}><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
    <div><WizardFieldLabel>Status</WizardFieldLabel><div className="grid grid-cols-2 gap-2"><WizardChoice active={draft.status === 'active'} label="Active" onClick={() => update({ status: 'active' })} /><WizardChoice active={draft.status === 'draft'} label="Draft" onClick={() => update({ status: 'draft' })} /></div></div>
    <div className="lg:col-span-2"><WizardFieldLabel>Promotion badge</WizardFieldLabel><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><WizardChoice active={draft.promotionBadge === 'none'} label="None" onClick={() => update({ promotionBadge: 'none' })} /><WizardChoice active={draft.promotionBadge === 'featured'} label="Featured" onClick={() => update({ promotionBadge: 'featured' })} /><WizardChoice active={draft.promotionBadge === 'newArrival'} label="New arrival" onClick={() => update({ promotionBadge: 'newArrival' })} /><WizardChoice active={draft.promotionBadge === 'bestseller'} label="Bestseller" onClick={() => update({ promotionBadge: 'bestseller' })} /></div></div>
  </div>
);
