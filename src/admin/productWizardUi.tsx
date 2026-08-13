import React from 'react';
import { Check } from 'lucide-react';

export const wizardInputClass = 'w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] px-4 py-3 text-sm text-boutique-brown outline-none placeholder:text-boutique-brown/35 focus:ring-2 focus:ring-boutique-wood/25';

export const WizardFieldLabel = ({ children }: { children: React.ReactNode }) => <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">{children}</label>;

export const WizardChoice = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition ${active ? 'border-boutique-brown bg-boutique-brown text-white' : 'border-boutique-brown/10 bg-white text-boutique-brown hover:bg-[#fffaf3]'}`}>
    <span>{label}</span><span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? 'bg-white text-boutique-brown' : 'border border-boutique-brown/15 text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
  </button>
);

export const WizardSwitch = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => <button type="button" onClick={onClick} className={`relative inline-flex h-7 w-12 items-center rounded-full ${checked ? 'bg-boutique-brown' : 'bg-boutique-brown/20'}`}><span className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} /></button>;
