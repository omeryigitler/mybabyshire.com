import React from 'react';
import { Sparkles } from 'lucide-react';
import { PersonalizationFieldBuilder } from './PersonalizationFieldBuilder';
import type { ProductWizardDraft } from './productWizardDraft';
import { WizardSwitch } from './productWizardUi';

export const WizardPersonalizationStep = ({ draft, update }: { draft: ProductWizardDraft; update: (patch: Partial<ProductWizardDraft>) => void }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between rounded-[1.3rem] bg-[#fffaf3] p-4"><div><p className="text-sm font-bold text-boutique-brown">Collect made-for-you details</p><p className="mt-1 text-xs leading-relaxed text-boutique-brown-light">Ask for the information needed to prepare this order.</p></div><WizardSwitch checked={draft.personalizationRequired} onClick={() => update({ personalizationRequired: !draft.personalizationRequired })} /></div>
    <div className="flex gap-3 rounded-[1.3rem] border border-boutique-brown/10 bg-white p-4 text-sm text-boutique-brown-light"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-boutique-brown" /><p>Names, dates, colors and other answers are collected as order information only. The site will not draw these answers onto the product photo.</p></div>
    {draft.personalizationRequired && <PersonalizationFieldBuilder fields={draft.personalizationFields} onFieldsChange={(fields) => update({ personalizationFields: fields })} />}
  </div>
);
