import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type CatalogOption = { value: string; label: string };

export const CatalogSelect = ({
  value, options, onChange, label, disabled = false, className = '',
}: {
  value: string;
  options: CatalogOption[];
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const active = options.find(option => option.value === value);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return <div ref={rootRef} className={'relative min-w-[170px] ' + className}>
    <span id={labelId} className="sr-only">{label}</span>
    <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={labelId}
      disabled={disabled}
      onClick={() => setOpen(value => !value)}
      className={'commerce-focus flex h-11 w-full items-center justify-between gap-3 rounded-[9px] border bg-white px-3.5 text-left text-sm font-medium transition-colors disabled:opacity-40 ' +
        (open ? 'border-[#202020] text-[#202020]' : 'border-[#dedede] text-[#333] hover:border-[#aaa]')}>
      <span className="truncate">{active?.label || label}</span>
      <ChevronDown className={'h-4 w-4 shrink-0 text-[#666] transition-transform ' + (open ? 'rotate-180' : '')} />
    </button>
    {open && <div role="listbox" aria-labelledby={labelId}
      className="absolute left-0 top-[calc(100%+6px)] z-[60] max-h-64 w-full min-w-[220px] overflow-y-auto rounded-[10px] border border-[#dedede] bg-white p-1.5 text-[#202020] shadow-[0_16px_45px_rgba(0,0,0,0.13)]">
      {options.map(option => {
        const selected = option.value === value;
        return <button role="option" aria-selected={selected} type="button" key={option.value}
          onClick={() => { onChange(option.value); setOpen(false); }}
          className={'flex w-full items-center justify-between gap-3 rounded-[7px] px-3 py-2.5 text-left text-sm transition-colors ' +
            (selected ? 'bg-[#202020] font-semibold text-white' : 'text-[#333] hover:bg-[#f5f5f5]')}>
          <span>{option.label}</span>
          {selected && <Check className="h-4 w-4 shrink-0" />}
        </button>;
      })}
    </div>}
  </div>;
};
