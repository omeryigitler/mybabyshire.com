import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const orderReference = searchParams.get('order') || '';

  return (
    <div className="relative min-h-screen overflow-x-clip bg-boutique-bg font-sans text-boutique-brown">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-pattern bg-[length:400px_400px]"></div>
      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-12">
        <div className="relative w-full overflow-hidden rounded-[2.2rem] border border-boutique-brown/10 bg-white/85 p-8 text-center shadow-[0_30px_90px_rgba(58,37,26,0.14)] backdrop-blur-sm md:p-10">
          <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-16 -top-12 w-56 opacity-35 mix-blend-multiply" alt="" />
          <div className="relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <XCircle className="h-11 w-11" />
          </div>
          <h1 className="relative z-10 font-serif text-4xl text-boutique-brown md:text-5xl">Payment Not Completed</h1>
          <p className="relative z-10 mx-auto mt-4 max-w-md text-sm leading-relaxed text-boutique-brown-light">
            Your order was created, but payment was not completed. You can return to checkout and try again.
          </p>
          {orderReference && <p className="relative z-10 mt-5 text-xs font-bold uppercase tracking-wider text-boutique-brown-light">Order Reference: {orderReference}</p>}
          <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-2">
            <Link to="/checkout" className="inline-flex items-center justify-center gap-2 rounded-full bg-boutique-brown px-5 py-4 text-sm font-bold text-white hover:bg-boutique-wood">
              <ShoppingBag className="h-4 w-4" /> Return to Checkout
            </Link>
            <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-full border border-boutique-brown/15 bg-white px-5 py-4 text-sm font-bold text-boutique-brown hover:bg-boutique-bg">
              <ArrowLeft className="h-4 w-4" /> Back to Shop
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
