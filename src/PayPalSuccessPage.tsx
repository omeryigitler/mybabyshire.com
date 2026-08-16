import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Copy, Loader2, PackageCheck, ShoppingBag } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';
import { useStore } from './store/useStore';
import { consumePendingPurchase, trackPurchase } from './utils/analytics';
import { useSeo } from './utils/seo';

export default function PayPalSuccessPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const orderReference = searchParams.get('order') || '';
  const { clearCart } = useStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming payment...');
  const [copied, setCopied] = useState(false);

  useSeo({ title: 'Payment Status', description: 'Confirm your MY BABY SHIRE payment and view your order reference.' });

  useEffect(() => {
    const capturePayment = async () => {
      try {
        const response = await fetch('/api/paypal-capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, orderNumber: orderReference }),
        });
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(text.includes('<!doctype') || text.includes('<html') ? 'Payment confirmation endpoint returned a website page instead of JSON.' : text);
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.details || data.error || 'Payment could not be confirmed.');
        clearCart();
        const purchase = consumePendingPurchase(orderReference || undefined);
        if (purchase) trackPurchase({ orderNumber: purchase.orderNumber, value: purchase.value });
        setStatus('success');
        setMessage('Payment was confirmed successfully and the order was recorded.');
      } catch (error) {
        setStatus('error');
        setMessage((error as Error).message || 'Payment could not be confirmed.');
      }
    };

    if (token && orderReference) void capturePayment();
    else {
      setStatus('error');
      setMessage('Missing payment confirmation information.');
    }
  }, [token, orderReference, clearCart]);

  const copyOrderReference = async () => {
    if (!orderReference) return;
    await navigator.clipboard.writeText(orderReference);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const Icon = status === 'loading' ? Loader2 : status === 'success' ? CheckCircle2 : AlertTriangle;

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#202020]">
      <header className="border-b border-[#e8e8e8] bg-white"><div className="mx-auto flex min-h-[72px] max-w-[1100px] items-center justify-center px-4"><Link to="/" aria-label="MY BABY SHIRE home"><BrandLogo variant="nav" className="!h-[42px] !drop-shadow-none" /></Link></div></header>
      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-[760px] items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-[12px] border border-[#e3e3e3] bg-white p-6 text-center sm:p-9">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${status === 'success' ? 'bg-[#eaf5ee] text-[#316942]' : status === 'error' ? 'bg-[#fff3d9] text-[#8a641e]' : 'bg-[#f1f1f1] text-[#666]'}`}><Icon className={`h-8 w-8 ${status === 'loading' ? 'animate-spin' : ''}`} /></div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Checkout status</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{status === 'loading' ? 'Confirming payment' : status === 'success' ? 'Order confirmed' : 'Payment check needed'}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#666]">{message}</p>

          {orderReference && <div className="mx-auto mt-6 max-w-lg rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4"><div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]"><PackageCheck className="h-4 w-4" /> Order reference</div><div className="mt-3 flex items-center gap-2"><code className="min-w-0 flex-1 select-all rounded-[8px] bg-white px-3 py-3 text-left text-sm font-semibold">{orderReference}</code><button type="button" onClick={() => void copyOrderReference()} className="commerce-focus inline-flex min-h-11 items-center gap-1.5 rounded-[8px] border border-[#dedede] bg-white px-3 text-xs font-semibold hover:bg-[#f7f7f7]"><Copy className="h-3.5 w-3.5" />{copied ? 'Copied' : 'Copy'}</button></div></div>}

          <div className="mt-7 grid gap-2.5 sm:grid-cols-2"><Link to={orderReference ? `/track-order?query=${encodeURIComponent(orderReference)}` : '/track-order'} className="commerce-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838]"><ShoppingBag className="h-4 w-4" /> Track order</Link><Link to="/collections/all" className="commerce-focus inline-flex min-h-12 items-center justify-center rounded-[9px] border border-[#dedede] bg-white px-5 text-sm font-semibold hover:bg-[#f7f7f7]">Continue shopping</Link></div>
        </section>
      </main>
    </div>
  );
}
