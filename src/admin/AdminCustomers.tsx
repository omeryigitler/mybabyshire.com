import React, { useEffect, useMemo, useState } from 'react';
import { Copy, RefreshCcw, Search, ShoppingCart, StickyNote, UserRound, Users, X } from 'lucide-react';
import { getAdminToken } from './adminAuth';

type CustomerSnapshot = { address?: string; city?: string; state?: string; zip?: string };
type OrderItem = { id: string; productName: string; quantity: number; price: number };
type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  currency?: string;
  paymentStatus: string;
  paymentProvider?: string;
  orderStatus: string;
  trackingReference?: string | null;
  carrier?: string | null;
  shippingMethod?: string | null;
  createdAt: string;
  customer?: CustomerSnapshot | null;
  items?: OrderItem[];
};
type Customer = {
  name: string;
  email: string;
  orders: Order[];
  total: number;
  paidTotal: number;
  pendingOrders: number;
  lastOrder: string;
  firstOrder: string;
  latestOrder: Order;
};
type Segment = 'all' | 'repeat' | 'highValue' | 'pending';

const money = (value: number, currency = 'USD') => `${currency} ${Number(value || 0).toFixed(2)}`;
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};
const titleCase = (value?: string | null) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const getAddress = (customer?: CustomerSnapshot | null) => customer ? [customer.address, [customer.city, customer.state, customer.zip].filter(Boolean).join(' ')].filter(Boolean).join('\n') : '';
const getInitials = (name: string) => name.split(' ').map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'MB';

export const AdminCustomers = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [feedback, setFeedback] = useState('');

  const loadCustomers = async () => {
    setIsLoading(true);
    setFeedback('');
    try {
      const token = getAdminToken();
      const [ordersResponse, notesResponse] = await Promise.all([
        fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/customer-notes', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [ordersData, notesData] = await Promise.all([ordersResponse.json(), notesResponse.json()]);
      if (!ordersResponse.ok) throw new Error(ordersData.details || ordersData.error || 'Could not load customers.');
      if (!notesResponse.ok) throw new Error(notesData.details || notesData.error || 'Could not load customer notes.');
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setNotes(Array.isArray(notesData) ? notesData.reduce((current: Record<string, string>, item: any) => {
        current[String(item.customerEmail || '').toLowerCase()] = item.note || '';
        return current;
      }, {}) : {});
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadCustomers(); }, []);

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    orders.forEach((order) => {
      const key = order.customerEmail.trim().toLowerCase();
      if (!key) return;
      const existing = map.get(key) || {
        name: order.customerName,
        email: order.customerEmail,
        orders: [],
        total: 0,
        paidTotal: 0,
        pendingOrders: 0,
        lastOrder: order.createdAt,
        firstOrder: order.createdAt,
        latestOrder: order,
      };
      existing.orders.push(order);
      existing.total += Number(order.totalAmount || 0);
      if (order.paymentStatus === 'paid') existing.paidTotal += Number(order.totalAmount || 0);
      if (order.paymentStatus === 'pending') existing.pendingOrders += 1;
      if (new Date(order.createdAt) > new Date(existing.lastOrder)) {
        existing.lastOrder = order.createdAt;
        existing.latestOrder = order;
        existing.name = order.customerName || existing.name;
      }
      if (new Date(order.createdAt) < new Date(existing.firstOrder)) existing.firstOrder = order.createdAt;
      map.set(key, existing);
    });
    return Array.from(map.values()).map((customer) => ({ ...customer, orders: [...customer.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) })).sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime());
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = !query || `${customer.name} ${customer.email} ${customer.orders.map((order) => order.orderNumber).join(' ')}`.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (segment === 'repeat') return customer.orders.length > 1;
      if (segment === 'highValue') return customer.total >= 100;
      if (segment === 'pending') return customer.pendingOrders > 0;
      return true;
    });
  }, [customers, searchTerm, segment]);

  const repeatCustomers = customers.filter((customer) => customer.orders.length > 1).length;
  const highValueCustomers = customers.filter((customer) => customer.total >= 100).length;
  const totalValue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const averageValue = customers.length ? totalValue / customers.length : 0;
  const selectedKey = selectedCustomer?.email.trim().toLowerCase() || '';

  const saveCustomerNote = async () => {
    if (!selectedKey) return;
    setIsSavingNote(true);
    setFeedback('');
    try {
      const response = await fetch(`/api/admin/customer-notes?email=${encodeURIComponent(selectedKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ note: notes[selectedKey] || '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Customer note could not be saved.');
      setNotes((current) => ({ ...current, [selectedKey]: data.note || '' }));
      setFeedback('Customer note saved.');
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Sales</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em] text-[#202020]">Customers</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Customer profiles are built from order history. Payment and shipping provider details remain read-only.</p>
        </div>
        <button type="button" onClick={() => void loadCustomers()} disabled={isLoading} className="commerce-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-semibold hover:bg-[#f7f7f7] disabled:opacity-50"><RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Customers" value={customers.length} icon={Users} />
        <Metric label="Repeat" value={repeatCustomers} icon={ShoppingCart} />
        <Metric label="High value" value={highValueCustomers} icon={UserRound} />
        <Metric label="Avg value" value={money(averageValue)} icon={ShoppingCart} />
      </div>

      {feedback && !selectedCustomer && <div className="rounded-[10px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#666]">{feedback}</div>}

      <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#ececec] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="hide-scrollbar flex gap-2 overflow-x-auto">
            {([['all', 'All'], ['repeat', 'Repeat'], ['highValue', 'High value'], ['pending', 'Pending']] as [Segment, string][]).map(([value, label]) => <button key={value} type="button" onClick={() => setSegment(value)} className={`commerce-focus whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold ${segment === value ? 'border-[#202020] bg-[#202020] text-white' : 'border-[#dedede] bg-white hover:border-[#aaa]'}`}>{label}</button>)}
          </div>
          <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name, email or order" className="commerce-focus h-11 w-full rounded-[9px] border border-[#dedede] bg-white pl-10 pr-4 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" /></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead><tr className="border-b border-[#ececec] bg-[#fafafa] text-[10px] font-bold uppercase tracking-[0.12em] text-[#888]"><th className="px-5 py-3.5">Customer</th><th className="px-5 py-3.5">Orders</th><th className="px-5 py-3.5">Total value</th><th className="px-5 py-3.5">Paid value</th><th className="px-5 py-3.5">Last order</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-[#eeeeee] text-sm">
              {isLoading && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#777]">Loading customers...</td></tr>}
              {!isLoading && filteredCustomers.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#777]">No customers found.</td></tr>}
              {!isLoading && filteredCustomers.map((customer) => <tr key={customer.email} className="hover:bg-[#fafafa]"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f1f1] text-xs font-bold">{getInitials(customer.name)}</div><div className="min-w-0"><p className="truncate font-semibold">{customer.name}</p><p className="mt-1 truncate text-xs text-[#888]">{customer.email}</p></div></div></td><td className="px-5 py-4"><span className="font-semibold">{customer.orders.length}</span>{customer.pendingOrders > 0 && <span className="ml-2 rounded-full bg-[#fff3d9] px-2 py-1 text-[10px] font-semibold text-[#8a641e]">{customer.pendingOrders} pending</span>}</td><td className="px-5 py-4 font-semibold">{money(customer.total, customer.latestOrder.currency || 'USD')}</td><td className="px-5 py-4 text-[#666]">{money(customer.paidTotal, customer.latestOrder.currency || 'USD')}</td><td className="px-5 py-4"><p className="font-medium">{customer.latestOrder.orderNumber}</p><p className="mt-1 text-xs text-[#888]">{formatDate(customer.lastOrder)}</p></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => { setSelectedCustomer(customer); setFeedback(''); }} className="commerce-focus rounded-[8px] border border-[#dedede] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#f7f7f7]">View</button></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/25" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0" onClick={() => setSelectedCustomer(null)} aria-label="Close customer details" />
          <aside className="relative z-10 h-full w-full max-w-[620px] overflow-y-auto border-l border-[#e5e5e5] bg-[#fafafa] shadow-2xl">
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#e5e5e5] bg-white/95 p-5 backdrop-blur-md sm:p-6">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Customer</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{selectedCustomer.name}</h2><button type="button" onClick={() => void navigator.clipboard?.writeText(selectedCustomer.email)} className="commerce-focus mt-2 inline-flex items-center gap-1.5 text-sm text-[#666] hover:text-[#202020]"><span>{selectedCustomer.email}</span><Copy className="h-3.5 w-3.5" /></button></div>
              <button type="button" onClick={() => setSelectedCustomer(null)} className="commerce-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dedede] bg-white hover:bg-[#f7f7f7]" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <section className="grid grid-cols-2 gap-3"><Summary label="Orders" value={String(selectedCustomer.orders.length)} /><Summary label="Total value" value={money(selectedCustomer.total, selectedCustomer.latestOrder.currency || 'USD')} /><Summary label="Paid value" value={money(selectedCustomer.paidTotal, selectedCustomer.latestOrder.currency || 'USD')} /><Summary label="Customer since" value={formatDate(selectedCustomer.firstOrder)} /></section>

              <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-[#777]" /><h3 className="text-sm font-semibold">Contact & address</h3></div><p className="mt-4 text-sm font-medium">{selectedCustomer.email}</p><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#666]">{getAddress(selectedCustomer.latestOrder.customer) || 'No address snapshot stored.'}</p></section>

              <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5"><div className="flex items-center gap-2"><StickyNote className="h-4 w-4 text-[#777]" /><h3 className="text-sm font-semibold">Internal customer note</h3></div><textarea rows={5} value={notes[selectedKey] || ''} onChange={(event) => setNotes((current) => ({ ...current, [selectedKey]: event.target.value }))} className="commerce-focus mt-4 w-full rounded-[9px] border border-[#dedede] px-3.5 py-3 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" placeholder="Private note for the admin team" /><button type="button" onClick={() => void saveCustomerNote()} disabled={isSavingNote} className="commerce-focus mt-3 rounded-[8px] bg-[#202020] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#383838] disabled:opacity-50">{isSavingNote ? 'Saving…' : 'Save note'}</button></section>

              <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white"><div className="border-b border-[#ececec] p-5"><h3 className="text-sm font-semibold">Order history</h3></div><div className="divide-y divide-[#eeeeee]">{selectedCustomer.orders.map((order) => <article key={order.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-[#888]">{formatDate(order.createdAt)}</p></div><p className="font-semibold">{money(order.totalAmount, order.currency || 'USD')}</p></div><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold"><span className="rounded-full bg-[#f1f1f1] px-2.5 py-1 text-[#666]">{titleCase(order.orderStatus)}</span><span className={`rounded-full px-2.5 py-1 ${order.paymentStatus === 'paid' ? 'bg-[#eaf5ee] text-[#316942]' : 'bg-[#fff3d9] text-[#8a641e]'}`}>{titleCase(order.paymentStatus)}</span></div>{order.items && order.items.length > 0 && <div className="mt-3 space-y-1 text-xs text-[#777]">{order.items.map((item) => <p key={item.id}>{item.quantity} × {item.productName}</p>)}</div>}</article>)}</div></section>

              {feedback && <div className="rounded-[9px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#666]">{feedback}</div>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) => <div className="rounded-[11px] border border-[#e3e3e3] bg-white p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">{label}</p><div className="mt-2 flex items-center gap-2"><Icon className="h-4 w-4 text-[#888]" /><span className="text-xl font-semibold sm:text-2xl">{value}</span></div></div>;
const Summary = ({ label, value }: { label: string; value: string }) => <div className="rounded-[11px] border border-[#e3e3e3] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></div>;
