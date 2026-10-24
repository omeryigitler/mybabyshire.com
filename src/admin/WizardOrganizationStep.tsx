import React from 'react';
import type { ProductWizardDraft } from './productWizardDraft';
import { CatalogSelect } from './CatalogSelect';
import { WizardChoice, WizardFieldLabel } from './productWizardUi';

type Category = { id: string; name: string };

export const WizardOrganizationStep = ({ draft, categories, update, lockDraft = false }: { draft: ProductWizardDraft; categories: Category[]; update: (patch: Partial<ProductWizardDraft>) => void; lockDraft?: boolean }) => (
  <div className="grid gap-6 lg:grid-cols-2">
    <div><WizardFieldLabel>Category</WizardFieldLabel><CatalogSelect value={draft.categoryId} label="Kategori seç" className="w-full" options={[{ value: "", label: "Kategori seç…" }, ...categories.map(category => ({ value: category.id, label: category.name }))]} onChange={(value) => update({ categoryId: value })} /></div>
    <div><WizardFieldLabel>Status</WizardFieldLabel>{lockDraft ? <p className="rounded-lg border border-[#eee] bg-[#fafafa] p-3 text-sm text-[#666]">Taslak · Yayına alma işlemi Site Önizleme &amp; Yayın Kuyruğu ekranından yapılır.</p> : <div className="grid grid-cols-2 gap-2"><WizardChoice active={draft.status === 'active'} label="Active" onClick={() => update({ status: 'active' })} /><WizardChoice active={draft.status === 'draft'} label="Draft" onClick={() => update({ status: 'draft' })} /></div>}</div>
    <div className="lg:col-span-2"><WizardFieldLabel>Promotion badge</WizardFieldLabel><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><WizardChoice active={draft.promotionBadge === 'none'} label="None" onClick={() => update({ promotionBadge: 'none' })} /><WizardChoice active={draft.promotionBadge === 'featured'} label="Featured" onClick={() => update({ promotionBadge: 'featured' })} /><WizardChoice active={draft.promotionBadge === 'newArrival'} label="New arrival" onClick={() => update({ promotionBadge: 'newArrival' })} /><WizardChoice active={draft.promotionBadge === 'bestseller'} label="Bestseller" onClick={() => update({ promotionBadge: 'bestseller' })} /></div></div>
  </div>
);
