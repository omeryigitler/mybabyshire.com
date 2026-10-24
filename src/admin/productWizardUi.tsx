import React from 'react';
import { Check } from 'lucide-react';

export const wizardInputClass = 'w-full rounded-[9px] border border-[#dedede] bg-white px-4 py-3 text-sm text-[#202020] outline-none placeholder:text-[#999] focus:border-[#202020] focus:ring-2 focus:ring-black/10';

export const WizardFieldLabel = ({ children }: { children: React.ReactNode }) => <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-[#777]">{children}</label>;

export const WizardChoice = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition ${active ? 'border-[#202020] bg-[#202020] text-white' : 'border-[#dedede] bg-white text-[#202020] hover:bg-[#f5f5f5]'}`}>
    <span>{label}</span><span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? 'bg-white text-[#202020]' : 'border border-[#dedede] text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
  </button>
);

export const WizardSwitch = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => <button type="button" onClick={onClick} className={`relative inline-flex h-7 w-12 items-center rounded-full ${checked ? 'bg-[#202020]' : 'bg-[#d6d6d6]'}`}><span className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} /></button>;
