import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductWizardHeader, PRODUCT_WIZARD_STEPS } from './ProductWizardHeader';

export const ProductWizardPage = ({ step, children, onCancel, onBack, onNext, onStepChange, finalAction }: { step: number; children: React.ReactNode; onCancel: () => void; onBack: () => void; onNext: () => void; onStepChange: (step: number) => void; finalAction?: React.ReactNode }) => (
  <div className="space-y-4 pb-4">
    <ProductWizardHeader step={step} editing={false} onBackToProducts={onCancel} onStepChange={onStepChange} />
    <div className="mx-auto w-full rounded-[12px] border border-[#e2e2e2] bg-white p-4 sm:p-6 lg:p-7">{children}</div>
    <div className="sticky bottom-2 z-30 mx-auto flex w-full items-center justify-between gap-3 rounded-[11px] border border-[#dedede] bg-white/95 p-2.5 shadow-lg backdrop-blur-md">
      <button type="button" onClick={step === 1 ? onCancel : onBack} className="commerce-focus inline-flex min-h-10 items-center gap-1.5 rounded-[8px] border border-[#dedede] bg-white px-4 text-sm font-semibold text-[#444] hover:bg-[#f7f7f7]"><ChevronLeft className="h-4 w-4" /> {step === 1 ? 'Cancel' : 'Back'}</button>
      <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-[#999] sm:block">{step} / {PRODUCT_WIZARD_STEPS.length}</span>
      {step < PRODUCT_WIZARD_STEPS.length
        ? <button type="button" onClick={onNext} className="commerce-focus inline-flex min-h-10 items-center gap-1.5 rounded-[8px] bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-[#383838]">Next <ChevronRight className="h-4 w-4" /></button>
        : finalAction}
    </div>
  </div>
);
