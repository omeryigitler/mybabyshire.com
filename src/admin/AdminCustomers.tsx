import React, { useEffect, useMemo, useState } from 'react';
import { Mail, RefreshCcw, Search, ShoppingCart, Sparkles, UserRound } from 'lucide-react';
import { getAdminToken } from './adminAuth';

type Order = { id: string; orderNumber: string; customerName: string; customerEmail: string; totalAmount: number; paymentStatus: string; orderStatus: string; createdAt: string; };
type Customer = { name: string; email: string; orders: Order[]; total: number; lastOrder: string; };

export const AdminCustomers = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not load customers.');
      setOrders(data);
    } catch (error) { console.error(error); alert((error as Error).message); } finally { setIsLoading(false); }
  };

  useEffect(() => { loadOrders(); }, []);

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    orders.forEach((order) => {
      const key = order.customerEmail.toLowerCase();
      const existing = map.get(key) || { name: order.customerName, email: order.customerEmail, orders: [], total: 0, lastOrder: order.createdAt };
      existing.orders.push(order);
      existing.total += Number(order.totalAmount || 0);
      if (new Date(order.createdAt) > new Date(existing.lastOrder)) existing.lastOrder = order.createdAt;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime());
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => customer.name.toLowerCase().includes(query) || customer.email.toLowerCase().includes(query));
  }, [customers, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-7 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-12 -top-14 w-64 opacity-30 mix-blend-multiply" alt="" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light"><Sparkles className="h-4 w-4" /> Customer list</div><h1 className="font-serif text-5xl leading-none text-boutique-brown">Customers</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">View customers grouped from order history, with order count and recorded value.</p></div>
          <button onClick={loadOrders} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-5 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50"><RefreshCcw className="h-4 w-4" /> Refresh</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3"><div className="rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-sm"><UserRound className="mb-4 h-6 w-6 text-boutique-brown" /><p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">Customers</p><p className="mt-3 font-serif text-4xl text-boutique-brown">{isLoading ? '—' : customers.length}</p></div><div className="rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-sm"><ShoppingCart className="mb-4 h-6 w-6 text-boutique-brown" /><p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">Orders</p><p className="mt-3 font-serif text-4xl text-boutique-brown">{isLoading ? '—' : orders.length}</p></div><div className="rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-sm"><Mail className="mb-4 h-6 w-6 text-boutique-brown" /><p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">Recorded value</p><p className="mt-3 font-serif text-4xl text-boutique-brown">${orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0).toFixed(2)}</p></div></div>

      <div className="overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/82 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm"><div className="border-b border-boutique-brown/10 p-5"><div className="relative max-w-sm"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-boutique-brown/35" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search customers..." className="w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] py-3 pl-12 pr-4 text-sm text-boutique-brown outline-none placeholder:text-boutique-brown/45 focus:ring-2 focus:ring-boutique-wood/25" /></div></div><table className="w-full border-collapse text-left"><thead><tr className="border-b border-boutique-brown/10 bg-[#fffaf3]/70 text-xs uppercase tracking-[0.14em] text-boutique-brown/55"><th className="px-6 py-4 font-bold">Customer</th><th className="px-6 py-4 font-bold">Orders</th><th className="px-6 py-4 font-bold">Total value</th><th className="px-6 py-4 font-bold">Last order</th></tr></thead><tbody className="divide-y divide-boutique-brown/10 text-sm">{isLoading && <tr><td colSpan={4} className="px-6 py-10 text-center text-boutique-brown-light">Loading customers...</td></tr>}{!isLoading && filteredCustomers.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-boutique-brown-light">No customers found.</td></tr>}{!isLoading && filteredCustomers.map((customer) => <tr key={customer.email} className="hover:bg-[#fffaf3]/70"><td className="px-6 py-4"><div className="font-bold text-boutique-brown">{customer.name}</div><div className="mt-1 text-xs text-boutique-brown-light">{customer.email}</div></td><td className="px-6 py-4 font-bold text-boutique-brown">{customer.orders.length}</td><td className="px-6 py-4 font-bold text-boutique-brown">${customer.total.toFixed(2)}</td><td className="px-6 py-4 text-boutique-brown-light">{new Date(customer.lastOrder).toLocaleString()}</td></tr>)}</tbody></table></div>
    </div>
  );
};
