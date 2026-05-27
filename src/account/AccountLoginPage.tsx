import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { getMemberAuthErrorFromUrl, startGoogleMemberLogin } from './memberAuth';

const AppleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M17.05 12.38c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.45-1.59-2.98-1.61-1.27-.13-2.48.75-3.12.75-.65 0-1.64-.73-2.7-.71-1.39.02-2.68.81-3.39 2.05-1.45 2.51-.37 6.22 1.04 8.26.69.99 1.51 2.11 2.59 2.07 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.71.65 1.12-.02 1.83-1.01 2.51-2.01.79-1.15 1.12-2.27 1.14-2.33-.03-.01-2.18-.84-2.25-3.35ZM15 6.33c.57-.69.96-1.65.85-2.61-.82.03-1.81.55-2.4 1.23-.53.61-.99 1.59-.86 2.52.91.07 1.84-.46 2.41-1.14Z" />
  </svg>
);

const Cloud = ({ className = '' }: { className?: string }) => (
  <div className={`absolute rounded-full bg-white shadow-[0_14px_35px_rgba(158,125,93,0.14)] ${className}`}>
    <span className="absolute -left-5 bottom-0 h-12 w-12 rounded-full bg-white"></span>
    <span className="absolute left-5 -top-5 h-14 w-14 rounded-full bg-white"></span>
    <span className="absolute right-0 -top-3 h-11 w-11 rounded-full bg-white"></span>
  </div>
);

export default function AccountLoginPage() {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const authError = getMemberAuthErrorFromUrl();
    if (authError) setError(authError);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-boutique-bg px-5 py-10 font-sans text-boutique-brown md:px-8">
      <div className="pointer-events-none fixed inset-0 opacity-45 bg-pattern bg-[length:420px_420px]"></div>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.96)_0%,rgba(252,250,246,0.66)_42%,rgba(252,250,246,0)_78%)]"></div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/80 to-transparent"></div>

      <div className="pointer-events-none absolute top-9 z-10 hidden w-[680px] max-w-[82vw] rounded-full border border-boutique-brown/10 bg-white/60 px-10 py-4 text-center text-xs font-black uppercase tracking-[0.28em] text-boutique-brown/45 shadow-[0_14px_45px_rgba(58,37,26,0.10)] backdrop-blur-md md:block">
        Soft gifts, tiny smiles, magical keepsakes
      </div>

      <div className="pointer-events-none absolute left-[3vw] top-[10vh] z-10 hidden w-72 lg:block xl:left-[6vw]">
        <div className="absolute left-0 top-4 h-28 w-28 rounded-full bg-[#f5d7c8] shadow-inner"></div>
        <div className="absolute left-16 top-8 h-24 w-24 rounded-full bg-[#cfe8f5] shadow-inner"></div>
        <div className="absolute left-10 top-20 h-28 w-44 rounded-t-[4rem] border border-boutique-brown/10 bg-white/75 shadow-[0_18px_50px_rgba(58,37,26,0.12)] backdrop-blur-sm">
          <div className="mx-auto mt-4 w-32 rounded-full bg-[#fff3e0] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-boutique-brown/55">My Baby Shire</div>
          <div className="mt-4 flex h-12 overflow-hidden rounded-b-3xl border-t border-boutique-brown/10">
            <span className="flex-1 bg-[#f5c9bf]"></span><span className="flex-1 bg-[#fff1cf]"></span><span className="flex-1 bg-[#f5c9bf]"></span><span className="flex-1 bg-[#fff1cf]"></span>
          </div>
        </div>
        <div className="absolute -left-2 top-56 text-[92px] drop-shadow-[0_14px_20px_rgba(58,37,26,0.16)]">🧸</div>
        <div className="absolute left-2 top-[350px] grid grid-cols-2 gap-2">
          {['B', 'A', 'B', 'Y'].map((letter) => (
            <div key={letter} className="flex h-14 w-14 items-center justify-center rounded-xl border border-boutique-brown/10 bg-white/70 font-serif text-2xl font-bold text-boutique-brown/55 shadow-md backdrop-blur-sm">{letter}</div>
          ))}
        </div>
        <div className="absolute left-44 top-[390px] flex flex-col items-center gap-1">
          <span className="h-5 w-20 rounded-full bg-[#e9d7b8] shadow"></span>
          <span className="h-5 w-16 rounded-full bg-[#cbdcbf] shadow"></span>
          <span className="h-5 w-12 rounded-full bg-[#f4c8bd] shadow"></span>
          <span className="h-5 w-8 rounded-full bg-[#f7e5b8] shadow"></span>
        </div>
        <div className="absolute left-48 top-24 text-3xl text-[#d8b464] drop-shadow">★</div>
      </div>

      <div className="pointer-events-none absolute right-[2vw] top-[10vh] z-10 hidden w-80 lg:block xl:right-[5vw]">
        <div className="absolute right-10 top-0 h-40 w-28 rounded-[50%] bg-gradient-to-br from-[#f8dfc5] via-[#f5c4b8] to-[#fff2da] shadow-[0_18px_45px_rgba(58,37,26,0.16)]"></div>
        <div className="absolute right-[76px] top-[140px] h-24 w-28 rounded-b-[2rem] border border-boutique-brown/10 bg-[#d7b98c]/75 shadow-xl"></div>
        <div className="absolute right-[94px] top-[151px] text-5xl">🧸</div>
        <div className="absolute right-10 top-64 h-40 w-52 rounded-t-full border border-[#d9b56d]/50 bg-gradient-to-b from-[#f7d2ca] to-[#fff3db] shadow-[0_18px_50px_rgba(58,37,26,0.13)]">
          <div className="absolute inset-x-6 top-10 h-24 rounded-full border-2 border-[#d9b56d]/45"></div>
          <div className="absolute left-8 top-20 text-4xl">🎠</div>
          <div className="absolute right-7 top-20 text-4xl">🎠</div>
        </div>
        <div className="absolute right-4 top-[440px] h-24 w-28 rounded-2xl bg-[#fff2e6] shadow-xl">
          <div className="absolute left-0 top-10 h-4 w-full bg-[#efbeb3]"></div>
          <div className="absolute left-12 top-0 h-full w-4 bg-[#efbeb3]"></div>
          <div className="absolute -top-4 left-8 h-8 w-14 rounded-full bg-[#efbeb3]"></div>
        </div>
        <div className="absolute right-48 top-[458px] flex items-end gap-1">
          <span className="h-10 w-16 rounded-xl bg-[#efb79f] shadow"><span className="mx-auto mt-3 block h-5 w-5 rounded-full bg-[#d9b56d]"></span></span>
          <span className="h-12 w-20 rounded-xl bg-[#e7d3a8] shadow"></span>
          <span className="h-10 w-16 rounded-xl bg-[#b9d2d7] shadow"></span>
        </div>
        <div className="absolute right-6 top-52 text-3xl text-[#d8b464]">★</div>
      </div>

      <Cloud className="left-[16%] bottom-[12%] z-10 hidden h-16 w-36 opacity-80 lg:block" />
      <Cloud className="right-[12%] bottom-[20%] z-10 hidden h-14 w-32 opacity-70 lg:block" />

      <div className="relative z-20 mt-12 w-full max-w-[620px] overflow-visible rounded-[2.5rem] border border-boutique-brown/10 bg-white/94 p-7 shadow-[0_28px_90px_rgba(58,37,26,0.16)] backdrop-blur-md md:p-8">
        <Cloud className="-left-4 top-28 h-11 w-24 opacity-95" />
        <Cloud className="right-9 top-20 h-13 w-28 opacity-95" />
        <div className="pointer-events-none absolute left-1/2 top-52 hidden -translate-x-1/2 items-end gap-2 md:flex">
          <span className="text-6xl drop-shadow-md">🧸</span>
          <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-boutique-brown/10 bg-[#fff3e7] text-2xl shadow-md">🎁</span>
          <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl border border-boutique-brown/10 bg-[#e5d8b8] text-lg shadow-md">♡</span>
        </div>
        <div className="pointer-events-none absolute left-14 top-40 text-3xl text-[#d8b464]">★</div>
        <div className="pointer-events-none absolute right-16 top-36 text-3xl text-[#d8b464]">★</div>

        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light hover:text-boutique-brown">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>

        <div className="mb-7 text-center md:pt-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-boutique-brown text-white shadow-[0_14px_25px_rgba(58,37,26,0.22)]">
            <UserRound className="h-7 w-7" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-boutique-brown-light shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> MY BABY SHIRE
          </div>
          <h1 className="mt-28 font-serif text-5xl leading-none text-boutique-brown md:text-6xl">Welcome back</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-boutique-brown-light md:text-base">
            Sign in to view your orders, save delivery details and enjoy a smoother checkout.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        <div className="mx-auto grid max-w-[430px] gap-3">
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

        <div className="mx-auto mt-5 max-w-[430px] rounded-2xl border border-boutique-brown/10 bg-[#fffaf3]/90 p-4 text-xs leading-relaxed text-boutique-brown-light shadow-sm">
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
