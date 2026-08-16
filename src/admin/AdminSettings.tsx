import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Globe, Mail, Send, ShieldCheck, Truck, XCircle } from 'lucide-react';
import { getAdminToken } from './adminAuth';

const SettingCard = ({ icon: Icon, title, status, pending = false, children }: { icon: React.ComponentType<{ className?: string }>; title: string; status: string; pending?: boolean; children: React.ReactNode }) => (
  <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5">
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#f3f3f3] text-[#555]"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{title}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${pending ? 'bg-[#fff3d9] text-[#8a641e]' : 'bg-[#eaf5ee] text-[#316942]'}`}>{status}</span></div><div className="mt-3 text-sm leading-6 text-[#666]">{children}</div></div>
    </div>
  </section>
);

export const AdminSettings = () => {
  const [testEmail, setTestEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const sendTestEmail = async () => {
    setIsSendingEmail(true);
    setEmailStatus('');
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ to: testEmail.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Test email failed.');
      setEmailStatus(`Test email sent to ${data.to}.`);
    } catch (error) {
      setEmailStatus((error as Error).message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Configuration</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em]">Settings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Operational status only. This page does not claim payment or shipping readiness until real provider information is supplied and tested.</p></div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingCard icon={CreditCard} title="Payments" status="Needs real configuration" pending><p>The checkout code supports payment-provider flows, but production credentials, provider settings and live transaction testing must be confirmed before treating payments as ready.</p></SettingCard>
        <SettingCard icon={Truck} title="Shipping" status="Needs real configuration" pending><p>Order and tracking screens are built. Real carrier choice, shipping methods, rates, delivery rules and production tracking behavior still need your actual shipping information.</p></SettingCard>
        <SettingCard icon={Globe} title="Storefront" status="Active"><p>The storefront, product pages, collections, customer account, order tracking and policy routes are available on the production application.</p></SettingCard>
        <SettingCard icon={ShieldCheck} title="Admin & customer access" status="Active"><p>Admin authentication and customer account access are separated. Admin routes remain protected and customer account data uses the customer session flow.</p></SettingCard>
        <SettingCard icon={Mail} title="Email test" status="Available">
          <p>Use this to verify the currently configured transactional email connection. A successful test confirms sending at that moment; it does not replace production monitoring.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]"><input value={testEmail} onChange={(event) => setTestEmail(event.target.value)} type="email" placeholder="Optional recipient email" className="commerce-focus h-11 rounded-[9px] border border-[#dedede] bg-white px-3.5 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" /><button type="button" onClick={() => void sendTestEmail()} disabled={isSendingEmail} className="commerce-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50"><Send className="h-4 w-4" /> {isSendingEmail ? 'Sending…' : 'Send test'}</button></div>
          {emailStatus && <p className="mt-3 rounded-[9px] bg-[#fafafa] px-3.5 py-3 text-xs font-medium text-[#666]">{emailStatus}</p>}
        </SettingCard>
        <SettingCard icon={CheckCircle2} title="Catalog & inventory" status="Active"><p>Products, categories and Color × Size × SKU inventory management are connected. Variant price and stock are verified server-side during checkout.</p></SettingCard>
      </div>

      <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Launch status</h2>
        <p className="mt-1 text-sm text-[#777]">Items that depend on real business/provider information remain intentionally open.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <StatusItem done title="Storefront & collections" note="Responsive catalog and collection routes are implemented." />
          <StatusItem done title="Products & variant inventory" note="Color, size, SKU and stock management are implemented." />
          <StatusItem done title="Customer account & tracking UI" note="Customer-facing account and order lookup are implemented." />
          <StatusItem done title="Admin commerce workflows" note="Products, inventory, orders, customers, reviews and discounts are available." />
          <StatusItem title="Live payment configuration" note="Waiting for actual production payment information and live-provider testing." />
          <StatusItem title="Live shipping configuration" note="Waiting for actual carriers, rates, rules and tracking configuration." />
        </div>
      </section>
    </div>
  );
};

const StatusItem = ({ done = false, title, note }: { done?: boolean; title: string; note: string }) => <div className="flex gap-3 rounded-[10px] border border-[#e5e5e5] p-4"><div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? 'bg-[#eaf5ee] text-[#316942]' : 'bg-[#fff3d9] text-[#8a641e]'}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}</div><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-[#777]">{note}</p></div></div>;
