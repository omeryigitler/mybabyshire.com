import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminLogin } from './AdminLogin';
import { clearAdminSession, getStoredAdminToken } from './adminAuth';
import { BrandLogo } from '../components/BrandLogo';

export const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredAdminToken()));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleSignOut = () => {
    clearAdminSession();
    setIsAuthenticated(false);
    window.location.assign('/');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-boutique-bg font-sans text-boutique-brown">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-35 bg-pattern bg-[length:420px_420px]"></div>
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92)_0%,rgba(252,250,246,0.60)_36%,rgba(252,250,246,0)_76%)]"></div>
      <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none fixed right-[-70px] top-24 z-0 hidden w-72 opacity-35 mix-blend-multiply xl:block" alt="" />
      <img src="/cloud-watercolor-pink.png" className="pointer-events-none fixed left-[235px] bottom-[-40px] z-0 hidden w-64 opacity-30 mix-blend-multiply xl:block" alt="" />
      <img src="/toy-abc-blocks.png" className="pointer-events-none fixed right-10 bottom-14 z-0 hidden w-20 -rotate-6 opacity-30 mix-blend-multiply xl:block" alt="" />

      <header className="fixed inset-x-0 top-0 z-30 flex min-h-[74px] items-center justify-between border-b border-boutique-brown/10 bg-white/86 px-4 shadow-[0_12px_34px_rgba(58,37,26,0.08)] backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] text-boutique-brown shadow-sm"
          aria-label="Open admin menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
        <BrandLogo variant="nav" className="!h-[42px] !max-w-[210px]" />
        <span className="h-11 w-11" aria-hidden="true" />
      </header>

      <AdminSidebar
        isMobileOpen={isMobileMenuOpen}
        onNavigate={() => setIsMobileMenuOpen(false)}
        onSignOut={handleSignOut}
      />
      <main className="relative z-10 min-h-screen px-4 pb-7 pt-24 sm:px-5 md:ml-64 md:px-8 md:py-8 xl:px-10 2xl:px-12">
        <div className="mx-auto w-full max-w-[1440px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
