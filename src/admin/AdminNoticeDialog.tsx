import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export type AdminNotice = { kind: 'error' | 'confirm' | 'success'; title: string; message: string; issues?: string[] };

export const AdminNoticeDialog = ({ notice, onClose, onConfirm }: { notice: AdminNotice; onClose: () => void; onConfirm?: () => void }) => {
  const Icon = notice.kind === 'success' ? CheckCircle2 : AlertTriangle;
  return <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#2f1c13]/45 p-4 backdrop-blur-sm">
    <div className="relative w-full max-w-lg rounded-[2rem] border border-white/70 bg-[#fcfaf6] p-7 shadow-[0_30px_90px_rgba(45,28,18,0.34)]">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full border border-boutique-brown/10 bg-white p-2 text-boutique-brown"><X className="h-4 w-4" /></button>
      <div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown"><Icon className="h-6 w-6" /></div><div className="pr-8"><h3 className="font-serif text-2xl text-boutique-brown">{notice.title}</h3><p className="mt-2 text-sm leading-relaxed text-boutique-brown-light">{notice.message}</p></div></div>
      {notice.issues?.length ? <ul className="mt-5 space-y-2 rounded-[1.3rem] border border-boutique-brown/10 bg-white p-4 text-sm text-boutique-brown">{notice.issues.map((issue) => <li key={issue}>• {issue}</li>)}</ul> : null}
      <div className="mt-6 flex justify-end gap-3">{notice.kind === 'confirm' ? <><button type="button" onClick={onClose} className="rounded-full border border-boutique-brown/10 bg-white px-5 py-3 text-sm font-bold text-boutique-brown">Keep editing</button><button type="button" onClick={onConfirm} className="rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white">Confirm</button></> : <button type="button" onClick={onClose} className="rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white">OK</button>}</div>
    </div>
  </div>;
};
