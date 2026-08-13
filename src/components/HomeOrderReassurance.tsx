import React from 'react';
import { ArrowRight, Clock3, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const items = [
  { title: 'Made-to-order timing', detail: 'Custom items are typically prepared in 2–5 business days; product-specific timing takes priority.', icon: Clock3, to: '/policies/shipping' },
  { title: 'USPS shipping in the US', detail: 'Ground Advantage and Priority Mail options are documented in our shipping policy.', icon: Truck, to: '/policies/shipping' },
  { title: 'Stripe & PayPal checkout', detail: 'Payments are processed by Stripe or PayPal; the store does not keep your full card number.', icon: ShieldCheck, to: '/policies/privacy' },
  { title: 'Clear custom-item policy', detail: 'Made-for-you items cannot be returned once production starts; damaged or incorrect orders are covered by policy.', icon: RotateCcw, to: '/policies/returns' },
] as const;

export function HomeOrderReassurance() {
  return (
    <section className="order-[10] relative z-20 mx-auto mt-10 w-full max-w-[1560px] px-4 sm:px-6 md:mt-14 md:px-8" aria-label="Order reassurance">
      <div className="rounded-[1.7rem] border border-boutique-brown/10 bg-[#fffaf3]/78 px-4 py-5 shadow-[0_12px_36px_rgba(58,37,26,0.06)] backdrop-blur-sm sm:px-5 md:px-6">
        <div className="mb-4 text-center md:text-left"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-boutique-wood sm:text-[11px]">Good to know before you order</p><p className="mt-1 text-xs text-boutique-brown-light sm:text-sm">Shipping, payment and custom-order details — after you have had room to browse.</p></div>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => { const Icon = item.icon; return <Link key={item.title} to={item.to} className="group flex min-h-[116px] gap-3 rounded-[1.1rem] border border-boutique-brown/10 bg-white/72 p-3.5 text-left transition-transform hover:-translate-y-0.5 hover:bg-white"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-boutique-wood/20 bg-[#fffaf3] text-boutique-wood"><Icon className="h-3.5 w-3.5" strokeWidth={1.8} /></span><span className="min-w-0"><span className="block text-[13px] font-bold text-boutique-brown">{item.title}</span><span className="mt-1 block text-[11px] leading-relaxed text-boutique-brown-light">{item.detail}</span><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-boutique-brown-light group-hover:text-boutique-wood">Read policy <ArrowRight className="h-3 w-3" /></span></span></Link>; })}
        </div>
      </div>
    </section>
  );
}
