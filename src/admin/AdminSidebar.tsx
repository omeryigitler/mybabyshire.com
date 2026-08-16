import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Boxes,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tags,
  Ticket,
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

type NavItem = {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navSections: { label?: string; items: NavItem[] }[] = [
  {
    items: [{ name: 'Dashboard', path: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'Catalog',
    items: [
      { name: 'Products', path: '/admin/products', icon: Package },
      { name: 'Inventory', path: '/admin/inventory', icon: Boxes },
      { name: 'Categories', path: '/admin/categories', icon: Tags },
    ],
  },
  {
    label: 'Sales',
    items: [
      { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
      { name: 'Customers', path: '/admin/customers', icon: Users },
      { name: 'Discounts', path: '/admin/coupons', icon: Ticket },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Reviews', path: '/admin/reviews', icon: Star },
      { name: 'Media', path: '/admin/images', icon: ImageIcon },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { name: 'Personalization', path: '/admin/templates', icon: Wand2 },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

export const AdminSidebar = ({ isMobileOpen = false, onNavigate, onSignOut }: AdminSidebarProps) => {
  return (
    <>
      <button
        type="button"
        onClick={onNavigate}
        className={`fixed inset-0 z-30 bg-black/25 transition-opacity duration-200 md:hidden ${isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-label="Close admin menu"
        tabIndex={isMobileOpen ? 0 : -1}
      />

      <aside className={`fixed left-0 top-0 z-40 flex h-dvh w-[min(18rem,88vw)] flex-col border-r border-[#e5e5e5] bg-white transition-transform duration-200 md:z-20 md:w-64 md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex min-h-[78px] items-center justify-between border-b border-[#ededed] px-5">
          <div>
            <BrandLogo variant="nav" className="!h-[40px] !max-w-[190px] !drop-shadow-none" />
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#999]">Commerce Admin</p>
          </div>
          <button type="button" onClick={onNavigate} className="commerce-focus inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5] md:hidden" aria-label="Close admin menu">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section, sectionIndex) => (
            <div key={section.label || `primary-${sectionIndex}`} className={sectionIndex > 0 ? 'mt-5' : ''}>
              {section.label && <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a0a0a0]">{section.label}</p>}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === '/admin'}
                    onClick={onNavigate}
                    className={({ isActive }) => `commerce-focus group flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-[#202020] text-white' : 'text-[#5f5f5f] hover:bg-[#f5f5f5] hover:text-[#202020]'}`}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`h-[17px] w-[17px] shrink-0 ${isActive ? 'text-white' : 'text-[#777] group-hover:text-[#202020]'}`} />
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#ededed] p-3">
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onSignOut();
            }}
            className="commerce-focus flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-sm font-medium text-[#666] transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-[17px] w-[17px]" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};