import React, { useEffect, useId, useRef } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type CatalogDialogState = {
  kind: 'confirm' | 'error' | 'success';
  title: string;
  message: string;
  details?: string[];
  confirmLabel?: string;
};

export const CatalogActionDialog = ({
  dialog, busy = false, onClose, onConfirm,
}: {
  dialog: CatalogDialogState;
  busy?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [busy, onClose]);

  const Icon = dialog.kind === 'success' ? CheckCircle2 : AlertCircle;

  return <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[3px]">
    <div role="dialog" aria-modal="true" aria-labelledby={titleId}
      className="w-full max-w-[480px] rounded-[14px] border border-[#e7e7e7] bg-white p-5 text-[#202020] shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#e8e8e8] bg-[#f8f8f8]">
          <Icon className="h-5 w-5" />
        </span>
        <button type="button" ref={closeRef} disabled={busy} aria-label="Pencereyi kapat" onClick={onClose}
          className="commerce-focus rounded-lg border border-[#e9e9e9] p-2 text-[#666] hover:bg-[#f5f5f5] disabled:opacity-40">
          <X className="h-4 w-4" />
        </button>
      </div>
      <h2 id={titleId} className="mt-5 text-xl font-semibold tracking-[-0.02em]">{dialog.title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#666]">{dialog.message}</p>
      {dialog.details && dialog.details.length > 0 && <div className="mt-4 max-h-48 overflow-y-auto rounded-[9px] border border-[#e8e8e8] bg-[#fafafa] p-3">
        <ul className="space-y-2 text-xs leading-5 text-[#444]">{dialog.details.map((detail, index) => <li key={index}>• {detail}</li>)}</ul>
      </div>}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        {dialog.kind === 'confirm' && <button type="button" disabled={busy} onClick={onClose}
          className="commerce-focus min-h-11 rounded-[9px] border border-[#dedede] bg-white px-5 text-sm font-semibold hover:bg-[#f7f7f7] disabled:opacity-40">Vazgeç</button>}
        <button type="button" disabled={busy} onClick={dialog.kind === 'confirm' ? onConfirm : onClose}
          className="commerce-focus min-h-11 rounded-[9px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-40">
          {busy ? 'İşleniyor…' : dialog.kind === 'confirm' ? (dialog.confirmLabel || 'Onayla') : 'Kapat'}
        </button>
      </div>
    </div>
  </div>;
};
