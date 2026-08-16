import React, { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, PackageCheck, RefreshCcw, Search, ShoppingCart, StickyNote, Truck, UserRound, X } from 'lucide-react';
import { getAdminToken } from './adminAuth';

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  personalizationData: Record<string, string>;
};

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
  trackingNumber?: string | null;
  carrier?: string | null;
  shipmentStatus?: string | null;
  shipmentStatusLabel?: string | null;
  estimatedDelivery?: string | null;
  trackingUrl?: string | null;
  internalNote?: string | null;
  shippingMethod?: string | null;
  shippingService?: string | null;
  createdAt: string;
  customer?: { address?: string; city?: string; state?: string; zip?: string } | null;
  giftMessage?: string | null;
  subtotal?: number | null;
  discount?: number | null;
  couponCode?: string | null;
  shipping?: number | null;
  tax?: number | null;
  taxLabel?: string | null;
  items: OrderItem[];
};

type FilterMode = 'all' | 'pending' | 'processing' | 'shipped';

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
];

const ORDER_STATUS_OPTIONS = ['pending', 'processing', 'fulfilled', 'completed', 'cancelled'];
const titleCase = (value?: string | null) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = (amount: number | null | undefined, currency = 'USD') => `${currency} ${Number(amount || 0).toFixed(2)}`;

const StatusBadge = ({ value, tone }: { value: string; tone?: 'green' | 'amber' | 'gray' | 'blue' }) => {
  const classes = tone === 'green' ? 'bg-[#eaf5ee] text-[#316942]' : tone === 'amber' ? 'bg-[#fff3d9] text-[#8a641e]' : tone === 'blue' ? 'bg-[#edf4fa] text-[#466a80]' : 'bg-[#f1f1f1] text-[#666]';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}>{titleCase(value)}</span>;
};

export const AdminOrders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [draftOrderStatus, setDraftOrderStatus] = useState('processing');
  const [internalNote, setInternalNote] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadOrders = async () => {
    setIsLoading(true);
    setFeedback('');
    try {
      const response = await fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${getAdminToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not load orders.');
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadOrders(); }, []);

  const openOrder = (order: AdminOrder) => {
    setSelectedOrder(order);
    setDraftOrderStatus(order.orderStatus || 'processing');
    setInternalNote(order.internalNote || '');
    setFeedback('');
  };

  const saveOrder = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    setFeedback('');
    try {
      const response = await fetch(`/api/admin/orders?id=${encodeURIComponent(selectedOrder.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ orderStatus: draftOrderStatus, internalNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not update order.');
      const updated = { ...selectedOrder, orderStatus: data.orderStatus || draftOrderStatus, internalNote: data.internalNote ?? internalNote };
      setSelectedOrder(updated);
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
      setFeedback('Order saved.');
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !query || `${order.orderNumber} ${order.customerName} ${order.customerEmail} ${order.orderStatus} ${order.paymentStatus}`.toLowerCase().includes(query);
      const shipment = String(order.shipmentStatus || '').toLowerCase();
      const status = String(order.orderStatus || '').toLowerCase();
      const matchesFilter = filterMode === 'all'
        || (filterMode === 'pending' && (order.paymentStatus === 'pending' || status === 'pending'))
        || (filterMode === 'processing' && ['processing', 'paid', 'order_confirmed', 'preparing_shipment'].includes(status) || ['preparing_shipment', 'order_confirmed'].includes(shipment))
        || (filterMode === 'shipped' && ['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(shipment));
      return matchesSearch && matchesFilter;
    });
  }, [orders, searchTerm, filterMode]);

  const pendingCount = orders.filter((order) => order.paymentStatus === 'pending' || order.orderStatus === 'pending').length;
  const processingCount = orders.filter((order) => ['processing', 'paid'].includes(order.orderStatus)).length;
  const shippedCount = orders.filter((order) => ['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(String(order.shipmentStatus || ''))).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Sales</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em] text-[#202020]">Orders</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Review customer orders, items and fulfillment status. Payment and carrier data remain provider-driven.</p>
        </div>
        <button type="button" onClick={() => void loadOrders()} disabled={isLoading} className="commerce-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-semibold hover:bg-[#f7f7f7] disabled:opacity-50"><RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Total" value={orders.length} icon={ShoppingCart} />
        <Metric label="Pending" value={pendingCount} icon={PackageCheck} />
        <Metric label="Processing" value={processingCount} icon={PackageCheck} />
        <Metric label="Shipped" value={shippedCount} icon={Truck} />
      </div>

      {feedback && !selectedOrder && <div className="rounded-[10px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#666]">{feedback}</div>}

      <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#ececec] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="hide-scrollbar flex gap-2 overflow-x-auto">
            {FILTERS.map((filter) => <button key={filter.value} type="button" onClick={() => setFilterMode(filter.value)} className={`commerce-focus whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold ${filterMode === filter.value ? 'border-[#202020] bg-[#202020] text-white' : 'border-[#dedede] bg-white hover:border-[#aaa]'}`}>{filter.label}</button>)}
          </div>
          <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search order, customer or email" className="commerce-focus h-11 w-full rounded-[9px] border border-[#dedede] bg-white pl-10 pr-4 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" /></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead><tr className="border-b border-[#ececec] bg-[#fafafa] text-[10px] font-bold uppercase tracking-[0.12em] text-[#888]"><th className="px-5 py-3.5">Order</th><th className="px-5 py-3.5">Customer</th><th className="px-5 py-3.5">Order status</th><th className="px-5 py-3.5">Payment</th><th className="px-5 py-3.5">Shipment</th><th className="px-5 py-3.5">Total</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-[#eeeeee] text-sm">
              {isLoading && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#777]">Loading orders...</td></tr>}
              {!isLoading && filteredOrders.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#777]">No orders found.</td></tr>}
              {!isLoading && filteredOrders.map((order) => <tr key={order.id} className="hover:bg-[#fafafa]"><td className="px-5 py-4"><p className="font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-[#888]">{new Date(order.createdAt).toLocaleDateString()}</p></td><td className="px-5 py-4"><p className="font-medium">{order.customerName}</p><p className="mt-1 text-xs text-[#888]">{order.customerEmail}</p></td><td className="px-5 py-4"><StatusBadge value={order.orderStatus} tone={order.orderStatus === 'completed' || order.orderStatus === 'fulfilled' ? 'green' : order.orderStatus === 'cancelled' ? 'gray' : 'blue'} /></td><td className="px-5 py-4"><StatusBadge value={order.paymentStatus} tone={order.paymentStatus === 'paid' ? 'green' : order.paymentStatus === 'pending' ? 'amber' : 'gray'} /></td><td className="px-5 py-4"><span className="text-[#666]">{order.shipmentStatusLabel || titleCase(order.shipmentStatus) || 'Not set'}</span></td><td className="px-5 py-4 font-semibold">{money(order.totalAmount, order.currency)}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => openOrder(order)} className="commerce-focus rounded-[8px] border border-[#dedede] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#f7f7f7]">View</button></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/25" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0" onClick={() => setSelectedOrder(null)} aria-label="Close order details" />
          <aside className="relative z-10 h-full w-full max-w-[620px] overflow-y-auto border-l border-[#e5e5e5] bg-[#fafafa] shadow-2xl">
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#e5e5e5] bg-white/95 p-5 backdrop-blur-md sm:p-6">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Order details</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{selectedOrder.orderNumber}</h2><p className="mt-1 text-sm text-[#777]">{new Date(selectedOrder.createdAt).toLocaleString()}</p></div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dedede] bg-white hover:bg-[#f7f7f7]" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5">
                <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-[#777]" /><h3 className="text-sm font-semibold">Customer</h3></div>
                <p className="mt-4 font-medium">{selectedOrder.customerName}</p><p className="mt-1 text-sm text-[#777]">{selectedOrder.customerEmail}</p>
                {selectedOrder.customer && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#666]">{[selectedOrder.customer.address, [selectedOrder.customer.city, selectedOrder.customer.state, selectedOrder.customer.zip].filter(Boolean).join(' ')].filter(Boolean).join('\n')}</p>}
              </section>

              <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5">
                <h3 className="text-sm font-semibold">Items</h3>
                <div className="mt-4 divide-y divide-[#eeeeee]">{selectedOrder.items.map((item) => <div key={item.id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium">{item.productName}</p><p className="mt-1 text-xs text-[#888]">Qty {item.quantity}</p>{Object.keys(item.personalizationData || {}).length > 0 && <div className="mt-2 space-y-1 text-xs text-[#777]">{Object.entries(item.personalizationData).map(([key, value]) => <p key={key}><span className="font-medium text-[#555]">{titleCase(key)}:</span> {String(value)}</p>)}</div>}</div><p className="shrink-0 text-sm font-semibold">{money(item.price * item.quantity, selectedOrder.currency)}</p></div></div>)}</div>
              </section>

              <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5">
                <h3 className="text-sm font-semibold">Status</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Order status</label><select value={draftOrderStatus} onChange={(event) => setDraftOrderStatus(event.target.value)} className="commerce-focus h-11 w-full rounded-[9px] border border-[#dedede] bg-white px-3 text-sm outline-none focus:border-[#202020]">{ORDER_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></div><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Payment</p><div className="mt-2"><StatusBadge value={selectedOrder.paymentStatus} tone={selectedOrder.paymentStatus === 'paid' ? 'green' : 'amber'} /></div><p className="mt-2 text-xs text-[#888]">{selectedOrder.paymentProvider ? `Provider: ${titleCase(selectedOrder.paymentProvider)}` : 'Provider data not set'}</p></div></div>
                <div className="mt-4 rounded-[9px] bg-[#fafafa] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Shipment</p><p className="mt-1.5 text-sm font-medium">{selectedOrder.shipmentStatusLabel || titleCase(selectedOrder.shipmentStatus) || 'Not configured'}</p>{selectedOrder.trackingNumber || selectedOrder.trackingReference ? <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#666]"><span>{selectedOrder.carrier || 'Carrier'} · {selectedOrder.trackingNumber || selectedOrder.trackingReference}</span><button type="button" onClick={() => void navigator.clipboard?.writeText(selectedOrder.trackingNumber || selectedOrder.trackingReference || '')} className="commerce-focus inline-flex items-center gap-1 font-semibold"><Copy className="h-3.5 w-3.5" /> Copy</button>{selectedOrder.trackingUrl && <a href={selectedOrder.trackingUrl} target="_blank" rel="noreferrer" className="commerce-focus inline-flex items-center gap-1 font-semibold">Open <ExternalLink className="h-3.5 w-3.5" /></a>}</div> : <p className="mt-2 text-xs text-[#888]">Tracking details will appear when real carrier information is assigned.</p>}</div>
              </section>

              <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5">
                <div className="flex items-center gap-2"><StickyNote className="h-4 w-4 text-[#777]" /><h3 className="text-sm font-semibold">Internal note</h3></div>
                <textarea rows={5} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} className="commerce-focus mt-4 w-full rounded-[9px] border border-[#dedede] bg-white px-3.5 py-3 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" placeholder="Private note for the admin team" />
              </section>

              <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5"><div className="flex items-center justify-between text-sm"><span className="text-[#777]">Subtotal</span><span>{money(selectedOrder.subtotal, selectedOrder.currency)}</span></div>{Number(selectedOrder.discount || 0) > 0 && <div className="mt-2 flex items-center justify-between text-sm"><span className="text-[#777]">Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span><span>-{money(selectedOrder.discount, selectedOrder.currency)}</span></div>}<div className="mt-2 flex items-center justify-between text-sm"><span className="text-[#777]">Shipping</span><span>{money(selectedOrder.shipping, selectedOrder.currency)}</span></div><div className="mt-2 flex items-center justify-between text-sm"><span className="text-[#777]">Tax</span><span>{money(selectedOrder.tax, selectedOrder.currency)}</span></div><div className="mt-4 flex items-center justify-between border-t border-[#eeeeee] pt-4 font-semibold"><span>Total</span><span>{money(selectedOrder.totalAmount, selectedOrder.currency)}</span></div></section>

              {feedback && <div className="rounded-[9px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#666]">{feedback}</div>}
              <button type="button" onClick={() => void saveOrder()} disabled={isSaving} className="commerce-focus w-full rounded-[9px] bg-[#202020] px-4 py-3 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50">{isSaving ? 'Saving…' : 'Save order'}</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) => <div className="rounded-[11px] border border-[#e3e3e3] bg-white p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">{label}</p><div className="mt-2 flex items-center gap-2"><Icon className="h-4 w-4 text-[#888]" /><span className="text-xl font-semibold sm:text-2xl">{value}</span></div></div>;
