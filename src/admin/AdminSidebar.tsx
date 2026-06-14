import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onNavigate?: () => void;
  onSignOut: () => void;
}

export const AdminSidebar = ({ isMobileOpen = false, onNavigate, onSignOut }: AdminSidebarProps) => {
  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Personalization', path: '/admin/templates', icon: Wand2 },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Image Library', path: '/admin/images', icon: ImageIcon },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
    <button
      type="button"
      onClick={onNavigate}
      className={`fixed inset-0 z-30 bg-boutique-brown/28 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-label="Close admin menu"
      tabIndex={isMobileOpen ? 0 : -1}
    />

    <aside className={`fixed left-0 top-0 z-40 flex h-dvh w-[min(18rem,86vw)] flex-col border-r border-boutique-brown/10 bg-white/90 shadow-[18px_0_52px_rgba(58,37,26,0.16)] backdrop-blur-xl transition-transform duration-300 md:z-20 md:h-screen md:w-64 md:translate-x-0 md:bg-white/78 md:shadow-[12px_0_40px_rgba(58,37,26,0.06)] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="relative overflow-hidden border-b border-boutique-brown/10 px-5 py-4 md:py-5">
        <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-8 -top-8 w-32 opacity-35 mix-blend-multiply" alt="" />
        <img src="/decorative-moon-star.png" className="pointer-events-none absolute right-5 bottom-4 w-8 rotate-12 opacity-45" alt="" />
        <div className="relative z-10 flex flex-col items-start">
          <BrandLogo variant="footer" className="!w-[154px] !max-w-full md:!w-[184px]" />
          <p className="mt-1 pl-1 text-[11px] font-bold uppercase tracking-[0.22em] text-boutique-brown/55">Back Office</p>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-boutique-brown/10 bg-white/78 text-boutique-brown shadow-sm md:hidden"
          aria-label="Close admin menu"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3 md:gap-1 md:py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all md:rounded-2xl md:py-3 ${
                isActive
                  ? 'bg-[#fff4df] text-boutique-brown shadow-sm ring-1 ring-boutique-brown/10'
                  : 'text-boutique-brown-light hover:bg-white hover:text-boutique-brown hover:shadow-sm'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors md:h-9 md:w-9 ${isActive ? 'bg-boutique-brown text-white' : 'bg-boutique-bg text-boutique-brown-light group-hover:bg-[#fff4df] group-hover:text-boutique-brown'}`}>
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-boutique-brown/10 p-3 md:p-4">
        <div className="mb-3 hidden rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] p-3 text-xs leading-relaxed text-boutique-brown-light md:block">
          <span className="font-bold text-boutique-brown">Gift studio mode</span><br />
          Manage orders, products and personalization with care.
        </div>
        <button
          onClick={() => {
            onNavigate?.();
            onSignOut();
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-boutique-brown-light transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm"><LogOut className="h-4.5 w-4.5" /></span>
          Sign Out
        </button>
      </div>
    </aside>
    </>
  );
};
