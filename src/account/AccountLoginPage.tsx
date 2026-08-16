import React, { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, X } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { clearMemberSession, getMemberAuthErrorFromUrl, startGoogleMemberLogin } from './memberAuth';
import { loginAdmin } from '../admin/adminAuth';

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

const AuthButton = ({ children, icon, onClick }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#deded9] bg-white px-5 text-sm font-semibold text-[#202020] transition-colors hover:border-[#b9b9b2] hover:bg-[#fafaf8]"
  >
    <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
    <span>{children}</span>
  </button>
);

export default function AccountLoginPage() {
  const [authError, setAuthError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [isEmailLoginOpen, setIsEmailLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const errorFromUrl = getMemberAuthErrorFromUrl();
    if (errorFromUrl) setAuthError(errorFromUrl);
  }, []);

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError('');
    setIsSubmitting(true);

    try {
      await loginAdmin(email.trim(), password);
      clearMemberSession();
      window.location.replace('/admin');
    } catch (loginError) {
      setEmailError((loginError as Error).message || 'Email or password is incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#f6f6f3] font-sans text-[#202020]">
      <header className="border-b border-[#e7e7e2] bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#555550] transition-colors hover:text-[#202020]">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to shop</span>
          </Link>
          <Link to="/" aria-label="MY BABY SHIRE home" className="absolute left-1/2 -translate-x-1/2">
            <BrandLogo variant="nav" className="!h-10 !max-w-[240px] sm:!h-11" />
          </Link>
          <div className="w-9 sm:w-[96px]" />
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-stretch px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-12">
        <section className="hidden overflow-hidden rounded-l-3xl border border-r-0 border-[#e5dadd] bg-[#f8e9ed] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#76545c]">MY BABY SHIRE account</p>
            <h1 className="mt-5 max-w-sm text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#292326]">Everything for your orders, in one place.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#6b5a5f]">Sign in to review orders, keep delivery details ready and move through checkout faster.</p>
          </div>

          <div className="space-y-3">
            {[
              'View current and past orders',
              'Keep delivery information ready',
              'Use secure account access',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/55 px-4 py-3 text-sm font-medium text-[#4e3d42]">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center rounded-3xl border border-[#e4e4df] bg-white p-5 shadow-[0_18px_55px_rgba(20,20,18,0.07)] sm:p-8 lg:rounded-l-none lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a8a82]">Account</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-[#202020] sm:text-5xl">Welcome back</h2>
            <p className="mt-4 text-sm leading-6 text-[#66665f] sm:text-base">Choose how you would like to continue.</p>

            {authError && (
              <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{authError}</p>
            )}

            <div className="mt-8 grid gap-3">
              <AuthButton icon={<GoogleIcon />} onClick={startGoogleMemberLogin}>Continue with Google</AuthButton>
              <AuthButton icon={<AppleIcon />} onClick={() => setNotice({ title: 'Apple sign in', message: 'Apple sign in is coming soon. Please use Google sign in while we finish this option.' })}>Continue with Apple</AuthButton>
              <AuthButton
                icon={<Mail className="h-5 w-5" />}
                onClick={() => {
                  setEmailError('');
                  setIsEmailLoginOpen(true);
                }}
              >
                Continue with Email
              </AuthButton>
            </div>

            <div className="mt-6 flex items-start gap-3 border-t border-[#ecece8] pt-5 text-sm leading-6 text-[#6d6d66]">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#202020]" />
              <p>Your account keeps order history and delivery details available for your next checkout.</p>
            </div>
          </div>
        </section>
      </main>

      {notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl border border-[#e4e4df] bg-white p-6 shadow-2xl">
            <button type="button" onClick={() => setNotice(null)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-[#66665f] hover:bg-[#f4f4f1] hover:text-[#202020]" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#202020]">{notice.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#66665f]">{notice.message}</p>
            <button type="button" onClick={() => setNotice(null)} className="mt-6 h-12 w-full rounded-xl bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-black">Got it</button>
          </section>
        </div>
      )}

      {isEmailLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="email-login-title" className="w-full max-w-md rounded-2xl border border-[#e4e4df] bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a8a82]">Email access</p>
                <h2 id="email-login-title" className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#202020]">Continue with email</h2>
                <p className="mt-2 text-sm leading-6 text-[#66665f]">Sign in and we will route you to the correct account area.</p>
              </div>
              <button type="button" onClick={() => setIsEmailLoginOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#66665f] hover:bg-[#f4f4f1] hover:text-[#202020]" aria-label="Close email sign in">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-xs font-semibold text-[#4b4b46]">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a82]" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-xl border border-[#dcdcd7] bg-white pl-11 pr-4 text-sm text-[#202020] outline-none placeholder:text-[#a2a29b] focus:border-[#202020] focus:ring-1 focus:ring-[#202020]"
                    autoComplete="username"
                    placeholder="name@example.com"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-xs font-semibold text-[#4b4b46]">Password</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a82]" />
                  <input
                    id="login-password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-xl border border-[#dcdcd7] bg-white pl-11 pr-12 text-sm text-[#202020] outline-none placeholder:text-[#a2a29b] focus:border-[#202020] focus:ring-1 focus:ring-[#202020]"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                  />
                  <button type="button" onClick={() => setIsPasswordVisible((visible) => !visible)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#777770] hover:bg-[#f4f4f1] hover:text-[#202020]" aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}>
                    {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {emailError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{emailError}</p>}

              <button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-black disabled:cursor-wait disabled:opacity-50">
                {isSubmitting ? 'Signing in...' : 'Continue'}
              </button>
            </form>

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#f6f6f3] px-4 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#202020]" />
              <p className="text-xs leading-5 text-[#66665f]">Approved administrator emails open the Back Office. Customer accounts continue through Google.</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
