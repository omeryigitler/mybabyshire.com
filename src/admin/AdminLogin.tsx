import React, { FormEvent, useEffect, useState } from 'react';
import { Apple, Lock, Mail, Sparkles } from 'lucide-react';
import { getAdminAuthErrorFromUrl, loginAdmin, startGoogleAdminLogin } from './adminAuth';

interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-boutique-bg px-6 py-10 font-sans text-boutique-brown">
      <div className="pointer-events-none fixed inset-0 opacity-40 bg-pattern bg-[length:420px_420px]"></div>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.92)_0%,rgba(252,250,246,0.55)_42%,rgba(252,250,246,0)_78%)]"></div>
      <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-14 top-24 hidden w-72 opacity-40 mix-blend-multiply md:block" alt="" />
      <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-14 bottom-16 hidden w-72 opacity-35 mix-blend-multiply md:block" alt="" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/86 p-7 shadow-[0_24px_70px_rgba(58,37,26,0.12)] backdrop-blur-sm"
      >
        <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute right-8 top-8 w-9 rotate-12 opacity-35 mix-blend-multiply" alt="" />
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-boutique-brown text-white shadow-sm">
            <Lock className="h-6 w-6" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-boutique-brown-light">
            <Sparkles className="h-3.5 w-3.5" /> Little Wonders
          </div>
          <h1 className="font-serif text-4xl leading-none text-boutique-brown">Admin Sign In</h1>
          <p className="mt-2 text-sm text-boutique-brown-light">Choose email, Google, or Apple when it becomes available.</p>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={startGoogleAdminLogin}
            className="flex h-12 items-center justify-center gap-3 rounded-2xl border border-boutique-brown/10 bg-white text-sm font-bold text-boutique-brown shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#fffaf3]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base font-black text-[#4285f4] shadow-sm">G</span>
            Continue with Google
          </button>
          <button
            type="button"
            disabled
            className="flex h-12 items-center justify-center gap-3 rounded-2xl border border-boutique-brown/10 bg-[#f3f0ea] text-sm font-bold text-boutique-brown/45"
          >
            <Apple className="h-5 w-5" />
            Apple Coming Soon
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-boutique-brown/10"></div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-boutique-brown/45">Email sign in</span>
          <div className="h-px flex-1 bg-boutique-brown/10"></div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-boutique-brown/35" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] py-3 pl-11 pr-4 text-sm text-boutique-brown outline-none placeholder:text-boutique-brown/35 focus:ring-2 focus:ring-boutique-wood/25"
                autoComplete="username"
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] px-4 py-3 text-sm text-boutique-brown outline-none placeholder:text-boutique-brown/35 focus:ring-2 focus:ring-boutique-wood/25"
              autoComplete="current-password"
              placeholder="Password"
              required
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-boutique-brown px-4 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood disabled:translate-y-0 disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in with Email'}
        </button>
      </form>
    </div>
  );
};
