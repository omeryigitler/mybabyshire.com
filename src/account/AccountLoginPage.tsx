import React, { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck, Sparkles, Star, UserRound, X } from 'lucide-react';
import { getMemberAuthErrorFromUrl, startGoogleMemberLogin } from './memberAuth';

const assets = {
  shop: '/login-assets/boutique-shop.png',
  teddy: '/login-assets/teddy-bear.png',
  blocks: '/login-assets/abc-blocks.png',
  moon: '/login-assets/moon-star.png',
  train: '/login-assets/toy-train.png',
  carousel: '/login-assets/carousel.png',
  balloon: '/login-assets/hot-air-balloon.png',
  sign: '/login-assets/balloon-sign.png',
};

const decorativeImageProps = {
  alt: '',
  'aria-hidden': true,
  decoding: 'async' as const,
  loading: 'lazy' as const,
};

const AppleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M17.05 12.38c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.45-1.59-2.98-1.61-1.27-.13-2.48.75-3.12.75-.65 0-1.64-.73-2.7-.71-1.39.02-2.68.81-3.39 2.05-1.45 2.51-.37 6.22 1.04 8.26.69.99 1.51 2.11 2.59 2.07 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.71.65 1.12-.02 1.83-1.01 2.51-2.01.79-1.15 1.12-2.27 1.14-2.33-.03-.01-2.18-.84-2.25-3.35ZM15 6.33c.57-.69.96-1.65.85-2.61-.82.03-1.81.55-2.4 1.23-.53.61-.99 1.59-.86 2.52.91.07 1.84-.46 2.41-1.14Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-1.99 3.02v2.52h3.23c1.89-1.74 2.98-4.3 2.98-7.44Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.23-2.52c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.41 13.89A6.03 6.03 0 0 1 6.09 12c0-.66.11-1.3.32-1.89v-2.6H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.49l3.34-2.6Z" />
    <path fill="#EA4335" d="M12 5.99c1.47 0 2.79.51 3.83 1.5l2.86-2.86C16.96 3.02 14.7 2 12 2a10 10 0 0 0-8.93 5.51l3.34 2.6C7.2 7.75 9.4 5.99 12 5.99Z" />
  </svg>
);

const cloudTones = {
  cream: {
    top: '#fffef9',
    base: '#fff6e9',
    bottom: '#ead8bf',
    stroke: '#ecd6b8',
    blush: '#f7dcc7',
    shadow: 'rgba(112,75,42,0.16)',
  },
  blue: {
    top: '#ffffff',
    base: '#edf8ff',
    bottom: '#d9ebfb',
    stroke: '#c4d8ea',
    blush: '#cfe8fb',
    shadow: 'rgba(76,102,130,0.15)',
  },
  peach: {
    top: '#ffffff',
    base: '#fff0e8',
    bottom: '#f5d7ce',
    stroke: '#eccdc1',
    blush: '#ffd6ca',
    shadow: 'rgba(133,82,61,0.15)',
  },
  mint: {
    top: '#ffffff',
    base: '#effaf3',
    bottom: '#dceee3',
    stroke: '#cbe0d3',
    blush: '#d4efdE',
    shadow: 'rgba(75,117,94,0.14)',
  },
  lavender: {
    top: '#ffffff',
    base: '#f5f0ff',
    bottom: '#e6dcfb',
    stroke: '#d7caee',
    blush: '#eadcff',
    shadow: 'rgba(100,78,134,0.14)',
  },
};

type CloudTone = keyof typeof cloudTones;

const DecorativeCloud = ({ className = '', tone = 'cream' }: { className?: string; tone?: CloudTone }) => {
  const colors = cloudTones[tone];
  const cloudId = useId().replace(/:/g, '');
  const gradientId = `cloud-gradient-${cloudId}`;

  return (
    <div className={`pointer-events-none absolute ${className}`}>
      <svg aria-hidden="true" className="h-full w-full overflow-visible" viewBox="0 0 220 124" style={{ filter: `drop-shadow(0 16px 23px ${colors.shadow})` }}>
        <defs>
          <linearGradient id={gradientId} x1="110" x2="110" y1="10" y2="111" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={colors.top} />
            <stop offset="0.55" stopColor={colors.base} />
            <stop offset="1" stopColor={colors.bottom} />
          </linearGradient>
        </defs>
        <g fill={`url(#${gradientId})`}>
          <ellipse cx="111" cy="81" rx="86" ry="32" />
          <circle cx="43" cy="72" r="28" />
          <circle cx="75" cy="52" r="36" />
          <circle cx="116" cy="46" r="42" />
          <circle cx="158" cy="62" r="34" />
          <circle cx="181" cy="79" r="24" />
        </g>
        <g fill={colors.blush} opacity="0.22">
          <ellipse cx="102" cy="84" rx="58" ry="18" />
          <circle cx="151" cy="72" r="23" />
        </g>
        <path d="M52 51c16-15 43-16 59 0" fill="none" stroke="#fff" strokeLinecap="round" strokeOpacity="0.68" strokeWidth="7" />
        <path d="M123 43c13-8 32-5 42 10" fill="none" stroke="#fff" strokeLinecap="round" strokeOpacity="0.5" strokeWidth="6" />
        <path d="M39 87c26 13 110 16 143 1" fill="none" stroke={colors.bottom} strokeLinecap="round" strokeOpacity="0.32" strokeWidth="6" />
      </svg>
    </div>
  );
};

const FloatingStar = ({ className = '' }: { className?: string }) => (
  <Star className={`pointer-events-none absolute fill-[#e8bd68] text-[#d7a753] drop-shadow-[0_5px_8px_rgba(162,111,53,0.22)] ${className}`} />
);

const AuthButton = ({
  children,
  icon,
  onClick,
  note,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  note?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex min-h-16 w-full items-center justify-center gap-3 rounded-[1.35rem] border border-[#e1d3c4] bg-white/95 px-5 py-4 text-[15px] font-black text-boutique-brown shadow-[0_12px_24px_rgba(58,37,26,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:-translate-y-0.5 hover:border-boutique-wood hover:bg-[#fffaf3]"
  >
    <span className="flex h-8 w-8 items-center justify-center text-boutique-brown">{icon}</span>
    <span className="min-w-0">{children}</span>
    {note && <span className="ml-auto hidden rounded-full bg-[#fff2df] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-boutique-brown-light sm:inline-flex">{note}</span>}
  </button>
);

export default function AccountLoginPage() {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const authError = getMemberAuthErrorFromUrl();
    if (authError) setError(authError);
  }, []);

  return (
    <div className="relative h-dvh overflow-hidden bg-[#fbf5ec] font-sans text-boutique-brown">
      <style>
        {`
          .member-login-panel {
            transform: scale(0.94);
          }

          @media (min-width: 768px) and (max-height: 940px) {
            .member-login-main {
              align-items: flex-start;
            }

            .member-login-panel {
              transform: scale(0.9);
            }
          }

          @media (min-width: 768px) and (max-height: 820px) {
            .member-login-panel {
              transform: scale(0.76);
            }
          }

          @media (max-width: 767px) and (max-height: 760px) {
            .member-login-main {
              align-items: flex-start;
            }

            .member-login-panel {
              transform: scale(0.78);
            }
          }

          @media (max-width: 767px) and (max-height: 700px) {
            .member-login-panel {
              transform: scale(0.7);
            }
          }
        `}
      </style>
      <div className="pointer-events-none absolute inset-0 bg-pattern bg-[length:420px_420px] opacity-[0.22]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.96)_0%,rgba(255,250,243,0.68)_38%,rgba(250,238,220,0.25)_72%,rgba(250,238,220,0)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.78)_58%,rgba(255,250,244,0.92)_100%)]" />

      <div className="pointer-events-none absolute left-4 top-8 hidden h-24 w-24 rounded-full bg-[#f2cfb7]/55 blur-2xl lg:block" />
      <div className="pointer-events-none absolute right-8 top-16 hidden h-28 w-28 rounded-full bg-[#d6e7ea]/50 blur-2xl lg:block" />

      <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
        <img {...decorativeImageProps} src={assets.moon} className="absolute left-[5vw] top-[5vh] w-[clamp(8rem,12vw,15rem)] rotate-[-8deg] drop-shadow-[0_20px_28px_rgba(129,85,44,0.18)]" />
        <div className="absolute left-[8vw] top-[23vh] h-[clamp(7rem,9vw,10.5rem)] w-[clamp(7rem,11vw,13rem)] rotate-[-5deg] overflow-hidden opacity-95 drop-shadow-[0_22px_34px_rgba(129,85,44,0.14)] xl:left-[10vw]">
          <img {...decorativeImageProps} src={assets.sign} className="w-full" />
        </div>
        <img {...decorativeImageProps} src={assets.shop} className="absolute bottom-[11vh] left-[2vw] w-[clamp(14rem,22vw,26rem)] drop-shadow-[0_26px_44px_rgba(122,83,47,0.17)] xl:left-[4vw]" />
        <img {...decorativeImageProps} src={assets.teddy} className="absolute bottom-[2.5vh] left-[12vw] w-[clamp(9rem,15vw,19rem)] drop-shadow-[0_24px_36px_rgba(122,83,47,0.18)]" />
        <img {...decorativeImageProps} src={assets.blocks} className="absolute bottom-[3vh] left-[2vw] w-[clamp(7rem,10vw,12rem)] rotate-[-6deg] drop-shadow-[0_18px_26px_rgba(122,83,47,0.14)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
        <img {...decorativeImageProps} src={assets.carousel} className="absolute bottom-[22vh] right-[4vw] w-[clamp(13rem,20vw,25rem)] drop-shadow-[0_26px_44px_rgba(122,83,47,0.17)]" />
        <img {...decorativeImageProps} src={assets.balloon} className="absolute right-[5vw] top-[6vh] w-[clamp(10rem,14vw,17rem)] rotate-[5deg] drop-shadow-[0_22px_35px_rgba(122,83,47,0.16)]" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[14] hidden h-[25rem] lg:block">
        <DecorativeCloud tone="peach" className="bottom-[-0.7rem] right-[27vw] h-16 w-40 opacity-86" />
        <DecorativeCloud tone="blue" className="bottom-[0.7rem] right-[-1.5vw] h-20 w-48 opacity-78" />
      </div>

      <DecorativeCloud tone="blue" className="left-[24vw] top-[18vh] hidden h-14 w-36 opacity-45 lg:block" />
      <DecorativeCloud tone="cream" className="right-[19vw] top-[22vh] hidden h-24 w-48 opacity-80 lg:block" />
      <DecorativeCloud tone="lavender" className="bottom-[-1.7rem] left-[7vw] hidden h-28 w-64 opacity-80 lg:block" />
      <DecorativeCloud tone="mint" className="bottom-[1rem] right-[-2vw] hidden h-32 w-72 opacity-75 lg:block" />
      <FloatingStar className="left-[24vw] top-[22vh] hidden h-7 w-7 lg:block" />
      <FloatingStar className="right-[31vw] top-[17vh] hidden h-5 w-5 lg:block" />
      <FloatingStar className="right-[23vw] top-[32vh] hidden h-8 w-8 lg:block" />
      <FloatingStar className="bottom-[9vh] left-[34vw] hidden h-5 w-5 lg:block" />

      <main className="member-login-main relative z-10 flex h-full overflow-hidden items-center justify-center px-4 py-7 sm:px-6 lg:px-8">
        <section className="member-login-panel relative mt-0 w-full max-w-[22.5rem] origin-top overflow-visible rounded-[2.5rem] border border-[#decfbe] bg-white/86 px-5 py-7 shadow-[0_34px_90px_rgba(58,37,26,0.19),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-[3px] sm:max-w-[42rem] sm:px-8 md:mt-14 md:px-10 md:py-8 lg:mt-16">
          <DecorativeCloud tone="blue" className="-left-7 top-[8.6rem] hidden h-14 w-36 opacity-60 md:block" />
          <DecorativeCloud tone="peach" className="right-10 top-[5.9rem] hidden h-14 w-36 opacity-60 md:block" />
          <DecorativeCloud tone="lavender" className="-bottom-5 left-11 h-12 w-28 opacity-80" />
          <div className="pointer-events-none absolute -bottom-24 -right-72 z-[16] hidden w-[clamp(18rem,24vw,25rem)] lg:block">
            <div className="absolute bottom-4 left-8 h-10 w-[74%] rotate-[-5deg] rounded-full bg-[#b98251]/24 blur-md" />
            <img {...decorativeImageProps} src={assets.train} className="relative z-10 w-full drop-shadow-[0_30px_40px_rgba(95,61,34,0.28)]" />
          </div>
          <div className="pointer-events-none absolute -right-4 top-[-1.9rem] hidden h-32 w-48 md:block">
            <DecorativeCloud tone="cream" className="right-0 top-0 h-20 w-44 opacity-95" />
            <span className="absolute right-20 top-[4.6rem] h-12 w-px bg-[#c9a16e]/45" />
            <span className="absolute right-10 top-[4.2rem] h-16 w-px bg-[#c9a16e]/45" />
            <FloatingStar className="right-[4.2rem] top-[6.6rem] h-5 w-5" />
            <FloatingStar className="right-[1.8rem] top-[7.7rem] h-6 w-6" />
          </div>
          <FloatingStar className="left-[17%] top-[12.5rem] hidden h-5 w-5 md:block" />
          <FloatingStar className="right-[16%] top-[11.6rem] hidden h-6 w-6 md:block" />
          <FloatingStar className="right-[9%] top-[7.5rem] h-4 w-4" />

          <Link to="/" className="relative z-10 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-black text-boutique-brown-light hover:text-boutique-brown">
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Link>

          <div className="relative z-10 mt-1 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-boutique-brown text-white shadow-[0_16px_28px_rgba(58,37,26,0.24)] md:h-16 md:w-16">
              <UserRound className="h-7 w-7 md:h-8 md:w-8" />
            </div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dfcdbb] bg-[#fffaf3] px-5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-boutique-brown-light shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> MY BABY SHIRE
            </div>

            <div className="relative mx-auto mb-3 flex h-14 max-w-[13.5rem] items-end justify-center md:h-24 md:max-w-[18rem]">
              <img {...decorativeImageProps} src={assets.teddy} className="absolute bottom-1 left-11 h-12 w-12 object-contain drop-shadow-[0_12px_18px_rgba(122,83,47,0.15)] md:h-20 md:w-20" />
              <img {...decorativeImageProps} src={assets.blocks} className="absolute bottom-0 right-10 h-10 w-10 rotate-[5deg] object-contain drop-shadow-[0_12px_18px_rgba(122,83,47,0.14)] md:right-9 md:h-16 md:w-16" />
              <img {...decorativeImageProps} src={assets.train} className="absolute bottom-0 left-1/2 h-10 w-20 -translate-x-1/2 object-contain opacity-90 drop-shadow-[0_12px_18px_rgba(122,83,47,0.12)] md:h-16 md:w-28" />
            </div>

            <div className="flex items-center justify-center gap-4">
              <Sparkles className="hidden h-8 w-8 text-[#d8a855] md:block" />
              <h1 className="max-w-full whitespace-nowrap font-serif text-[clamp(2rem,9vw,2.32rem)] leading-none text-boutique-brown sm:text-[clamp(2.72rem,10vw,4.75rem)]">Welcome back</h1>
              <Sparkles className="hidden h-8 w-8 text-[#d8a855] md:block" />
            </div>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-boutique-brown-light md:text-base">
              Sign in to view your orders, save delivery details and enjoy a smoother checkout.
            </p>
          </div>

          {error && (
            <p className="relative z-10 mx-auto mt-5 w-full max-w-[430px] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
          )}

          <div className="relative z-10 mx-auto mt-6 grid w-full max-w-[430px] gap-3">
            <AuthButton icon={<GoogleIcon />} onClick={startGoogleMemberLogin}>
              Continue with Google
            </AuthButton>
            <AuthButton icon={<AppleIcon />} onClick={() => setNotice({ title: 'Apple sign in', message: 'Apple sign in is coming soon. Please use Google sign in while we finish this option.' })}>
              Continue with Apple
            </AuthButton>
            <AuthButton icon={<Mail className="h-5 w-5" />} onClick={() => setNotice({ title: 'Email sign in', message: 'Email sign in is being prepared. For now, please continue with Google to access your account securely.' })}>
              Continue with Email
            </AuthButton>
          </div>

          <div className="relative z-10 mx-auto mt-5 w-full max-w-[430px] overflow-hidden rounded-[1.35rem] border border-[#dfcdbb] bg-[#fff7ec]/92 p-4 text-xs leading-relaxed text-boutique-brown-light shadow-[0_12px_24px_rgba(58,37,26,0.08)]">
            <DecorativeCloud tone="mint" className="-right-4 -bottom-3 h-12 w-28 opacity-60" />
            <div className="relative z-10 mb-2 flex items-center gap-2 font-black text-boutique-brown">
              <ShieldCheck className="h-5 w-5" /> Secure sign in
            </div>
            <p className="relative z-10 text-sm leading-relaxed">Your account helps us keep your order history and delivery details ready for your next gift.</p>
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
