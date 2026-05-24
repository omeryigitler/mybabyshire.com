import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminLogin } from './AdminLogin';
import { clearAdminSession, getStoredAdminToken } from './adminAuth';

export const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredAdminToken()));

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleSignOut = () => {
    clearAdminSession();
    setIsAuthenticated(false);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-boutique-bg font-sans text-boutique-brown">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-35 bg-pattern bg-[length:420px_420px]"></div>
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92)_0%,rgba(252,250,246,0.60)_36%,rgba(252,250,246,0)_76%)]"></div>
      <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none fixed right-[-70px] top-24 z-0 hidden w-72 opacity-35 mix-blend-multiply xl:block" alt="" />
      <img src="/cloud-watercolor-pink.png" className="pointer-events-none fixed left-[235px] bottom-[-40px] z-0 hidden w-64 opacity-30 mix-blend-multiply xl:block" alt="" />
      <img src="/toy-abc-blocks.png" className="pointer-events-none fixed right-10 bottom-14 z-0 hidden w-20 -rotate-6 opacity-30 mix-blend-multiply xl:block" alt="" />

      <AdminSidebar onSignOut={handleSignOut} />
      <main className="relative z-10 min-h-screen pl-72 pr-8 py-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
