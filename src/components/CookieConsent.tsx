import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { initAnalytics, disableAnalytics, trackPageView } from '../utils/analytics';
import { OPEN_PRIVACY_SETTINGS, readPrivacyConsent, savePrivacyConsent, type PrivacyConsent } from '../utils/privacyConsent';

export function CookieConsent() {
  const [visible, setVisible] = useState(() => readPrivacyConsent() === null);
  const [choice, setChoice] = useState<PrivacyConsent>(() => readPrivacyConsent() || { analytics: false, marketing: false });
  const [customize, setCustomize] = useState(false);
  useEffect(() => {
    const open = () => { setChoice(readPrivacyConsent() || { analytics: false, marketing: false }); setVisible(true); setCustomize(true); };
    window.addEventListener(OPEN_PRIVACY_SETTINGS, open);
    return () => window.removeEventListener(OPEN_PRIVACY_SETTINGS, open);
  }, []);
  const submit = (next: PrivacyConsent) => {
    const previous = readPrivacyConsent();
    savePrivacyConsent(next);
    if (!next.analytics && !next.marketing) disableAnalytics();
    setVisible(false);
    if (previous !== null) {
      // Unload previously permitted third-party scripts on consent withdrawal.
      window.location.reload();
    } else if (next.analytics || next.marketing) {
      initAnalytics();
      trackPageView(window.location.pathname + window.location.search);
    }
  };
  if (!visible) return null;
  return <div className="fixed inset-x-0 bottom-0 z-[250] border-t border-[#dedede] bg-white p-4 text-[#202020] shadow-[0_-12px_45px_rgba(0,0,0,0.12)] sm:p-5" role="dialog" aria-modal="false" aria-label="Cookie and privacy preferences">
    <div className="mx-auto max-w-[1050px]">
      <h2 className="text-base font-semibold">Your privacy choices</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#666]">
        Essential storage keeps the shop working. Google Analytics and optional marketing measurement remain off unless you allow them.
        You can change your choices at any time using “Cookie settings” in the footer. <Link className="underline" to="/policies/cookies">Cookie Policy</Link> · <Link className="underline" to="/policies/privacy">Privacy Policy</Link>.
      </p>
      {customize && <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-[9px] border border-[#e5e5e5] p-3 text-sm">
          <input type="checkbox" className="mt-1 accent-[#202020]" checked={choice.analytics} onChange={e => setChoice(v => ({ ...v, analytics: e.target.checked }))} />
          <span><strong className="block">Analytics</strong><span className="text-[#666]">Google Analytics 4 performance measurement</span></span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-[9px] border border-[#e5e5e5] p-3 text-sm">
          <input type="checkbox" className="mt-1 accent-[#202020]" checked={choice.marketing} onChange={e => setChoice(v => ({ ...v, marketing: e.target.checked }))} />
          <span><strong className="block">Marketing</strong><span className="text-[#666]">Optional Meta Pixel if configured</span></span>
        </label>
      </div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => submit({ analytics: false, marketing: false })} className="commerce-focus min-h-11 rounded-[9px] border border-[#202020] bg-white px-4 text-sm font-semibold">Reject optional</button>
        <button type="button" onClick={() => submit({ analytics: true, marketing: true })} className="commerce-focus min-h-11 rounded-[9px] bg-[#202020] px-4 text-sm font-semibold text-white">Accept all</button>
        {customize ? <button type="button" onClick={() => submit(choice)} className="commerce-focus min-h-11 rounded-[9px] border border-[#dedede] px-4 text-sm font-semibold">Save my choices</button>
          : <button type="button" onClick={() => setCustomize(true)} className="commerce-focus min-h-11 rounded-[9px] border border-[#dedede] px-4 text-sm font-semibold">Customize</button>}
      </div>
    </div>
  </div>;
}
