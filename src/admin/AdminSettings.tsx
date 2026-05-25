import React from 'react';
import { CheckCircle2, CreditCard, Globe, Mail, Palette, ShieldCheck, Sparkles, Truck, WalletCards } from 'lucide-react';

const SettingCard = ({ icon: Icon, title, status, children }: { icon: React.ComponentType<{ className?: string }>; title: string; status: string; children: React.ReactNode }) => (
  <div className="rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-[0_16px_40px_rgba(58,37,26,0.07)] backdrop-blur-sm">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-boutique-brown">{title}</h2><span className="rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-boutique-brown-light">{status}</span></div>
        <div className="mt-3 text-sm leading-relaxed text-boutique-brown-light">{children}</div>
      </div>
    </div>
  </div>
);

const ChecklistItem = ({ done, title, note }: { done?: boolean; title: string; note: string }) => (
  <div className="flex gap-3 rounded-2xl border border-boutique-brown/10 bg-white p-4 shadow-sm">
    <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${done ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}><CheckCircle2 className="h-4 w-4" /></div>
    <div><p className="text-sm font-bold text-boutique-brown">{title}</p><p className="mt-1 text-xs leading-relaxed text-boutique-brown-light">{note}</p></div>
  </div>
);

export const AdminSettings = () => {
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-7 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-12 -top-14 w-64 opacity-30 mix-blend-multiply" alt="" />
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light"><Sparkles className="h-4 w-4" /> Store setup</div>
          <h1 className="font-serif text-5xl leading-none text-boutique-brown">Settings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">A practical checklist for payments, storefront, shipping, email, admin access and launch readiness.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingCard icon={CreditCard} title="Payments" status="Active">Stripe and PayPal checkout are connected. Stripe card checkout is primary and PayPal is secondary.</SettingCard>
        <SettingCard icon={WalletCards} title="Wallet readiness" status="Review">Apple Pay, Google Pay and Link are shown on the checkout page. Real wallet availability should be tested inside Stripe Hosted Checkout.</SettingCard>
        <SettingCard icon={Palette} title="Stripe Hosted Checkout branding" status="Later">Saved for later: dashboard branding, logo, colors, policy links, currency behavior and custom domain after the final domain decision.</SettingCard>
        <SettingCard icon={Globe} title="Storefront" status="Live">Public storefront, product pages, checkout, success, cancel and order tracking pages are available on the production domain.</SettingCard>
        <SettingCard icon={Truck} title="Shipping" status="Ready for tests">Flat shipping, admin shipment updates, public tracking lookup, carrier links and shipment timeline are connected. Later: add live carrier rates.</SettingCard>
        <SettingCard icon={Mail} title="Email notifications" status="Later">Email code is ready, but real sending is waiting for the final domain. Later: connect Resend, verify domain, add FROM_EMAIL and RESEND_API_KEY.</SettingCard>
        <SettingCard icon={ShieldCheck} title="Admin access" status="Email + Google">Email/password and Google admin sign-in are wired. Apple is visible as coming soon until an Apple Developer account is ready.</SettingCard>
        <SettingCard icon={Sparkles} title="Brand system" status="In progress">Back office has Little Wonders colors, clouds, toy visuals and soft card layouts. Remaining flows can be refined as the shop grows.</SettingCard>
      </div>

      <div className="rounded-[2rem] border border-boutique-brown/10 bg-white/82 p-6 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <div className="mb-5 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm"><WalletCards className="h-5 w-5" /></div><div><h2 className="font-serif text-3xl text-boutique-brown">Payment launch checklist</h2><p className="mt-1 text-sm text-boutique-brown-light">Use this before moving from test flow to real customer payments.</p></div></div>
        <div className="grid gap-3 md:grid-cols-2">
          <ChecklistItem done title="Stripe card checkout" note="Checkout sessions are created from the site checkout flow." />
          <ChecklistItem done title="PayPal checkout" note="The sandbox payment flow is connected and tested." />
          <ChecklistItem title="Apple Pay / Google Pay / Link" note="Test real wallet visibility in Stripe Checkout using supported devices and browsers." />
          <ChecklistItem title="Stripe page branding" note="Later: add logo, brand colors, policy URLs and review currency selector behavior." />
          <ChecklistItem title="Final domain" note="Later: buy/connect the real domain before email and custom checkout polish." />
          <ChecklistItem title="Email sending" note="Later: verify domain in Resend and add email variables to Vercel." />
        </div>
      </div>
    </div>
  );
};
