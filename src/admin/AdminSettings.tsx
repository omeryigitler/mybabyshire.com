import React from 'react';
import { CreditCard, Globe, Mail, ShieldCheck, Sparkles, Truck } from 'lucide-react';

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

export const AdminSettings = () => {
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-7 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-12 -top-14 w-64 opacity-30 mix-blend-multiply" alt="" />
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light"><Sparkles className="h-4 w-4" /> Store setup</div>
          <h1 className="font-serif text-5xl leading-none text-boutique-brown">Settings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">A practical checklist for payment, storefront, shipping, email and admin security settings.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingCard icon={CreditCard} title="Payments" status="Active">
          Stripe and PayPal are connected. Stripe handles card payments, Apple Pay, Google Pay and Link when supported. PayPal is available as a secondary checkout option.
        </SettingCard>
        <SettingCard icon={Globe} title="Storefront" status="Live">
          Public storefront, product pages, checkout, payment success, payment cancel and order tracking pages are available on the production domain.
        </SettingCard>
        <SettingCard icon={Truck} title="Shipping" status="Basic">
          Flat shipping is currently used in checkout. Next step: add shipping rules by location, order value, or product type.
        </SettingCard>
        <SettingCard icon={Mail} title="Email notifications" status="Next">
          Customer emails are not connected yet. Recommended next step: add Resend or SendGrid for order confirmation, payment confirmation and shipped notifications.
        </SettingCard>
        <SettingCard icon={ShieldCheck} title="Admin security" status="Basic">
          Admin login is protected by environment variables and JWT. Next step: rotate the temporary password and add stronger admin user management.
        </SettingCard>
        <SettingCard icon={Sparkles} title="Brand system" status="In progress">
          Back office has been updated with Little Wonders colors, clouds, toy visuals and soft card layouts. Remaining pages can be refined as the business flow grows.
        </SettingCard>
      </div>
    </div>
  );
};
