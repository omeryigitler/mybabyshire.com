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
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar onSignOut={handleSignOut} />
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
};
