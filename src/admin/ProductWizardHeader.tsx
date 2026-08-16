import React from 'react';
import { Check, ChevronLeft } from 'lucide-react';

export const PRODUCT_WIZARD_STEPS = ['Basics', 'Media', 'Pricing', 'Details', 'Organization', 'Card Style', 'Made-for-you Fields', 'Review'] as const;

export const ProductWizardHeader = ({ step, editing, onBackToProducts, onStepChange }: { step: number; editing: boolean; onBackToProducts: () => void; onStepChange: (step: number) => void }) => (
  <div className="rounded-[12px] border border-[#e2e2e2] bg-white p-5 sm:p-6">
    <button type="button" onClick={onBackToProducts} className="commerce-focus mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#666] hover:text-[#202020]"><ChevronLeft className="h-4 w-4" /> Products</button>
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Step {step} of {PRODUCT_WIZARD_STEPS.length}</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[#202020] sm:text-3xl">{PRODUCT_WIZARD_STEPS[step - 1]}</h1>
      </div>
      <span className="w-fit rounded-full bg-[#f2f2f2] px-3 py-1.5 text-[11px] font-semibold text-[#666]">{editing ? 'Edit product' : 'Add product'}</span>
    </div>

    <div className="mt-5 h-1 overflow-hidden rounded-full bg-[#ededed]"><div className="h-full rounded-full bg-[#202020] transition-all" style={{ width: `${(step / PRODUCT_WIZARD_STEPS.length) * 100}%` }} /></div>

    <div className="hide-scrollbar mt-4 flex gap-1.5 overflow-x-auto pb-1">
      {PRODUCT_WIZARD_STEPS.map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const complete = number < step;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onStepChange(number)}
            className={`commerce-focus inline-flex min-w-fit items-center gap-1.5 rounded-[8px] border px-2.5 py-2 text-[10px] font-semibold transition-colors ${active ? 'border-[#202020] bg-[#202020] text-white' : complete ? 'border-[#d8d8d8] bg-[#f7f7f7] text-[#444]' : 'border-[#e5e5e5] bg-white text-[#888] hover:border-[#bbb]'}`}
          >
            {complete ? <Check className="h-3.5 w-3.5" /> : <span>{number}</span>}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  </div>
);
