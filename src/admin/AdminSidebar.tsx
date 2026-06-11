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
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

interface AdminSidebarProps {
  onSignOut: () => void;
}

export const AdminSidebar = ({ onSignOut }: AdminSidebarProps) => {
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
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-boutique-brown/10 bg-white/78 shadow-[12px_0_40px_rgba(58,37,26,0.06)] backdrop-blur-xl">
      <div className="relative overflow-hidden border-b border-boutique-brown/10 px-5 py-5">
        <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-8 -top-8 w-32 opacity-35 mix-blend-multiply" alt="" />
        <img src="/decorative-moon-star.png" className="pointer-events-none absolute right-5 bottom-4 w-8 rotate-12 opacity-45" alt="" />
        <div className="relative z-10 flex flex-col items-start">
          <BrandLogo variant="footer" className="!w-[184px] !max-w-full" />
          <p className="mt-1 pl-1 text-[11px] font-bold uppercase tracking-[0.22em] text-boutique-brown/55">Back Office</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all ${
                isActive
                  ? 'bg-[#fff4df] text-boutique-brown shadow-sm ring-1 ring-boutique-brown/10'
                  : 'text-boutique-brown-light hover:bg-white hover:text-boutique-brown hover:shadow-sm'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-boutique-brown text-white' : 'bg-boutique-bg text-boutique-brown-light group-hover:bg-[#fff4df] group-hover:text-boutique-brown'}`}>
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-boutique-brown/10 p-4">
        <div className="mb-3 rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] p-3 text-xs leading-relaxed text-boutique-brown-light">
          <span className="font-bold text-boutique-brown">Gift studio mode</span><br />
          Manage orders, products and personalization with care.
        </div>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-boutique-brown-light transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm"><LogOut className="h-4.5 w-4.5" /></span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};
