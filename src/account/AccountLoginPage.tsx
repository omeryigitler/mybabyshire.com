import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { getMemberAuthErrorFromUrl, startGoogleMemberLogin } from './memberAuth';

const AppleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M17.05 12.38c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.45-1.59-2.98-1.61-1.27-.13-2.48.75-3.12.75-.65 0-1.64-.73-2.7-.71-1.39.02-2.68.81-3.39 2.05-1.45 2.51-.37 6.22 1.04 8.26.69.99 1.51 2.11 2.59 2.07 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.71.65 1.12-.02 1.83-1.01 2.51-2.01.79-1.15 1.12-2.27 1.14-2.33-.03-.01-2.18-.84-2.25-3.35ZM15 6.33c.57-.69.96-1.65.85-2.61-.82.03-1.81.55-2.4 1.23-.53.61-.99 1.59-.86 2.52.91.07 1.84-.46 2.41-1.14Z" />
  </svg>
);

export default function AccountLoginPage() {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const authError = getMemberAuthErrorFromUrl();
    if (authError) setError(authError);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fbf5ec] font-sans text-boutique-brown">
      <div className="pointer-events-none absolute inset-0 bg-pattern bg-[length:420px_420px] opacity-35"></div>
      <img
        src="/login-toy-hero.svg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0.08)_42%,rgba(255,255,255,0)_72%)]"></div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 md:px-8">
        <section className="relative w-full max-w-[620px] rounded-[2.5rem] border border-boutique-brown/10 bg-white/78 px-7 py-8 shadow-[0_28px_90px_rgba(58,37,26,0.18)] backdrop-blur-[2px] md:px-10 md:py-9">
          <div className="pointer-events-none absolute -left-5 top-28 hidden h-16 w-32 rounded-full bg-white/80 shadow-[0_16px_32px_rgba(58,37,26,0.10)] md:block">
            <span className="absolute -left-3 bottom-0 h-12 w-12 rounded-full bg-white/90"></span>
            <span className="absolute left-8 -top-4 h-14 w-14 rounded-full bg-white/90"></span>
          </div>
          <div className="pointer-events-none absolute right-8 top-20 hidden h-16 w-36 rounded-full bg-white/80 shadow-[0_16px_32px_rgba(58,37,26,0.10)] md:block">
            <span className="absolute left-4 -top-4 h-14 w-14 rounded-full bg-white/90"></span>
            <span className="absolute right-4 -top-2 h-12 w-12 rounded-full bg-white/90"></span>
          </div>
          <div className="pointer-events-none absolute left-14 top-40 hidden text-3xl text-[#d8b464] md:block">★</div>
          <div className="pointer-events-none absolute right-16 top-36 hidden text-3xl text-[#d8b464] md:block">★</div>
          <div className="pointer-events-none absolute left-1/2 top-[190px] hidden -translate-x-1/2 items-end gap-2 md:flex">
            <span className="text-5xl drop-shadow-md">🧸</span>
            <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl border border-boutique-brown/10 bg-[#fff3e7] text-2xl shadow-md">🎁</span>
            <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl border border-boutique-brown/10 bg-[#e5d8b8] text-base shadow-md">♡</span>
          </div>

          <Link to="/" className="relative z-10 inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light hover:text-boutique-brown">
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Link>

          <div className="relative z-10 mt-9 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-boutique-brown text-white shadow-[0_14px_25px_rgba(58,37,26,0.22)]">
              <UserRound className="h-7 w-7" />
            </div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-boutique-brown-light shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> MY BABY SHIRE
            </div>
            <div className="h-24 md:h-28"></div>
            <h1 className="font-serif text-5xl leading-none text-boutique-brown md:text-6xl">Welcome back</h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-boutique-brown-light md:text-base">
              Sign in to view your orders, save delivery details and enjoy a smoother checkout.
            </p>
          </div>

          {error && (
            <p className="relative z-10 mx-auto mt-5 max-w-[430px] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
          )}

          <div className="relative z-10 mx-auto mt-7 grid max-w-[430px] gap-3">
            <button
              type="button"
              onClick={startGoogleMemberLogin}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-boutique-brown/10 bg-white px-4 py-4 text-sm font-bold text-boutique-brown shadow-[0_10px_24px_rgba(58,37,26,0.10)] transition-transform hover:-translate-y-0.5 hover:bg-[#fffaf3]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base font-black text-[#4285f4] shadow-sm">G</span>
              Continue with Google
            </button>
            <button type="button" onClick={() => setNotice({ title: 'Apple sign in', message: 'Apple sign in is coming soon. Please use Google sign in while we finish this option.' })} className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-boutique-brown/10 bg-white px-4 py-4 text-sm font-bold text-boutique-brown shadow-[0_10px_24px_rgba(58,37,26,0.10)] transition-transform hover:-translate-y-0.5 hover:bg-[#fffaf3]">
              <AppleIcon /> Continue with Apple
            </button>
            <button type="button" onClick={() => setNotice({ title: 'Email sign in', message: 'Email sign in is being prepared. For now, please continue with Google to access your account securely.' })} className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-boutique-brown/10 bg-white px-4 py-4 text-sm font-bold text-boutique-brown shadow-[0_10px_24px_rgba(58,37,26,0.10)] transition-transform hover:-translate-y-0.5 hover:bg-[#fffaf3]">
              <Mail className="h-5 w-5" /> Continue with Email
            </button>
          </div>

          <div className="relative z-10 mx-auto mt-5 max-w-[430px] rounded-2xl border border-boutique-brown/10 bg-[#fffaf3]/90 p-4 text-xs leading-relaxed text-boutique-brown-light shadow-sm">
            <div className="mb-2 flex items-center gap-2 font-bold text-boutique-brown">
              <ShieldCheck className="h-4 w-4" /> Secure sign in
            </div>
            Your account helps us keep your order history and delivery details ready for your next gift.
          </div>
        </section>
      </main>

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
