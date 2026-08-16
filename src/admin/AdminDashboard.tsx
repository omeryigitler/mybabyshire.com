import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Boxes, Package, Plus, RefreshCcw, ShoppingCart } from 'lucide-react';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';

type DashboardOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  currency?: string;
  paymentStatus: string;
  orderStatus: string;
  shipmentStatus?: string | null;
  createdAt: string;
};

type Variant = { id: string; productId: string; productName?: string; sku: string; color: string; size: string; stockQuantity: number; active: boolean };
const money = (value: number, currency = 'USD') => `${currency} ${Number(value || 0).toFixed(2)}`;
const titleCase = (value?: string | null) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = getAdminToken();
      const [productsResponse, ordersResponse, variantsResponse] = await Promise.all([
        fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/variants', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [productsData, ordersData, variantsData] = await Promise.all([productsResponse.json(), ordersResponse.json(), variantsResponse.json()]);
      if (!productsResponse.ok) throw new Error(productsData.details || productsData.error || 'Could not load products.');
      if (!ordersResponse.ok) throw new Error(ordersData.details || ordersData.error || 'Could not load orders.');
      if (!variantsResponse.ok) throw new Error(variantsData.details || variantsData.error || 'Could not load inventory.');
      setProducts(Array.isArray(productsData) ? productsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setVariants(Array.isArray(variantsData) ? variantsData : []);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadDashboard(); }, []);

  const stats = useMemo(() => ({
    activeProducts: products.filter((product) => (product.status || 'active') !== 'draft').length,
    orders: orders.length,
    activeVariants: variants.filter((variant) => variant.active).length,
    lowStock: variants.filter((variant) => variant.active && variant.stockQuantity <= 5).length,
  }), [products, orders, variants]);

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  const lowStockVariants = variants.filter((variant) => variant.active && variant.stockQuantity <= 5).sort((a, b) => a.stockQuantity - b.stockQuantity).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Commerce admin</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em]">Dashboard</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Catalog, order and inventory overview. Payment and shipping provider configuration stays separate until real credentials and rules are supplied.</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => void loadDashboard()} disabled={isLoading} className="commerce-focus inline-flex min-h-11 items-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-semibold hover:bg-[#f7f7f7] disabled:opacity-50"><RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh</button><Link to="/admin/products?create=1" className="commerce-focus inline-flex min-h-11 items-center gap-2 rounded-[9px] bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-[#383838]"><Plus className="h-4 w-4" /> Add product</Link></div>
      </div>

      {error && <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Orders" value={isLoading ? '—' : stats.orders} icon={ShoppingCart} />
        <Metric label="Active products" value={isLoading ? '—' : stats.activeProducts} icon={Package} />
        <Metric label="Active variants" value={isLoading ? '—' : stats.activeVariants} icon={Boxes} />
        <Metric label="Low stock" value={isLoading ? '—' : stats.lowStock} icon={AlertTriangle} warning={stats.lowStock > 0} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-[#ececec] p-5"><div><h2 className="font-semibold">Recent orders</h2><p className="mt-1 text-xs text-[#888]">Latest order activity.</p></div><Link to="/admin/orders" className="commerce-focus inline-flex items-center gap-1.5 text-xs font-semibold text-[#666] hover:text-[#202020]">View all <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left"><thead><tr className="border-b border-[#ececec] bg-[#fafafa] text-[10px] font-bold uppercase tracking-[0.12em] text-[#888]"><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-[#eeeeee] text-sm">{isLoading && <tr><td colSpan={4} className="px-5 py-10 text-center text-[#777]">Loading orders...</td></tr>}{!isLoading && recentOrders.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-[#777]">No orders yet.</td></tr>}{!isLoading && recentOrders.map((order) => <tr key={order.id} className="hover:bg-[#fafafa]"><td className="px-5 py-4"><p className="font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-[#888]">{new Date(order.createdAt).toLocaleDateString()}</p></td><td className="px-5 py-4"><p className="font-medium">{order.customerName}</p><p className="mt-1 max-w-[220px] truncate text-xs text-[#888]">{order.customerEmail}</p></td><td className="px-5 py-4"><span className="rounded-full bg-[#f1f1f1] px-2.5 py-1 text-[10px] font-semibold text-[#666]">{titleCase(order.orderStatus)}</span></td><td className="px-5 py-4 text-right font-semibold">{money(order.totalAmount, order.currency || 'USD')}</td></tr>)}</tbody></table></div>
        </section>

        <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5">
          <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Low stock</h2><p className="mt-1 text-xs text-[#888]">Active variants with 5 or fewer units.</p></div><Link to="/admin/inventory" className="commerce-focus text-xs font-semibold text-[#666] hover:text-[#202020]">Inventory</Link></div>
          <div className="mt-4 divide-y divide-[#eeeeee]">{isLoading && <p className="py-6 text-center text-sm text-[#777]">Loading inventory...</p>}{!isLoading && lowStockVariants.length === 0 && <p className="py-6 text-center text-sm text-[#777]">No low-stock variants.</p>}{!isLoading && lowStockVariants.map((variant) => <div key={variant.id} className="flex items-start justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{variant.productName || 'Product'}</p><p className="mt-1 truncate text-xs text-[#888]">{variant.color} · {variant.size} · {variant.sku}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${variant.stockQuantity === 0 ? 'bg-red-50 text-red-700' : 'bg-[#fff3d9] text-[#8a641e]'}`}>{variant.stockQuantity}</span></div>)}</div>
        </section>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/admin/products" label="Products" text="Edit catalog information" />
        <QuickLink to="/admin/inventory" label="Inventory" text="Manage Color × Size stock" />
        <QuickLink to="/admin/orders" label="Orders" text="Review order activity" />
        <QuickLink to="/admin/reviews" label="Reviews" text="Moderate customer reviews" />
      </section>
    </div>
  );
};

const Metric = ({ label, value, icon: Icon, warning = false }: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }>; warning?: boolean }) => <div className="rounded-[11px] border border-[#e3e3e3] bg-white p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">{label}</p><div className="mt-2 flex items-center gap-2"><Icon className={`h-4 w-4 ${warning ? 'text-[#a25c42]' : 'text-[#888]'}`} /><span className={`text-xl font-semibold sm:text-2xl ${warning ? 'text-[#a25c42]' : ''}`}>{value}</span></div></div>;
const QuickLink = ({ to, label, text }: { to: string; label: string; text: string }) => <Link to={to} className="commerce-focus group rounded-[11px] border border-[#e3e3e3] bg-white p-4 hover:border-[#bdbdbd]"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-[#888]">{text}</p></div><ArrowRight className="h-4 w-4 text-[#999] transition-transform group-hover:translate-x-0.5" /></div></Link>;
