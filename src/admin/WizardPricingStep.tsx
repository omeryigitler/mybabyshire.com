import React from 'react';
import type { ProductWizardDraft } from './productWizardDraft';
import { WizardFieldLabel, wizardInputClass } from './productWizardUi';

export const WizardPricingStep = ({ draft, update }: { draft: ProductWizardDraft; update: (patch: Partial<ProductWizardDraft>) => void }) => (
  <div className="grid gap-5 md:grid-cols-2">
    <div><WizardFieldLabel>Price USD</WizardFieldLabel><input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => update({ price: event.target.value })} className={wizardInputClass} placeholder="18.00" /></div>
    <div><WizardFieldLabel>Compare at price</WizardFieldLabel><input type="number" min="0" step="0.01" value={draft.salePrice} onChange={(event) => update({ salePrice: event.target.value })} className={wizardInputClass} placeholder="Optional" /></div>
    <div><WizardFieldLabel>Base SKU</WizardFieldLabel><input value={draft.sku} onChange={(event) => update({ sku: event.target.value })} className={wizardInputClass} placeholder="MBS-BLANK-001" /></div>
    <div><WizardFieldLabel>Base stock quantity</WizardFieldLabel><input type="number" min="0" value={draft.stockQuantity} onChange={(event) => update({ stockQuantity: event.target.value })} className={wizardInputClass} placeholder="0" /></div>
  </div>
);
