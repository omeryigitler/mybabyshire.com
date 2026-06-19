import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, DollarSign, Package, Plus, RefreshCcw, ShoppingCart, Sparkles, Wand2 } from 'lucide-react';
import { Product } from '../store/useStore';
import { getAdminToken } from './adminAuth';
import { CardDesignFrame } from '../components/CardDesignFrame';
import { Badge, Button, EmptyState, PageHeader, Panel, StatCard, Table, TD, TH } from './ui';

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

const paymentTone = (status: string) => (status === 'paid' ? 'green' : status === 'refunded' ? 'gray' : 'amber');

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
    const paidValue = orders.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const avgOrder = paidOrders > 0 ? paidValue / paidOrders : 0;
    return { totalProducts, activeProducts, draftProducts, personalizedProducts, totalOrders, pendingPayments, paidOrders, paidValue, avgOrder };
  }, [products, orders]);

  const recentProducts = products.slice(0, 4);
  const recentOrders = orders.slice(0, 6);

  const money = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Back office overview"
        icon={Sparkles}
        title="Dashboard"
        description="A quick view of MY BABY SHIRE revenue, orders, products, and next actions."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCcw} onClick={loadDashboard} disabled={isLoading}>Refresh</Button>
            <Link to="/admin/products/new"><Button variant="primary" icon={Plus}>Add Product</Button></Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Paid Revenue" value={isLoading ? '—' : money(stats.paidValue)} icon={DollarSign} tone="green" hint="Confirmed payments" />
        <StatCard label="Orders" value={isLoading ? '—' : stats.totalOrders} icon={ShoppingCart} tone="cream" hint={`${stats.paidOrders} paid`} />
        <StatCard label="Pending Payment" value={isLoading ? '—' : stats.pendingPayments} icon={Clock3} tone="amber" hint="Needs follow-up" />
        <StatCard label="Avg Order Value" value={isLoading ? '—' : money(stats.avgOrder)} icon={CheckCircle2} tone="blue" hint="Per paid order" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Products" value={isLoading ? '—' : stats.totalProducts} icon={Package} tone="cream" hint="Catalog items" />
        <StatCard label="Active" value={isLoading ? '—' : stats.activeProducts} icon={CheckCircle2} tone="green" hint="Visible in storefront" />
        <StatCard label="Drafts" value={isLoading ? '—' : stats.draftProducts} icon={AlertCircle} tone="amber" hint="Not visible yet" />
        <StatCard label="Personalized" value={isLoading ? '—' : stats.personalizedProducts} icon={Wand2} tone="blue" hint="Custom gifts" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <Panel
          title="Recent Orders"
          description="Latest payment and fulfillment activity."
          bodyClassName=""
          actions={<Link to="/admin/orders"><Button variant="secondary" icon={ArrowRight}>View all</Button></Link>}
        >
          {isLoading ? (
            <div className="p-6 text-sm text-boutique-brown-light">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No orders yet" description="Orders will appear here as customers check out." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <TH>Order</TH>
                  <TH>Customer</TH>
                  <TH>Payment</TH>
                  <TH className="text-right">Total</TH>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-[#fffaf3]/60">
                    <TD>
                      <Link to="/admin/orders" className="font-bold text-boutique-brown hover:text-boutique-wood">{order.orderNumber}</Link>
                      <div className="mt-0.5 text-[11px] text-boutique-brown-light">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </TD>
                    <TD>
                      <div className="max-w-[200px] truncate font-medium">{order.customerName}</div>
                      <div className="max-w-[200px] truncate text-[11px] text-boutique-brown-light">{order.customerEmail}</div>
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={paymentTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
                        {order.paymentProvider && <Badge tone="neutral">{order.paymentProvider}</Badge>}
                      </div>
                    </TD>
                    <TD className="text-right font-bold">{money(Number(order.totalAmount || 0))}</TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-boutique-brown/10 bg-boutique-brown p-5 text-white shadow-[0_14px_40px_rgba(58,37,26,0.16)]">
            <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-10 -top-10 w-40 opacity-20 mix-blend-screen" alt="" />
            <div className="relative z-10 mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="text-[15px] font-bold tracking-tight">Quick Actions</h2></div>
            <div className="relative z-10 space-y-2">
              <Link to="/admin/products/new" className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/15">Add a new product <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/admin/orders" className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/15">Review orders <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/admin/reviews" className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/15">Moderate reviews <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/admin/coupons" className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/15">Manage coupons <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          <Panel title="Catalog health">
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between"><span className="text-boutique-brown-light">Active products</span><span className="font-bold text-boutique-brown">{isLoading ? '—' : stats.activeProducts}</span></div>
              <div className="flex items-center justify-between"><span className="text-boutique-brown-light">Drafts</span><span className="font-bold text-boutique-brown">{isLoading ? '—' : stats.draftProducts}</span></div>
              <div className="flex items-center justify-between"><span className="text-boutique-brown-light">Personalized</span><span className="font-bold text-boutique-brown">{isLoading ? '—' : stats.personalizedProducts}</span></div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Recent Products"
        description="Latest catalog items."
        actions={<Link to="/admin/products"><Button variant="secondary" icon={ArrowRight}>View all</Button></Link>}
      >
        {isLoading ? (
          <div className="text-sm text-boutique-brown-light">Loading products...</div>
        ) : recentProducts.length === 0 ? (
          <EmptyState icon={Package} title="No products yet" description="Add your first product to start building the storefront." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recentProducts.map((product) => (
              <Link key={product.id} to={`/admin/products/${product.id}/edit`} className="group rounded-xl border border-boutique-brown/10 bg-[#fffaf3] p-3 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative h-32 overflow-hidden rounded-lg bg-white">
                  {product.bgImage && <CardDesignFrame value={product.bgImage} className="absolute inset-0 h-full w-full opacity-40" legacyClassName="absolute inset-0 h-full w-full object-cover opacity-40" />}
                  {product.imageUrl ? <img src={product.imageUrl} className="relative z-10 h-full w-full object-contain p-3" alt="" /> : <div className="flex h-full w-full items-center justify-center text-boutique-brown/30"><Package className="h-8 w-8" /></div>}
                </div>
                <div className="mt-3">
                  <h3 className="truncate font-bold text-boutique-brown">{product.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-boutique-brown">${product.price.toFixed(2)}</span>
                    <Badge tone={product.status === 'draft' ? 'gray' : 'green'}>{product.status || 'active'}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};
