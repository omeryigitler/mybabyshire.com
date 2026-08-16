import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { PersonalizationFieldBuilder } from './PersonalizationFieldBuilder';
import type { ProductWizardDraft } from './productWizardDraft';
import { WizardSwitch } from './productWizardUi';

export const WizardPersonalizationStep = ({ draft, update }: { draft: ProductWizardDraft; update: (patch: Partial<ProductWizardDraft>) => void }) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between gap-4 rounded-[11px] border border-[#e5e5e5] bg-[#fafafa] p-4">
      <div>
        <p className="text-sm font-semibold text-[#202020]">Require customization details</p>
        <p className="mt-1 text-xs leading-5 text-[#777]">Enable only when the customer must provide a name, date, color choice or other custom order information.</p>
      </div>
      <WizardSwitch checked={draft.personalizationRequired} onClick={() => update({ personalizationRequired: !draft.personalizationRequired })} />
    </div>
    <div className="flex gap-3 rounded-[11px] border border-[#e5e5e5] bg-white p-4 text-sm leading-6 text-[#707070]"><SlidersHorizontal className="mt-0.5 h-5 w-5 shrink-0 text-[#555]" /><p>Standard blank apparel should leave this disabled. Color and size inventory belong in the Inventory page, not in customization fields.</p></div>
    {draft.personalizationRequired && <PersonalizationFieldBuilder fields={draft.personalizationFields} onFieldsChange={(fields) => update({ personalizationFields: fields })} />}
  </div>
);
