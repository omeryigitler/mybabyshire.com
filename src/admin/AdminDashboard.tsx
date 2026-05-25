import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Gift, Package, Plus, RefreshCcw, ShoppingCart, Sparkles, Wand2 } from 'lucide-react';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';
import { CardDesignFrame } from '../components/CardDesignFrame';

type DashboardOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentStatus: string;
  paymentProvider?: string;
  orderStatus: string;
  createdAt: string;
};

const StatCard = ({ title, value, note, icon: Icon, tone = 'cream' }: { title: string; value: string | number; note: string; icon: React.ComponentType<{ className?: string }>; tone?: 'cream' | 'green' | 'amber' | 'blue' }) => {
  const toneClass = tone === 'green' ? 'bg-green-50 text-green-800' : tone === 'amber' ? 'bg-amber-50 text-amber-800' : tone === 'blue' ? 'bg-blue-50 text-blue-800' : 'bg-[#fff4df] text-boutique-brown';

  return (
    <div className="relative overflow-hidden rounded-[1.7rem] border border-boutique-brown/10 bg-white/80 p-5 shadow-[0_16px_40px_rgba(58,37,26,0.07)] backdrop-blur-sm">
      <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-8 -top-10 w-32 opacity-25 mix-blend-multiply" alt="" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">{title}</p>
          <p className="mt-4 font-serif text-4xl leading-none text-boutique-brown">{value}</p>
          <p className="mt-2 text-xs text-boutique-brown-light">{note}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${toneClass}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
};

const StatusPill = ({ children, type }: { children: React.ReactNode; type: 'active' | 'draft' | 'paid' | 'pending' | 'order' }) => {
  const classes = type === 'active' || type === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : type === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' : type === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-[#f3f0ea] text-boutique-brown-light border-boutique-brown/10';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}>{children}</span>;
};

export const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const [productsResponse, ordersResponse] = await Promise.all([
        fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const productsData = await productsResponse.json();
      const ordersData = await ordersResponse.json();

      if (!productsResponse.ok) throw new Error(productsData.details || productsData.error || 'Could not load products.');
      if (!ordersResponse.ok) throw new Error(ordersData.details || ordersData.error || 'Could not load orders.');

      setProducts(productsData);
      setOrders(ordersData);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((product) => product.status !== 'draft').length;
    const draftProducts = products.filter((product) => product.status === 'draft').length;
    const personalizedProducts = products.filter((product: any) => product.personalizationEnabled || product.personalizationFields?.length > 0 || product.personalizationRequired).length;
    const totalOrders = orders.length;
    const pendingPayments = orders.filter((order) => order.paymentStatus === 'pending').length;
    const paidOrders = orders.filter((order) => order.paymentStatus === 'paid').length;
    const recordedValue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    return { totalProducts, activeProducts, draftProducts, personalizedProducts, totalOrders, pendingPayments, paidOrders, recordedValue };
  }, [products, orders]);

  const recentProducts = products.slice(0, 4);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-7 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-12 -top-14 w-64 opacity-30 mix-blend-multiply" alt="" />
        <img src="/toy-abc-blocks.png" className="pointer-events-none absolute right-12 bottom-5 w-16 -rotate-6 opacity-35 mix-blend-multiply" alt="" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light"><Sparkles className="h-4 w-4" /> Back office overview</div>
            <h1 className="font-serif text-5xl leading-none text-boutique-brown">Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">A quick view of Little Wonders orders, products, payments, and next actions.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadDashboard} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-5 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50"><RefreshCcw className="h-4 w-4" /> Refresh</button>
            <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood"><Plus className="h-4 w-4" /> Add Product</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Orders" value={isLoading ? '—' : stats.totalOrders} icon={ShoppingCart} note="All customer requests" tone="cream" />
        <StatCard title="Paid Orders" value={isLoading ? '—' : stats.paidOrders} icon={CheckCircle2} note="Confirmed payments" tone="green" />
        <StatCard title="Pending Payment" value={isLoading ? '—' : stats.pendingPayments} icon={Clock3} note="Needs payment follow-up" tone="amber" />
        <StatCard title="Recorded Value" value={isLoading ? '—' : `$${stats.recordedValue.toFixed(2)}`} icon={Gift} note="Total order value" tone="blue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Products" value={isLoading ? '—' : stats.totalProducts} icon={Package} note="Catalog items" tone="cream" />
        <StatCard title="Active" value={isLoading ? '—' : stats.activeProducts} icon={CheckCircle2} note="Visible in storefront" tone="green" />
        <StatCard title="Drafts" value={isLoading ? '—' : stats.draftProducts} icon={AlertCircle} note="Not visible yet" tone="amber" />
        <StatCard title="Personalized" value={isLoading ? '—' : stats.personalizedProducts} icon={Wand2} note="Custom gift products" tone="blue" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/82 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-boutique-brown/10 bg-[#fffaf3]/70 p-5">
            <div><h2 className="font-serif text-3xl text-boutique-brown">Recent Orders</h2><p className="mt-1 text-sm text-boutique-brown-light">Latest payment and fulfillment activity.</p></div>
            <Link to="/admin/orders" className="inline-flex items-center gap-1 rounded-full border border-boutique-brown/10 bg-white px-4 py-2 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df]">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="divide-y divide-boutique-brown/10">
            {isLoading && <div className="p-6 text-sm text-boutique-brown-light">Loading orders...</div>}
            {!isLoading && recentOrders.length === 0 && <div className="p-6 text-sm text-boutique-brown-light">No orders yet.</div>}
            {!isLoading && recentOrders.map((order) => (
              <Link key={order.id} to="/admin/orders" className="flex items-center gap-4 p-4 transition-colors hover:bg-[#fffaf3]/70">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm"><ShoppingCart className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1"><p className="font-bold text-boutique-brown">{order.orderNumber}</p><p className="mt-1 truncate text-xs text-boutique-brown-light">{order.customerName} · {order.customerEmail}</p></div>
                <div className="text-right"><p className="font-bold text-boutique-brown">${Number(order.totalAmount || 0).toFixed(2)}</p><div className="mt-1 flex justify-end gap-1.5"><StatusPill type={order.paymentStatus === 'paid' ? 'paid' : 'pending'}>{order.paymentStatus}</StatusPill><StatusPill type="order">{order.paymentProvider || '—'}</StatusPill></div></div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-boutique-brown p-6 text-white shadow-[0_20px_55px_rgba(58,37,26,0.18)]">
            <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-10 -top-10 w-44 opacity-20 mix-blend-screen" alt="" />
            <div className="relative z-10 mb-5 flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="font-serif text-3xl">Quick Actions</h2></div>
            <div className="relative z-10 space-y-3">
              <Link to="/admin/products/new" className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15">Add a new product <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/admin/products" className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15">Manage catalog <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/admin/orders" className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15">Review orders <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/admin/templates" className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15">Personalization setup <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-boutique-brown/10 bg-white/82 p-6 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
            <h2 className="font-serif text-3xl text-boutique-brown">Next Setup</h2>
            <div className="mt-5 space-y-3 text-sm text-boutique-brown-light">
              <div className="rounded-2xl bg-[#fffaf3] p-4"><span className="font-bold text-boutique-brown">1.</span> Polish product form details and validation.</div>
              <div className="rounded-2xl bg-[#fffaf3] p-4"><span className="font-bold text-boutique-brown">2.</span> Add customer email notifications.</div>
              <div className="rounded-2xl bg-[#fffaf3] p-4"><span className="font-bold text-boutique-brown">3.</span> Verify Apple Pay, Google Pay and Link in Stripe.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/82 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-boutique-brown/10 bg-[#fffaf3]/70 p-5">
          <div><h2 className="font-serif text-3xl text-boutique-brown">Recent Products</h2><p className="mt-1 text-sm text-boutique-brown-light">Latest catalog items from your admin database.</p></div>
          <Link to="/admin/products" className="inline-flex items-center gap-1 rounded-full border border-boutique-brown/10 bg-white px-4 py-2 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df]">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {isLoading && <div className="text-sm text-boutique-brown-light">Loading products...</div>}
          {!isLoading && recentProducts.length === 0 && <div className="text-sm text-boutique-brown-light">No products yet. Add your first product to start building the storefront.</div>}
          {!isLoading && recentProducts.map((product) => (
            <Link key={product.id} to={`/admin/products/${product.id}/edit`} className="group relative overflow-hidden rounded-[1.5rem] border border-boutique-brown/10 bg-[#fffaf3] p-4 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="relative h-36 overflow-hidden rounded-[1.2rem] bg-white">
                {product.bgImage && <CardDesignFrame value={product.bgImage} className="absolute inset-0 h-full w-full opacity-40" legacyClassName="absolute inset-0 h-full w-full object-cover opacity-40" />}
                {product.imageUrl ? <img src={product.imageUrl} className="relative z-10 h-full w-full object-contain p-3" alt="" /> : <div className="flex h-full w-full items-center justify-center text-boutique-brown/30"><Package className="h-8 w-8" /></div>}
              </div>
              <div className="mt-4"><h3 className="truncate font-serif text-xl text-boutique-brown">{product.name}</h3><p className="mt-1 truncate text-xs text-boutique-brown-light">{product.description}</p><div className="mt-3 flex items-center justify-between"><span className="font-bold text-boutique-brown">${product.price.toFixed(2)}</span><StatusPill type={product.status === 'draft' ? 'draft' : 'active'}>{product.status || 'active'}</StatusPill></div></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
