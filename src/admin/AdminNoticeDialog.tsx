import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type AdminNotice = { kind: 'error' | 'confirm' | 'success'; title: string; message: string; issues?: string[] };

export const AdminNoticeDialog = ({ notice, onClose, onConfirm }: { notice: AdminNotice; onClose: () => void; onConfirm?: () => void }) => {
  const Icon = notice.kind === 'success' ? CheckCircle2 : AlertCircle;
  return <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[3px]">
    <div role="dialog" aria-modal="true" aria-label={notice.title} className="relative w-full max-w-lg rounded-[14px] border border-[#e7e7e7] bg-white p-6 text-[#202020] shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-7">
      <button type="button" onClick={onClose} aria-label="Pencereyi kapat" className="commerce-focus absolute right-4 top-4 rounded-lg border border-[#e8e8e8] bg-white p-2 text-[#666] hover:bg-[#f5f5f5]"><X className="h-4 w-4" /></button>
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#e8e8e8] bg-[#f8f8f8]"><Icon className="h-5 w-5" /></div>
        <div className="pr-7"><h3 className="text-xl font-semibold tracking-[-0.02em]">{notice.title}</h3><p className="mt-2 text-sm leading-6 text-[#666]">{notice.message}</p></div>
      </div>
      {notice.issues?.length ? <ul className="mt-5 space-y-2 rounded-[9px] border border-[#e8e8e8] bg-[#fafafa] p-4 text-sm text-[#444]">{notice.issues.map((issue, index) => <li key={index}>• {issue}</li>)}</ul> : null}
      <div className="mt-6 flex justify-end gap-2">
        {notice.kind === 'confirm' ? <>
          <button type="button" onClick={onClose} className="commerce-focus rounded-[9px] border border-[#dedede] bg-white px-5 py-3 text-sm font-semibold hover:bg-[#f5f5f5]">Vazgeç</button>
          <button type="button" onClick={onConfirm} className="commerce-focus rounded-[9px] bg-[#202020] px-5 py-3 text-sm font-semibold text-white hover:bg-[#383838]">Onayla</button>
        </> : <button type="button" onClick={onClose} className="commerce-focus rounded-[9px] bg-[#202020] px-5 py-3 text-sm font-semibold text-white hover:bg-[#383838]">Kapat</button>}
      </div>
    </div>
  </div>;
};
