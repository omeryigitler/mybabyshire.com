import { useEffect, useState } from 'react';
import { clearProductWizardDraft, readProductWizardDraft, writeProductWizardDraft, type ProductWizardDraft } from './productWizardDraft';

export const useProductWizardState = () => {
  const [draft, setDraft] = useState<ProductWizardDraft>(() => readProductWizardDraft());

  useEffect(() => { writeProductWizardDraft(draft); }, [draft]);

  const update = (patch: Partial<ProductWizardDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const clear = () => clearProductWizardDraft();

  return { draft, update, clear };
};
