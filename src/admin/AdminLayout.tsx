import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { clearAdminSession, getStoredAdminToken } from './adminAuth';
import { BrandLogo } from '../components/BrandLogo';
import { AdminNoticeDialog, type AdminNotice } from './AdminNoticeDialog';
import { ADMIN_CONFIRM_EVENT, ADMIN_NOTICE_EVENT, type AdminConfirmEventDetail, type AdminNoticePayload } from './adminDialogs';

export const AdminLayout = () => {
  const isAuthenticated = Boolean(getStoredAdminToken());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const confirmResolver = useRef<((confirmed: boolean) => void) | null>(null);

  useEffect(() => {
    const handleConfirmRequest = (event: Event) => {
      const detail = (event as CustomEvent<AdminConfirmEventDetail>).detail;
      if (!detail) return;
      confirmResolver.current?.(false);
      confirmResolver.current = detail.resolve;
      setNotice({ kind: 'confirm', title: detail.title, message: detail.message });
    };

    const handleNotice = (event: Event) => {
      const detail = (event as CustomEvent<AdminNoticePayload>).detail;
      if (!detail) return;
      setNotice(detail);
    };
    window.addEventListener(ADMIN_CONFIRM_EVENT, handleConfirmRequest);
    window.addEventListener(ADMIN_NOTICE_EVENT, handleNotice);
    return () => {
      window.removeEventListener(ADMIN_CONFIRM_EVENT, handleConfirmRequest);
      window.removeEventListener(ADMIN_NOTICE_EVENT, handleNotice);
      confirmResolver.current?.(false);
      confirmResolver.current = null;
    };
  }, []);

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

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleSignOut = () => {
    clearAdminSession();
    window.location.assign('/login');
  };

  const closeNotice = () => {
    if (notice?.kind === 'confirm') confirmResolver.current?.(false);
    confirmResolver.current = null;
    setNotice(null);
  };

  const confirmNotice = () => {
    confirmResolver.current?.(true);
    confirmResolver.current = null;
    setNotice(null);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-sans text-[#202020]">
      <header className="fixed inset-x-0 top-0 z-30 flex min-h-[68px] items-center justify-between border-b border-[#e6e6e6] bg-white px-4 md:hidden">
        <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-[9px] border border-[#dedede] bg-white hover:bg-[#f6f6f6]" aria-label="Open admin menu" aria-expanded={isMobileMenuOpen}>
          <Menu className="h-5 w-5" />
        </button>
        <BrandLogo variant="nav" className="!h-[38px] !max-w-[200px] !drop-shadow-none" />
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <AdminSidebar isMobileOpen={isMobileMenuOpen} onNavigate={() => setIsMobileMenuOpen(false)} onSignOut={handleSignOut} />

      <main className="min-h-screen px-4 pb-8 pt-[88px] sm:px-5 md:ml-64 md:px-7 md:py-7 lg:px-9 lg:py-9">
        <div className="mx-auto w-full max-w-[1480px]"><Outlet /></div>
      </main>

      {notice && <AdminNoticeDialog notice={notice} onClose={closeNotice} onConfirm={notice.kind === 'confirm' ? confirmNotice : undefined} />}
    </div>
  );
};
