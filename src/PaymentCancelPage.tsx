import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, XCircle } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';
import { useSeo } from './utils/seo';

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const orderReference = searchParams.get('order') || '';
  useSeo({ title: 'Payment Not Completed', description: 'Return to checkout or continue shopping after an incomplete MY BABY SHIRE payment.' });

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#202020]">
      <header className="border-b border-[#e8e8e8] bg-white"><div className="mx-auto flex min-h-[72px] max-w-[1000px] items-center justify-center px-4"><Link to="/" aria-label="MY BABY SHIRE home"><BrandLogo variant="nav" className="!h-[42px] !drop-shadow-none" /></Link></div></header>
      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-[680px] items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-[12px] border border-[#e3e3e3] bg-white p-6 text-center sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff3d9] text-[#8a641e]"><XCircle className="h-8 w-8" /></div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Checkout status</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Payment not completed</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#666]">The checkout did not complete successfully. You can return to checkout or continue browsing.</p>
          {orderReference && <div className="mx-auto mt-5 max-w-md rounded-[9px] bg-[#fafafa] px-4 py-3 text-xs text-[#666]"><span className="font-semibold text-[#202020]">Order reference:</span> {orderReference}</div>}
          <div className="mt-7 grid gap-2.5 sm:grid-cols-2"><Link to="/checkout" className="commerce-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838]"><ShoppingBag className="h-4 w-4" /> Return to checkout</Link><Link to="/collections/all" className="commerce-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-5 text-sm font-semibold hover:bg-[#f7f7f7]"><ArrowLeft className="h-4 w-4" /> Continue shopping</Link></div>
        </section>
      </main>
    </div>
  );
}
