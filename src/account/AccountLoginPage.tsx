import React, { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { clearMemberSession, getMemberAuthErrorFromUrl, startGoogleMemberLogin } from './memberAuth';
import { loginAdmin } from '../admin/adminAuth';

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-1.99 3.02v2.52h3.23c1.89-1.74 2.98-4.3 2.98-7.44Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.23-2.52c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.41 13.89A6.03 6.03 0 0 1 6.09 12c0-.66.11-1.3.32-1.89v-2.6H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.49l3.34-2.6Z" />
    <path fill="#EA4335" d="M12 5.99c1.47 0 2.79.51 3.83 1.5l2.86-2.86C16.96 3.02 14.7 2 12 2a10 10 0 0 0-8.93 5.51l3.34 2.6C7.2 7.75 9.4 5.99 12 5.99Z" />
  </svg>
);

const inputClass = 'h-12 w-full rounded-[9px] border border-[#dcdcdc] bg-white px-3.5 text-sm text-[#202020] outline-none placeholder:text-[#aaa] focus:border-[#202020] focus:ring-1 focus:ring-[#202020]';

export default function AccountLoginPage() {
  const [authError, setAuthError] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const errorFromUrl = getMemberAuthErrorFromUrl();
    if (errorFromUrl) setAuthError(errorFromUrl);
  }, []);

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError('');
    setSubmitting(true);

    try {
      await loginAdmin(email.trim(), password);
      clearMemberSession();
      window.location.replace('/admin');
    } catch (error) {
      setAdminError((error as Error).message || 'Admin email or password is incorrect.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#f7f7f7] font-sans text-[#202020]">
      <header className="border-b border-[#e7e7e7] bg-white">
        <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" className="commerce-focus inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#202020]"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back to shop</span></Link>
          <Link to="/" aria-label="MY BABY SHIRE home"><BrandLogo variant="nav" className="!h-10 !max-w-[240px] !drop-shadow-none sm:!h-11" /></Link>
          <div />
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-5xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="grid w-full overflow-hidden rounded-[14px] border border-[#e2e2e2] bg-white shadow-[0_18px_55px_rgba(20,20,18,0.06)] lg:grid-cols-[.9fr_1.1fr]">
          <section className="hidden bg-[#f3e5e9] p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a5a63]">MY BABY SHIRE account</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-[-0.035em]">Orders and delivery details in one place.</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#6d5a60]">Sign in with Google to view previous website orders associated with your email. New purchases and their tracking are handled on Etsy.</p>
            </div>
            <div className="space-y-2 text-sm text-[#514247]">
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Secure Google account access</p>
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Order history linked by email</p>
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Saved address checkout autofill</p>
            </div>
          </section>

          <section className="p-6 sm:p-9 lg:p-12">
            <div className="mx-auto max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#999]">Customer account</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-[#707070]">Customer accounts currently use Google sign-in.</p>

              {authError && <div role="alert" className="mt-5 rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{authError}</div>}

              <button type="button" onClick={startGoogleMemberLogin} className="commerce-focus mt-7 flex h-13 w-full items-center justify-center gap-3 rounded-[9px] border border-[#d8d8d8] bg-white px-5 text-sm font-semibold hover:border-[#999] hover:bg-[#fafafa]">
                <GoogleIcon /> Continue with Google
              </button>

              <div className="my-7 flex items-center gap-3"><div className="h-px flex-1 bg-[#ececec]" /><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa]">Store administration</span><div className="h-px flex-1 bg-[#ececec]" /></div>

              {!adminOpen ? (
                <button type="button" onClick={() => setAdminOpen(true)} className="commerce-focus flex h-12 w-full items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-[#383838]"><LockKeyhole className="h-4 w-4" /> Admin sign in</button>
              ) : (
                <form onSubmit={handleAdminLogin} className="rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] p-4">
                  <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" /><h3 className="text-sm font-semibold">Admin email access</h3></div>
                  <div className="mt-4 space-y-3">
                    <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClass} pl-10`} placeholder="Admin email" autoComplete="username" required /></div>
                    <div className="relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" /><input type={passwordVisible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pl-10 pr-11`} placeholder="Password" autoComplete="current-password" required /><button type="button" onClick={() => setPasswordVisible((current) => !current)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[7px] text-[#777] hover:bg-[#eee]" aria-label={passwordVisible ? 'Hide password' : 'Show password'}>{passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                  </div>
                  {adminError && <p role="alert" className="mt-3 text-xs font-medium text-red-600">{adminError}</p>}
                  <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => { setAdminOpen(false); setAdminError(''); }} className="commerce-focus h-11 rounded-[9px] border border-[#dcdcdc] bg-white text-sm font-semibold hover:bg-[#f5f5f5]">Cancel</button><button type="submit" disabled={submitting} className="commerce-focus h-11 rounded-[9px] bg-[#202020] text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50">{submitting ? 'Signing in…' : 'Sign in'}</button></div>
                </form>
              )}

              <p className="mt-5 text-xs leading-5 text-[#888]">Apple sign-in and customer email/password access are not shown until those providers are actually configured.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
