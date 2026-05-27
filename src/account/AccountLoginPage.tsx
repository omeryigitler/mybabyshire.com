import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { getMemberAuthErrorFromUrl, startGoogleMemberLogin } from './memberAuth';

export default function AccountLoginPage() {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const authError = getMemberAuthErrorFromUrl();
    if (authError) setError(authError);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-boutique-bg px-6 py-10 font-sans text-boutique-brown">
      <div className="pointer-events-none fixed inset-0 opacity-40 bg-pattern bg-[length:420px_420px]"></div>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.92)_0%,rgba(252,250,246,0.55)_42%,rgba(252,250,246,0)_78%)]"></div>
      <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-14 top-24 hidden w-72 opacity-40 mix-blend-multiply md:block" alt="" />
      <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-14 bottom-16 hidden w-72 opacity-35 mix-blend-multiply md:block" alt="" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.25rem] border border-boutique-brown/10 bg-white/90 p-7 shadow-[0_24px_70px_rgba(58,37,26,0.12)] backdrop-blur-sm">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light hover:text-boutique-brown">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>

        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-boutique-brown text-white shadow-sm">
            <UserRound className="h-6 w-6" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-boutique-brown-light">
            <Sparkles className="h-3.5 w-3.5" /> MY BABY SHIRE
          </div>
          <h1 className="font-serif text-4xl leading-none text-boutique-brown">Welcome back</h1>
          <p className="mt-3 text-sm leading-relaxed text-boutique-brown-light">
            Sign in to view your orders, save delivery details and enjoy a smoother checkout.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        <div className="grid gap-3">
          <button
            type="button"
            onClick={startGoogleMemberLogin}
            className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-boutique-brown/10 bg-white px-4 py-4 text-sm font-bold text-boutique-brown shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#fffaf3]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base font-black text-[#4285f4] shadow-sm">G</span>
            Continue with Google
          </button>
          <button type="button" onClick={() => setNotice({ title: 'Email sign in', message: 'Email sign in is being prepared. For now, please continue with Google to access your account securely.' })} className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-boutique-brown/10 bg-white px-4 py-4 text-sm font-bold text-boutique-brown shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#fffaf3]">
            <Mail className="h-5 w-5" /> Continue with Email
          </button>
          <button type="button" onClick={() => setNotice({ title: 'Apple sign in', message: 'Apple sign in is coming soon. Please use Google sign in while we finish this option.' })} className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-boutique-brown/10 bg-white px-4 py-4 text-sm font-bold text-boutique-brown shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#fffaf3]">
            <span className="text-lg leading-none"></span> Continue with Apple
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-boutique-brown/10 bg-[#fffaf3]/80 p-4 text-xs leading-relaxed text-boutique-brown-light">
          <div className="mb-2 flex items-center gap-2 font-bold text-boutique-brown">
            <ShieldCheck className="h-4 w-4" /> Secure sign in
          </div>
          Your account helps us keep your order history and delivery details ready for your next gift.
        </div>
      </div>

      {notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-boutique-brown/35 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-boutique-brown/10 bg-white p-6 text-center shadow-[0_24px_70px_rgba(58,37,26,0.18)]">
            <button onClick={() => setNotice(null)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-boutique-bg text-boutique-brown-light hover:text-boutique-brown" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
            <h2 className="mt-2 font-serif text-3xl text-boutique-brown">{notice.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-boutique-brown-light">{notice.message}</p>
            <button onClick={() => setNotice(null)} className="mt-6 w-full rounded-2xl bg-boutique-brown px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-boutique-brown-light">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
