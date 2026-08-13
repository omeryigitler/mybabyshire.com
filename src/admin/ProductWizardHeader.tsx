import React from 'react';
import { Check, ChevronLeft } from 'lucide-react';

export const PRODUCT_WIZARD_STEPS = ['Basics', 'Media', 'Pricing', 'Details', 'Organization', 'Card Style', 'Made-for-you Fields', 'Review'] as const;

export const ProductWizardHeader = ({ step, editing, onBackToProducts, onStepChange }: { step: number; editing: boolean; onBackToProducts: () => void; onStepChange: (step: number) => void }) => (
  <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/90 p-6 shadow-[0_22px_60px_rgba(58,37,26,0.08)] backdrop-blur-sm md:p-8">
    <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-16 -top-16 w-64 opacity-25 mix-blend-multiply" alt="" />
    <div className="relative z-10">
      <button type="button" onClick={onBackToProducts} className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light hover:text-boutique-brown"><ChevronLeft className="h-4 w-4" /> Products</button>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-boutique-brown/45">Step {step} of {PRODUCT_WIZARD_STEPS.length}</p><h1 className="mt-2 font-serif text-4xl text-boutique-brown md:text-5xl">{PRODUCT_WIZARD_STEPS[step - 1]}</h1></div>
        <span className="rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold text-boutique-brown">{editing ? 'Edit Product' : 'Add New Product'}</span>
      </div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-boutique-brown/10"><div className="h-full rounded-full bg-boutique-brown transition-all" style={{ width: `${(step / PRODUCT_WIZARD_STEPS.length) * 100}%` }} /></div>
      <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-8">{PRODUCT_WIZARD_STEPS.map((label, index) => { const number = index + 1; const active = number === step; const complete = number < step; return <button key={label} type="button" onClick={() => onStepChange(number)} className={`rounded-xl px-2 py-2 text-center text-[10px] font-bold transition ${active ? 'bg-boutique-brown text-white' : complete ? 'bg-[#fff4df] text-boutique-brown' : 'bg-white text-boutique-brown/45'}`}>{complete ? <Check className="mx-auto h-3.5 w-3.5" /> : number}<span className="mt-1 hidden md:block">{label}</span></button>; })}</div>
    </div>
  </div>
);
