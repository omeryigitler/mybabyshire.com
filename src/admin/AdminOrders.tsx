import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Gift, Mail, MapPin, PackageCheck, RefreshCcw, Search, ShieldCheck, ShoppingCart, Sparkles, Truck, UserRound } from 'lucide-react';
import { getAdminToken } from './adminAuth';

type OrderItem = { id: string; productId: string; productName: string; quantity: number; price: number; personalizationData: Record<string, string>; };

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  paymentProvider?: string;
  orderStatus: string;
  trackingReference?: string | null;
  createdAt: string;
  customer?: { address?: string; city?: string; state?: string; zip?: string; } | null;
  subtotal?: number | null;
  shipping?: number | null;
  items: OrderItem[];
};

const getPaymentBadgeClass = (status: string) => {
  if (status === 'paid') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'refunded') return 'bg-gray-100 text-gray-700 border-gray-200';
  return 'bg-amber-100 text-amber-800 border-amber-200';
};

const getProviderBadgeClass = (provider?: string) => {
  if (provider === 'PayPal') return 'bg-[#eef5ff] text-[#003087] border-[#d7e7ff]';
  if (provider === 'Stripe') return 'bg-[#f3f0ff] text-[#635bff] border-[#e2ddff]';
  return 'bg-gray-50 text-gray-500 border-gray-200';
};

const getOrderBadgeClass = (status: string) => {
  if (status === 'delivered') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'shipped') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (status === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-[#f3f0ea] text-boutique-brown-light border-boutique-brown/10';
};

const StatCard = ({ title, value, icon: Icon, note }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }>; note: string }) => (
  <div className="relative overflow-hidden rounded-[1.7rem] border border-boutique-brown/10 bg-white/80 p-5 shadow-[0_16px_40px_rgba(58,37,26,0.07)] backdrop-blur-sm">
    <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-8 -top-10 w-32 opacity-25 mix-blend-multiply" alt="" />
    <div className="relative z-10 flex items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">{title}</p><p className="mt-4 font-serif text-4xl leading-none text-boutique-brown">{value}</p><p className="mt-2 text-xs text-boutique-brown-light">{note}</p></div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm"><Icon className="h-5 w-5" /></div>
    </div>
  </div>
);

const DetailCard = ({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) => (
  <div className="rounded-[1.5rem] border border-boutique-brown/10 bg-[#fffaf3] p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-boutique-brown shadow-sm"><Icon className="h-4.5 w-4.5" /></div>
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">{title}</h3>
    </div>
    {children}
  </div>
);

export const AdminOrders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [draftOrderStatus, setDraftOrderStatus] = useState('processing');
  const [draftPaymentStatus, setDraftPaymentStatus] = useState('pending');
  const [draftTrackingReference, setDraftTrackingReference] = useState('');

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not load orders.');
      setOrders(data);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const openOrder = (order: AdminOrder) => {
    setSelectedOrder(order);
    setDraftOrderStatus(order.orderStatus || 'processing');
    setDraftPaymentStatus(order.paymentStatus || 'pending');
    setDraftTrackingReference(order.trackingReference || '');
  };

  const updateSelectedOrder = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderStatus: draftOrderStatus, paymentStatus: draftPaymentStatus, trackingReference: draftTrackingReference.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not update order.');
      const updatedOrder = { ...selectedOrder, orderStatus: data.orderStatus, paymentStatus: data.paymentStatus, trackingReference: data.trackingReference };
      setSelectedOrder(updatedOrder);
      setOrders((currentOrders) => currentOrders.map((order) => order.id === selectedOrder.id ? updatedOrder : order));
      alert('Order updated successfully.');
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => order.orderNumber.toLowerCase().includes(query) || order.customerName.toLowerCase().includes(query) || order.customerEmail.toLowerCase().includes(query) || order.orderStatus.toLowerCase().includes(query) || order.paymentStatus.toLowerCase().includes(query) || (order.paymentProvider || '').toLowerCase().includes(query));
  }, [orders, searchTerm]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter((order) => order.paymentStatus === 'pending').length;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-7 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-12 -top-14 w-64 opacity-30 mix-blend-multiply" alt="" />
        <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute right-10 bottom-6 w-10 rotate-12 opacity-35 mix-blend-multiply" alt="" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light"><Sparkles className="h-4 w-4" /> Gift requests</div><h1 className="font-serif text-5xl leading-none text-boutique-brown">Orders</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">Review customer gift requests, personalization details, payment providers, and shipping progress.</p></div>
          <button onClick={loadOrders} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-boutique-brown px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood disabled:opacity-50"><RefreshCcw className="h-4 w-4" /> Refresh</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Orders" value={isLoading ? '—' : orders.length} icon={ShoppingCart} note="All recorded gift orders" />
        <StatCard title="Pending Payment" value={isLoading ? '—' : pendingOrders} icon={PackageCheck} note="Orders still awaiting payment" />
        <StatCard title="Recorded Value" value={`$${totalRevenue.toFixed(2)}`} icon={Mail} note="Total order value recorded" />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/82 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <div className="border-b border-boutique-brown/10 p-5"><div className="relative max-w-sm"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-boutique-brown/35" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search orders..." className="w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] py-3 pl-12 pr-4 text-sm text-boutique-brown outline-none transition-all placeholder:text-boutique-brown/45 focus:ring-2 focus:ring-boutique-wood/25" /></div></div>
        <table className="w-full border-collapse text-left">
          <thead><tr className="border-b border-boutique-brown/10 bg-[#fffaf3]/70 text-xs uppercase tracking-[0.14em] text-boutique-brown/55"><th className="px-6 py-4 font-bold">Order</th><th className="px-6 py-4 font-bold">Customer</th><th className="px-6 py-4 font-bold">Status</th><th className="px-6 py-4 font-bold">Payment</th><th className="px-6 py-4 font-bold">Total</th><th className="px-6 py-4 text-right font-bold">Actions</th></tr></thead>
          <tbody className="divide-y divide-boutique-brown/10 text-sm">
            {isLoading && <tr><td colSpan={6} className="px-6 py-10 text-center text-boutique-brown-light">Loading orders...</td></tr>}
            {!isLoading && filteredOrders.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-boutique-brown-light">No orders found.</td></tr>}
            {!isLoading && filteredOrders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-[#fffaf3]/70">
                <td className="px-6 py-4"><div className="font-bold text-boutique-brown">{order.orderNumber}</div><div className="mt-1 text-xs text-boutique-brown-light">{new Date(order.createdAt).toLocaleString()}</div></td>
                <td className="px-6 py-4"><div className="font-semibold text-boutique-brown">{order.customerName}</div><div className="mt-1 text-xs text-boutique-brown-light">{order.customerEmail}</div></td>
                <td className="px-6 py-4"><span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getOrderBadgeClass(order.orderStatus)}`}>{order.orderStatus}</span></td>
                <td className="px-6 py-4"><div className="flex flex-col items-start gap-1.5"><span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getPaymentBadgeClass(order.paymentStatus)}`}>{order.paymentStatus}</span><span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black ${getProviderBadgeClass(order.paymentProvider)}`}>via {order.paymentProvider || 'Not selected'}</span></div></td>
                <td className="px-6 py-4 font-bold text-boutique-brown">${order.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4 text-right"><button onClick={() => openOrder(order)} className="rounded-full border border-boutique-brown/10 bg-white px-4 py-2 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df]">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-boutique-brown/35 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2.2rem] border border-boutique-brown/10 bg-white shadow-[0_30px_100px_rgba(58,37,26,0.28)]">
            <div className="sticky top-0 z-10 overflow-hidden border-b border-boutique-brown/10 bg-[#fffaf3] p-6">
              <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-10 -top-12 w-56 opacity-30 mix-blend-multiply" alt="" />
              <img src="/decorative-moon-star.png" className="pointer-events-none absolute right-12 bottom-5 w-8 rotate-12 opacity-45" alt="" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">Order Reference</p>
                  <h2 className="mt-2 font-serif text-4xl text-boutique-brown">{selectedOrder.orderNumber}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getOrderBadgeClass(selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</span>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPaymentBadgeClass(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getProviderBadgeClass(selectedOrder.paymentProvider)}`}>via {selectedOrder.paymentProvider || 'Not selected'}</span>
                  </div>
                  <p className="mt-3 text-sm text-boutique-brown-light">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="rounded-full border border-boutique-brown/10 bg-white px-4 py-2 text-sm font-bold text-boutique-brown shadow-sm hover:bg-boutique-bg">Close</button>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailCard icon={UserRound} title="Customer"><p className="font-bold text-boutique-brown">{selectedOrder.customerName}</p><p className="mt-1 text-sm text-boutique-brown-light">{selectedOrder.customerEmail}</p></DetailCard>
                  <DetailCard icon={MapPin} title="Shipping address">{selectedOrder.customer ? <p className="text-sm leading-relaxed text-boutique-brown-light">{selectedOrder.customer.address}<br />{selectedOrder.customer.city}, {selectedOrder.customer.state} {selectedOrder.customer.zip}</p> : <p className="text-sm text-boutique-brown-light">No address snapshot</p>}</DetailCard>
                  <DetailCard icon={CreditCard} title="Payment"><div className="flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${getPaymentBadgeClass(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span><span className={`rounded-full border px-3 py-1 text-xs font-black ${getProviderBadgeClass(selectedOrder.paymentProvider)}`}>{selectedOrder.paymentProvider || 'Not selected'}</span></div><p className="mt-3 text-xs leading-relaxed text-boutique-brown-light">Payment provider is stored for faster operations and easier reconciliation.</p></DetailCard>
                  <DetailCard icon={Truck} title="Shipment"><p className="font-bold text-boutique-brown">{selectedOrder.trackingReference || 'Not shipped yet'}</p><p className="mt-1 text-sm text-boutique-brown-light">Tracking reference can be added or updated from the status panel.</p></DetailCard>
                </div>

                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light"><Gift className="h-4 w-4" /> Items in this order</div>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="relative overflow-hidden rounded-[1.5rem] border border-boutique-brown/10 bg-white p-5 shadow-sm">
                        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-10 -top-12 w-40 opacity-20 mix-blend-multiply" alt="" />
                        <div className="relative z-10 flex justify-between gap-4">
                          <div><p className="font-serif text-2xl text-boutique-brown">{item.productName}</p><p className="mt-1 text-sm text-boutique-brown-light">Qty {item.quantity} × ${item.price.toFixed(2)}</p></div>
                          <div className="rounded-2xl bg-[#fffaf3] px-4 py-3 text-right"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-boutique-brown/50">Line total</p><p className="font-bold text-boutique-brown">${(item.quantity * item.price).toFixed(2)}</p></div>
                        </div>
                        {Object.keys(item.personalizationData).length > 0 && (
                          <div className="relative z-10 mt-4 rounded-2xl bg-[#fffaf3] p-4 text-xs text-boutique-brown-light">
                            <p className="mb-2 font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Personalization</p>
                            {Object.entries(item.personalizationData).map(([key, value]) => <div key={key} className="py-0.5"><span className="font-bold text-boutique-brown">{key}: </span>{String(value)}</div>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-[1.6rem] border border-boutique-brown/10 bg-[#fffaf3] p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-boutique-brown shadow-sm"><PackageCheck className="h-4.5 w-4.5" /></div><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Manage order</h3></div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-[0.12em] text-boutique-brown/50">Order status</label>
                    <select value={draftOrderStatus} onChange={(event) => setDraftOrderStatus(event.target.value)} className="w-full rounded-2xl border border-boutique-brown/10 bg-white px-3 py-3 text-sm text-boutique-brown outline-none"><option value="processing">processing</option><option value="shipped">shipped</option><option value="delivered">delivered</option><option value="cancelled">cancelled</option></select>
                    <label className="block text-xs font-bold uppercase tracking-[0.12em] text-boutique-brown/50">Payment status</label>
                    <select value={draftPaymentStatus} onChange={(event) => setDraftPaymentStatus(event.target.value)} className="w-full rounded-2xl border border-boutique-brown/10 bg-white px-3 py-3 text-sm text-boutique-brown outline-none"><option value="pending">pending</option><option value="paid">paid</option><option value="refunded">refunded</option></select>
                    <label className="block text-xs font-bold uppercase tracking-[0.12em] text-boutique-brown/50">Tracking reference</label>
                    <input value={draftTrackingReference} onChange={(event) => setDraftTrackingReference(event.target.value)} className="w-full rounded-2xl border border-boutique-brown/10 bg-white px-3 py-3 text-sm text-boutique-brown outline-none" placeholder="Add tracking reference" />
                    <button onClick={updateSelectedOrder} disabled={isUpdating} className="mt-2 w-full rounded-full bg-boutique-brown px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-boutique-wood disabled:opacity-50">{isUpdating ? 'Saving...' : 'Save Status'}</button>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-boutique-brown/10 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800"><ShieldCheck className="h-4.5 w-4.5" /></div><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Order summary</h3></div>
                  <div className="space-y-3 text-sm text-boutique-brown-light"><div className="flex justify-between"><span>Payment provider</span><span className="font-bold text-boutique-brown">{selectedOrder.paymentProvider || 'Not selected'}</span></div><div className="flex justify-between"><span>Subtotal</span><span>${Number(selectedOrder.subtotal || 0).toFixed(2)}</span></div><div className="flex justify-between"><span>Shipping</span><span>${Number(selectedOrder.shipping || 0).toFixed(2)}</span></div><div className="flex justify-between"><span>Tracking</span><span className="text-right">{selectedOrder.trackingReference || 'Not added yet'}</span></div><div className="flex justify-between border-t border-boutique-brown/10 pt-3 font-serif text-2xl text-boutique-brown"><span>Total</span><span>${selectedOrder.totalAmount.toFixed(2)}</span></div></div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
