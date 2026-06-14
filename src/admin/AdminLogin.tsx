import React, { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { getAdminAuthErrorFromUrl, loginAdmin, startGoogleAdminLogin } from './adminAuth';

interface AdminLoginProps {
  onLogin: () => void;
}

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-1.99 3.02v2.52h3.23c1.89-1.74 2.98-4.3 2.98-7.44Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.23-2.52c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.41 13.89A6.03 6.03 0 0 1 6.09 12c0-.66.11-1.3.32-1.89v-2.6H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.49l3.34-2.6Z" />
    <path fill="#EA4335" d="M12 5.99c1.47 0 2.79.51 3.83 1.5l2.86-2.86C16.96 3.02 14.7 2 12 2a10 10 0 0 0-8.93 5.51l3.34 2.6C7.2 7.75 9.4 5.99 12 5.99Z" />
  </svg>
);

export const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    const authError = getAdminAuthErrorFromUrl();
    if (authError) setError(authError);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await loginAdmin(email.trim(), password);
      onLogin();
    } catch (loginError) {
      setError((loginError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('');
    startGoogleAdminLogin();
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-boutique-bg px-4 py-6 font-sans text-boutique-brown sm:px-6">
      <div className="pointer-events-none fixed inset-0 bg-pattern bg-[length:420px_420px] opacity-35" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.96)_0%,rgba(252,250,246,0.68)_42%,rgba(252,250,246,0)_78%)]" />
      <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-16 top-12 hidden w-72 opacity-45 mix-blend-multiply md:block" alt="" />
      <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-20 bottom-8 hidden w-80 opacity-40 mix-blend-multiply md:block" alt="" />
      <img src="/toy-abc-blocks.png" className="pointer-events-none absolute bottom-7 right-[8vw] hidden w-24 -rotate-6 opacity-35 mix-blend-multiply lg:block" alt="" />

      <section className="relative z-10 w-full max-w-[29rem] overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/90 p-5 shadow-[0_26px_80px_rgba(58,37,26,0.14)] backdrop-blur-md sm:p-7">
        <img src="/decorative-moon-star.png" className="pointer-events-none absolute right-5 top-5 w-10 rotate-12 opacity-35" alt="" />

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-black text-boutique-brown-light transition-colors hover:bg-[#fff4df] hover:text-boutique-brown"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>

        <div className="mb-5 mt-4 text-center">
          <BrandLogo variant="login" className="mx-auto !h-[54px] !max-w-[280px] sm:!h-[62px]" />
          <div className="mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-boutique-brown text-white shadow-[0_10px_24px_rgba(58,37,26,0.2)]">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-boutique-brown/50">Back Office</p>
          <h1 className="mt-1 font-serif text-4xl leading-none text-boutique-brown">Admin sign in</h1>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-boutique-brown/10 bg-white text-sm font-black text-boutique-brown shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#fffaf3]"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-boutique-brown/10" />
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-boutique-brown/45">or use admin email</span>
          <div className="h-px flex-1 bg-boutique-brown/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-[11px] font-black uppercase tracking-[0.13em] text-boutique-brown/55">
              Admin email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-boutique-brown/35" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-13 w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] pl-11 pr-4 text-sm font-semibold text-boutique-brown outline-none placeholder:text-boutique-brown/30 focus:border-boutique-wood/40 focus:ring-2 focus:ring-boutique-wood/15"
                autoComplete="username"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-[11px] font-black uppercase tracking-[0.13em] text-boutique-brown/55">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-boutique-brown/35" />
              <input
                id="admin-password"
                type={isPasswordVisible ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-13 w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] pl-11 pr-12 text-sm font-semibold text-boutique-brown outline-none placeholder:text-boutique-brown/30 focus:border-boutique-wood/40 focus:ring-2 focus:ring-boutique-wood/15"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-boutique-brown/45 transition-colors hover:bg-white hover:text-boutique-brown"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              >
                {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-13 w-full items-center justify-center rounded-2xl bg-boutique-brown px-4 text-sm font-black text-white shadow-[0_12px_26px_rgba(58,37,26,0.18)] transition-all hover:-translate-y-0.5 hover:bg-boutique-wood disabled:translate-y-0 disabled:cursor-wait disabled:opacity-55"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in to Back Office'}
          </button>
        </form>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] px-4 py-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <p className="text-xs font-semibold leading-relaxed text-boutique-brown-light">
            Restricted to approved MY BABY SHIRE administrators.
          </p>
        </div>
      </section>
    </div>
  );
};
