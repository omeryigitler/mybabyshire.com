import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, Loader2, MailCheck, PackageCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { useStore } from './store/useStore';

const StepCard = ({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) => (
  <div className="rounded-[1.35rem] border border-boutique-brown/10 bg-[#fffaf3] p-4 text-left shadow-sm">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-boutique-brown shadow-sm"><Icon className="h-4.5 w-4.5" /></div>
    <p className="text-sm font-bold text-boutique-brown">{title}</p>
    <p className="mt-1 text-xs leading-relaxed text-boutique-brown-light">{text}</p>
  </div>
);

export default function PayPalSuccessPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const orderReference = searchParams.get('order') || '';
  const { clearCart } = useStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your PayPal payment...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const capturePayment = async () => {
      try {
        const response = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, orderNumber: orderReference }),
        });

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(text.includes('<!doctype') || text.includes('<html') ? 'PayPal confirmation endpoint returned a website page instead of JSON. Please redeploy and try again.' : text);
        }

        const data = await response.json();

        if (!response.ok) throw new Error(data.details || data.error || 'PayPal payment could not be confirmed.');

        clearCart();
        setStatus('success');
        setMessage('Your PayPal payment was completed successfully. We received your Little Wonders gift order and will start preparing it soon.');
      } catch (error) {
        setStatus('error');
        setMessage((error as Error).message);
      }
    };

    if (token && orderReference) capturePayment();
    else {
      setStatus('error');
      setMessage('Missing PayPal payment information.');
    }
  }, [token, orderReference, clearCart]);

  const copyOrderReference = async () => {
    if (!orderReference) return;
    await navigator.clipboard.writeText(orderReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-boutique-bg font-sans text-boutique-brown">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-pattern bg-[length:400px_400px]"></div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.96)_0%,rgba(252,250,246,0.65)_40%,rgba(252,250,246,0)_78%)]"></div>
      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-12">
        <div className="relative w-full overflow-hidden rounded-[2.4rem] border border-boutique-brown/10 bg-white/85 p-8 text-center shadow-[0_30px_90px_rgba(58,37,26,0.16)] backdrop-blur-sm md:p-10">
          <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -left-16 -top-12 w-56 opacity-40 mix-blend-multiply" alt="" />
          <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-16 bottom-16 w-52 opacity-35 mix-blend-multiply" alt="" />
          <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute right-10 top-12 w-10 rotate-12 opacity-45 mix-blend-multiply" alt="" />

          <div className={`relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full shadow-[0_12px_30px_rgba(58,37,26,0.12)] ${status === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{status === 'loading' ? <Loader2 className="h-10 w-10 animate-spin" /> : <CheckCircle2 className="h-11 w-11" />}</div>

          <div className="relative z-10 mb-4 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-boutique-brown-light"><Sparkles className="h-3.5 w-3.5" /> PayPal checkout</div>
          <h1 className="relative z-10 font-serif text-4xl text-boutique-brown md:text-6xl">{status === 'loading' ? 'Confirming Payment' : status === 'success' ? 'Thank You!' : 'Payment Check Failed'}</h1>
          <p className="relative z-10 mx-auto mt-4 max-w-lg text-sm leading-relaxed text-boutique-brown-light">{message}</p>

          {orderReference && (
            <div className="relative z-10 mt-7 rounded-[1.6rem] border border-boutique-brown/10 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-boutique-brown/60"><PackageCheck className="h-4 w-4" /> Order Reference</div>
              <div className="flex items-center gap-2 rounded-2xl bg-boutique-bg p-3">
                <code className="flex-1 select-all rounded-xl bg-white/80 px-3 py-3 text-left text-sm font-black tracking-[0.08em] text-boutique-brown">{orderReference}</code>
                <button onClick={copyOrderReference} className="inline-flex h-12 items-center gap-1.5 rounded-full bg-boutique-brown px-4 text-xs font-bold text-white hover:bg-boutique-wood"><Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy'}</button>
              </div>
            </div>
          )}

          {status === 'success' && <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-3"><StepCard icon={MailCheck} title="Confirmation" text="Email confirmation is ready for when the store domain email is connected." /><StepCard icon={PackageCheck} title="Preparing" text="Your gift order will stay in processing while it is prepared." /><StepCard icon={Truck} title="Tracking" text="Tracking details will appear after the order ships." /></div>}

          <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-2">
            <Link to="/track-order" className="inline-flex items-center justify-center gap-2 rounded-full bg-boutique-brown px-5 py-4 text-sm font-bold text-white hover:bg-boutique-wood"><ShoppingBag className="h-4 w-4" /> Track Order</Link>
            <Link to="/" className="rounded-full border border-boutique-brown/15 bg-white px-5 py-4 text-sm font-bold text-boutique-brown hover:bg-boutique-bg">Continue Shopping</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
