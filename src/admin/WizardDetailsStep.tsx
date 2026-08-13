import React from 'react';
import type { ProductWizardDraft } from './productWizardDraft';
import { WizardFieldLabel, wizardInputClass } from './productWizardUi';

export const WizardDetailsStep = ({ draft, update }: { draft: ProductWizardDraft; update: (patch: Partial<ProductWizardDraft>) => void }) => (
  <div className="grid gap-5 md:grid-cols-2">
    <div><WizardFieldLabel>Age range</WizardFieldLabel><input value={draft.ageRange} onChange={(event) => update({ ageRange: event.target.value })} className={wizardInputClass} placeholder="Newborn to 3-6 months" /></div>
    <div><WizardFieldLabel>Material</WizardFieldLabel><input value={draft.material} onChange={(event) => update({ material: event.target.value })} className={wizardInputClass} placeholder="Cotton, tulle, wood..." /></div>
    <div className="md:col-span-2"><WizardFieldLabel>Preparation time</WizardFieldLabel><input value={draft.preparationTime} onChange={(event) => update({ preparationTime: event.target.value })} className={wizardInputClass} placeholder="3-5 business days" /></div>
    <div className="md:col-span-2"><WizardFieldLabel>Care instructions</WizardFieldLabel><textarea rows={5} value={draft.careInstructions} onChange={(event) => update({ careInstructions: event.target.value })} className={wizardInputClass} placeholder="Care and safety instructions" /></div>
  </div>
);
