import React from 'react';
import type { ProductWizardDraft } from './productWizardDraft';
import { WizardFieldLabel, wizardInputClass } from './productWizardUi';

export const WizardBasicsStep = ({ draft, update }: { draft: ProductWizardDraft; update: (patch: Partial<ProductWizardDraft>) => void }) => (
  <div className="space-y-5">
    <div><WizardFieldLabel>Product name</WizardFieldLabel><input value={draft.name} onChange={(event) => update({ name: event.target.value })} className={wizardInputClass} placeholder="Premium Cotton Baby Tee" /></div>
    <div><WizardFieldLabel>Description</WizardFieldLabel><textarea rows={7} value={draft.description} onChange={(event) => update({ description: event.target.value })} className={wizardInputClass} placeholder="Describe the garment, fit, fabric and what customers should know before ordering." /></div>
  </div>
);
