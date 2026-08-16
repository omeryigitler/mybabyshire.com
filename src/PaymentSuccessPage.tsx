import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Copy, Loader2, MailCheck, PackageCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { useStore } from './store/useStore';
import { consumePendingPurchase, trackPurchase } from './utils/analytics';

const StepCard = ({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) => (
  <div className="rounded-[1.35rem] border border-boutique-brown/10 bg-[#fffaf3] p-4 text-left shadow-sm">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-boutique-brown shadow-sm"><Icon className="h-4.5 w-4.5" /></div>
    <p className="text-sm font-bold text-boutique-brown">{title}</p>
    <p className="mt-1 text-xs leading-relaxed text-boutique-brown-light">{text}</p>
  </div>
);

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const orderReference = searchParams.get('order') || '';
  const { clearCart } = useStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment with Stripe...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      if (!sessionId || !orderReference) {
        setStatus('error');
        setMessage('Missing payment verification information. Please return to your order or contact support.');
        return;
      }

      try {
        const response = await fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}&order=${encodeURIComponent(orderReference)}`);
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : null;

        if (!response.ok || !data?.confirmed) {
          throw new Error(data?.error || 'Stripe has not confirmed this payment yet.');
        }

        if (cancelled) return;

        clearCart();
        const purchase = consumePendingPurchase(orderReference);
        if (purchase) {
          trackPurchase({ orderNumber: purchase.orderNumber, value: purchase.value });
        }

        setStatus('success');
        setMessage('Your payment was confirmed securely. We received your MY BABY SHIRE order and will start preparing it soon.');
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage((error as Error).message || 'Payment could not be verified.');
      }
    };

    verifyPayment();
    return () => {
      cancelled = true;
    };
  }, [clearCart, orderReference, sessionId]);

  const copyOrderReference = async () => {
    if (!orderReference) return;
    await navigator.clipboard.writeText(orderReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const statusIcon = status === 'loading'
    ? <Loader2 className="h-10 w-10 animate-spin" />
    : status === 'success'
      ? <CheckCircle2 className="h-11 w-11" />
      : <AlertTriangle className="h-10 w-10" />;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-boutique-bg font-sans text-boutique-brown">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-pattern bg-[length:400px_400px]"></div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.96)_0%,rgba(252,250,246,0.65)_40%,rgba(252,250,246,0)_78%)]"></div>
      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-12">
        <div className="relative w-full overflow-hidden rounded-[2.4rem] border border-boutique-brown/10 bg-white/85 p-8 text-center shadow-[0_30px_90px_rgba(58,37,26,0.16)] backdrop-blur-sm md:p-10">
          <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -left-16 -top-12 w-56 opacity-40 mix-blend-multiply" alt="" />
          <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-16 bottom-16 w-52 opacity-35 mix-blend-multiply" alt="" />
          <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute right-10 top-12 w-10 rotate-12 opacity-45 mix-blend-multiply" alt="" />

          <div className={`relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full shadow-[0_12px_30px_rgba(58,37,26,0.12)] ${status === 'error' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
            {statusIcon}
          </div>

          <div className="relative z-10 mb-4 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-boutique-brown-light"><Sparkles className="h-3.5 w-3.5" /> Stripe checkout</div>
          <h1 className="relative z-10 font-serif text-4xl text-boutique-brown md:text-6xl">
            {status === 'loading' ? 'Verifying Payment' : status === 'success' ? 'Thank You!' : 'Payment Check Needed'}
          </h1>
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

          {status === 'success' && (
            <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-3">
              <StepCard icon={MailCheck} title="Confirmation" text="Your order confirmation is handled after payment processing completes." />
              <StepCard icon={PackageCheck} title="Preparing" text="Your order will stay in processing while it is prepared." />
              <StepCard icon={Truck} title="Tracking" text="Tracking details will appear after the order ships." />
            </div>
          )}

          <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-2">
            <Link to="/track-order" className="inline-flex items-center justify-center gap-2 rounded-full bg-boutique-brown px-5 py-4 text-sm font-bold text-white hover:bg-boutique-wood"><ShoppingBag className="h-4 w-4" /> Track Order</Link>
            <Link to="/" className="rounded-full border border-boutique-brown/15 bg-white px-5 py-4 text-sm font-bold text-boutique-brown hover:bg-boutique-bg">Continue Shopping</Link>
          </div>
        </div>
      </main>
    </div>
  );
}