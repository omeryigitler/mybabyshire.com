import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { openPrivacySettings } from '../utils/privacyConsent';

export function SiteCredits() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <div className="border-t border-[#e5e5e5] bg-[#fafafa] px-4 py-6 text-center text-[11px] leading-6 text-[#666] sm:px-6">
    <p>Some products link to Etsy for purchase. Orders placed there are completed on Etsy.</p>
    <p className="mt-1">The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, but is not endorsed or certified by Etsy.</p>
    <nav aria-label="Site information" className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
      <Link to="/policies/terms" className="underline underline-offset-2">Terms & Conditions</Link>
      <Link to="/policies/privacy" className="underline underline-offset-2">Privacy</Link>
      <Link to="/policies/cookies" className="underline underline-offset-2">Cookies</Link>
      <Link to="/policies/returns" className="underline underline-offset-2">Returns</Link>
      <button type="button" onClick={openPrivacySettings} className="underline underline-offset-2">Cookie settings</button>
      <a href="mailto:hello@mybabyshire.com" className="underline underline-offset-2">Contact</a>
    </nav>
    <p className="mt-3"><a href="https://omeryigitler.com" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2 hover:text-[#202020]">Designed &amp; developed by Ömer YİĞİTLER ↗</a></p>
  </div>;
}
