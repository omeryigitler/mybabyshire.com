import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductWizardHeader, PRODUCT_WIZARD_STEPS } from './ProductWizardHeader';

export const ProductWizardPage = ({ step, children, onCancel, onBack, onNext, onStepChange, finalAction }: { step: number; children: React.ReactNode; onCancel: () => void; onBack: () => void; onNext: () => void; onStepChange: (step: number) => void; finalAction?: React.ReactNode }) => (
  <div className="space-y-6 pb-12">
    <ProductWizardHeader step={step} editing={false} onBackToProducts={onCancel} onStepChange={onStepChange} />
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-boutique-brown/10 bg-white/92 p-5 shadow-[0_22px_60px_rgba(58,37,26,0.07)] md:p-8">{children}</div>
    <div className="sticky bottom-4 z-30 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-[1.5rem] border border-boutique-brown/10 bg-white/95 p-3 shadow-[0_18px_50px_rgba(58,37,26,0.14)] backdrop-blur-md">
      <button type="button" onClick={step === 1 ? onCancel : onBack} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-5 py-3 text-sm font-bold text-boutique-brown"><ChevronLeft className="h-4 w-4" /> {step === 1 ? 'Cancel' : 'Back'}</button>
      <span className="hidden text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/40 sm:block">{step} / {PRODUCT_WIZARD_STEPS.length}</span>
      {step < PRODUCT_WIZARD_STEPS.length ? <button type="button" onClick={onNext} className="inline-flex items-center gap-2 rounded-full bg-boutique-brown px-6 py-3 text-sm font-bold text-white shadow-sm">Next <ChevronRight className="h-4 w-4" /></button> : finalAction}
    </div>
  </div>
);
