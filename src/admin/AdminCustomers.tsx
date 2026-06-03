import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Copy,
  CreditCard,
  Mail,
  MapPin,
  PackageCheck,
  RefreshCcw,
  Search,
  ShoppingCart,
  Sparkles,
  Truck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminToken } from './adminAuth';

type CustomerSnapshot = {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
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
  deliveredOrders: number;
  lastOrder: string;
  firstOrder: string;
  latestOrder: Order;
};

type Segment = 'all' | 'repeat' | 'highValue' | 'pending';

const money = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getAddress = (customer?: CustomerSnapshot | null) => {
  if (!customer) return '';
  return [
    customer.address,
    [customer.city, customer.state, customer.zip].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join('\n');
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'LW';

const getPaymentBadgeClass = (status: string) => {
  if (status === 'paid') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'refunded') return 'bg-gray-100 text-gray-700 border-gray-200';
  return 'bg-amber-100 text-amber-800 border-amber-200';
};

const getOrderBadgeClass = (status: string) => {
  if (status === 'delivered') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'shipped') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (status === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-[#f3f0ea] text-boutique-brown-light border-boutique-brown/10';
};

const StatCard = ({
  title,
  value,
  note,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="relative overflow-hidden rounded-[1.7rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-[0_16px_40px_rgba(58,37,26,0.07)] backdrop-blur-sm">
    <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-8 -top-10 w-32 opacity-25 mix-blend-multiply" alt="" />
    <div className="relative z-10 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">{title}</p>
        <p className="mt-4 font-serif text-4xl leading-none text-boutique-brown">{value}</p>
        <p className="mt-2 text-xs text-boutique-brown-light">{note}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const SegmentButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-all ${
      active
        ? 'border-boutique-brown bg-boutique-brown text-white shadow-sm'
        : 'border-boutique-brown/10 bg-white text-boutique-brown-light hover:bg-[#fff4df] hover:text-boutique-brown'
    }`}
  >
    {children}
  </button>
);

const Pill = ({ children, className }: { children: React.ReactNode; className: string }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${className}`}>{children}</span>
);

export const AdminCustomers = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [copiedLabel, setCopiedLabel] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isSavingNote, setIsSavingNote] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const [ordersResponse, notesResponse] = await Promise.all([
        fetch('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/customer-notes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [ordersData, notesData] = await Promise.all([
        ordersResponse.json(),
        notesResponse.json(),
      ]);
      if (!ordersResponse.ok) throw new Error(ordersData.details || ordersData.error || 'Could not load customers.');
      if (!notesResponse.ok) throw new Error(notesData.details || notesData.error || 'Could not load customer notes.');
      setOrders(ordersData);
      setNotes(
        Array.isArray(notesData)
          ? notesData.reduce((current: Record<string, string>, item: any) => {
              current[String(item.customerEmail || '').toLowerCase()] = item.note || '';
              return current;
            }, {})
          : {},
      );
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();

    orders.forEach((order) => {
      const key = order.customerEmail.trim().toLowerCase();
      if (!key) return;

      const existing =
        map.get(key) ||
        ({
          name: order.customerName,
          email: order.customerEmail,
          orders: [],
          total: 0,
          paidTotal: 0,
          pendingOrders: 0,
          deliveredOrders: 0,
          lastOrder: order.createdAt,
          firstOrder: order.createdAt,
          latestOrder: order,
        } satisfies Customer);

      existing.orders.push(order);
      existing.total += Number(order.totalAmount || 0);
      if (order.paymentStatus === 'paid') existing.paidTotal += Number(order.totalAmount || 0);
      if (order.paymentStatus === 'pending') existing.pendingOrders += 1;
      if (order.orderStatus === 'delivered') existing.deliveredOrders += 1;
      if (new Date(order.createdAt) > new Date(existing.lastOrder)) {
        existing.lastOrder = order.createdAt;
        existing.latestOrder = order;
        existing.name = order.customerName || existing.name;
      }
      if (new Date(order.createdAt) < new Date(existing.firstOrder)) existing.firstOrder = order.createdAt;

      map.set(key, existing);
    });

    return Array.from(map.values())
      .map((customer) => ({
        ...customer,
        orders: customer.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      }))
      .sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime());
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.orders.some((order) => order.orderNumber.toLowerCase().includes(query));

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

  const copyText = async (label: string, text?: string | null) => {
    if (!text) {
      alert(`${label} is empty.`);
      return;
    }

    await navigator.clipboard?.writeText(text);
    setCopiedLabel(`${label} copied`);
    setTimeout(() => setCopiedLabel(''), 1600);
  };

  const selectedAddress = getAddress(selectedCustomer?.latestOrder.customer);
  const selectedCustomerKey = selectedCustomer?.email.trim().toLowerCase() || '';

  const saveCustomerNote = async () => {
    if (!selectedCustomerKey) return;
    setIsSavingNote(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/customer-notes/${encodeURIComponent(selectedCustomerKey)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: notes[selectedCustomerKey] || '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Customer note could not be saved.');
      setNotes((current) => ({ ...current, [selectedCustomerKey]: data.note || '' }));
      setCopiedLabel('Customer note saved');
      setTimeout(() => setCopiedLabel(''), 1600);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-7 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-12 -top-14 w-64 opacity-30 mix-blend-multiply" alt="" />
        <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute right-10 bottom-6 w-10 rotate-12 opacity-35 mix-blend-multiply" alt="" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light">
              <Sparkles className="h-4 w-4" /> Customer studio
            </div>
            <h1 className="font-serif text-5xl leading-none text-boutique-brown">Customers</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">
              View customer profiles built from order history, contact details, purchase value, payment status and fulfillment activity.
            </p>
          </div>
          <button onClick={loadOrders} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-boutique-brown px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood disabled:opacity-50">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Customers" value={isLoading ? '-' : customers.length} note="Unique customer emails" icon={Users} />
        <StatCard title="Repeat" value={isLoading ? '-' : repeatCustomers} note="More than one order" icon={ShoppingCart} />
        <StatCard title="High Value" value={isLoading ? '-' : highValueCustomers} note="$100 or more recorded" icon={CreditCard} />
        <StatCard title="Avg Value" value={isLoading ? '-' : money(averageValue)} note="Recorded value per customer" icon={Mail} />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/82 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 border-b border-boutique-brown/10 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-boutique-brown/35" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email, or order reference..."
              className="w-full rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] py-3 pl-12 pr-4 text-sm text-boutique-brown outline-none placeholder:text-boutique-brown/45 focus:ring-2 focus:ring-boutique-wood/25"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <SegmentButton active={segment === 'all'} onClick={() => setSegment('all')}>All</SegmentButton>
            <SegmentButton active={segment === 'repeat'} onClick={() => setSegment('repeat')}>Repeat</SegmentButton>
            <SegmentButton active={segment === 'highValue'} onClick={() => setSegment('highValue')}>High value</SegmentButton>
            <SegmentButton active={segment === 'pending'} onClick={() => setSegment('pending')}>Pending</SegmentButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-boutique-brown/10 bg-[#fffaf3]/70 text-xs uppercase tracking-[0.14em] text-boutique-brown/55">
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Segment</th>
                <th className="px-6 py-4 font-bold">Orders</th>
                <th className="px-6 py-4 font-bold">Total value</th>
                <th className="px-6 py-4 font-bold">Last order</th>
                <th className="px-6 py-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-boutique-brown/10 text-sm">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-boutique-brown-light">Loading customers...</td>
                </tr>
              )}
              {!isLoading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-boutique-brown-light">No customers found.</td>
                </tr>
              )}
              {!isLoading && filteredCustomers.map((customer) => (
                <tr key={customer.email} className="transition-colors hover:bg-[#fffaf3]/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff4df] font-bold text-boutique-brown shadow-sm">
                        {getInitials(customer.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-boutique-brown">{customer.name}</p>
                        <p className="mt-1 truncate text-xs text-boutique-brown-light">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {customer.orders.length > 1 && <Pill className="border-blue-200 bg-blue-50 text-blue-800">Repeat</Pill>}
                      {customer.total >= 100 && <Pill className="border-green-200 bg-green-50 text-green-800">High value</Pill>}
                      {customer.pendingOrders > 0 && <Pill className="border-amber-200 bg-amber-50 text-amber-800">Pending</Pill>}
                      {customer.orders.length === 1 && customer.total < 100 && customer.pendingOrders === 0 && <Pill className="border-boutique-brown/10 bg-white text-boutique-brown-light">New</Pill>}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-boutique-brown">{customer.orders.length}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-boutique-brown">{money(customer.total)}</p>
                    <p className="mt-1 text-xs text-boutique-brown-light">Paid {money(customer.paidTotal)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-boutique-brown">{customer.latestOrder.orderNumber}</p>
                    <p className="mt-1 text-xs text-boutique-brown-light">{formatDate(customer.lastOrder)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setSelectedCustomer(customer); setCopiedLabel(''); }} className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-4 py-2 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df]">
                      View <ArrowRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-y-0 left-64 right-0 z-50 flex items-center justify-center bg-boutique-brown/35 px-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2.2rem] border border-boutique-brown/10 bg-white shadow-[0_30px_100px_rgba(58,37,26,0.28)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
            <div className="sticky top-0 z-10 overflow-hidden border-b border-boutique-brown/10 bg-[#fffaf3] p-6">
              <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-10 -top-12 w-56 opacity-30 mix-blend-multiply" alt="" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl bg-white font-serif text-2xl text-boutique-brown shadow-sm">
                    {getInitials(selectedCustomer.name)}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/55">Customer profile</p>
                    <h2 className="mt-2 font-serif text-4xl text-boutique-brown">{selectedCustomer.name}</h2>
                    <p className="mt-2 text-sm text-boutique-brown-light">{selectedCustomer.email}</p>
                    {copiedLabel && <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-boutique-brown-light shadow-sm">{copiedLabel}</p>}
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="rounded-full border border-boutique-brown/10 bg-white p-2 text-boutique-brown shadow-sm hover:bg-boutique-bg" aria-label="Close customer details">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <StatCard title="Orders" value={selectedCustomer.orders.length} note="Total customer orders" icon={ShoppingCart} />
                  <StatCard title="Lifetime Value" value={money(selectedCustomer.total)} note="All recorded orders" icon={CreditCard} />
                  <StatCard title="Delivered" value={selectedCustomer.deliveredOrders} note="Completed shipments" icon={PackageCheck} />
                  <StatCard title="Pending" value={selectedCustomer.pendingOrders} note="Payment follow-up" icon={Mail} />
                </div>

                <div className="rounded-[1.8rem] border border-boutique-brown/10 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-3xl text-boutique-brown">Order History</h3>
                      <p className="mt-1 text-sm text-boutique-brown-light">Latest orders, payment status, fulfillment status and shipping references.</p>
                    </div>
                    <Link to="/admin/orders" className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold text-boutique-brown hover:bg-[#fff4df]">
                      Orders <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {selectedCustomer.orders.map((order) => (
                      <div key={order.id} className="relative overflow-hidden rounded-[1.5rem] border border-boutique-brown/10 bg-[#fffaf3] p-5 shadow-sm">
                        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-10 -top-12 w-40 opacity-20 mix-blend-multiply" alt="" />
                        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-boutique-brown">{order.orderNumber}</p>
                              <button onClick={() => copyText('Order reference', order.orderNumber)} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-boutique-brown shadow-sm hover:bg-boutique-bg">
                                Copy
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-boutique-brown-light">{formatDate(order.createdAt)}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Pill className={getOrderBadgeClass(order.orderStatus)}>{order.orderStatus}</Pill>
                              <Pill className={getPaymentBadgeClass(order.paymentStatus)}>{order.paymentStatus}</Pill>
                              {order.paymentProvider && <Pill className="border-boutique-brown/10 bg-white text-boutique-brown-light">{order.paymentProvider}</Pill>}
                            </div>
                            <div className="mt-3 text-xs leading-relaxed text-boutique-brown-light">
                              {order.shippingMethod && <p>{order.shippingMethod}</p>}
                              {order.carrier && <p>{order.carrier}{order.trackingReference ? ` · ${order.trackingReference}` : ''}</p>}
                              {order.items?.length ? <p>{order.items.length} line item{order.items.length > 1 ? 's' : ''}</p> : null}
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-boutique-brown/50">Order total</p>
                            <p className="mt-1 font-serif text-2xl text-boutique-brown">{money(order.totalAmount)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-[1.6rem] border border-boutique-brown/10 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm">
                      <Copy className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Quick actions</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => copyText('Customer email', selectedCustomer.email)} className="rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] px-3 py-3 text-xs font-bold text-boutique-brown hover:bg-[#fff4df]">Copy email</button>
                    <a href={`mailto:${selectedCustomer.email}`} className="rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] px-3 py-3 text-center text-xs font-bold text-boutique-brown hover:bg-[#fff4df]">Email</a>
                    <button onClick={() => copyText('Shipping address', selectedAddress)} className="rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] px-3 py-3 text-xs font-bold text-boutique-brown hover:bg-[#fff4df]">Copy address</button>
                    <button onClick={() => copyText('Latest order', selectedCustomer.latestOrder.orderNumber)} className="rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] px-3 py-3 text-xs font-bold text-boutique-brown hover:bg-[#fff4df]">Copy order</button>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-boutique-brown/10 bg-[#fffaf3] p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-boutique-brown shadow-sm">
                      <MapPin className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Latest address</h3>
                  </div>
                  {selectedAddress ? (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-boutique-brown-light">{selectedAddress}</p>
                  ) : (
                    <p className="text-sm text-boutique-brown-light">No address snapshot yet.</p>
                  )}
                </div>

                <div className="rounded-[1.6rem] border border-boutique-brown/10 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm">
                      <Truck className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Customer notes</h3>
                  </div>
                  <textarea
                    value={notes[selectedCustomerKey] || ''}
                    onChange={(event) => setNotes((current) => ({ ...current, [selectedCustomerKey]: event.target.value }))}
                    rows={5}
                    className="w-full resize-none rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] px-3 py-3 text-sm text-boutique-brown outline-none placeholder:text-boutique-brown/35"
                    placeholder="Private customer note..."
                  />
                  <button onClick={saveCustomerNote} disabled={isSavingNote} className="mt-3 w-full rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50">
                    {isSavingNote ? 'Saving...' : 'Save customer note'}
                  </button>
                </div>

                <div className="rounded-[1.6rem] border border-boutique-brown/10 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800 shadow-sm">
                      <UserRound className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Profile summary</h3>
                  </div>
                  <div className="space-y-3 text-sm text-boutique-brown-light">
                    <div className="flex justify-between gap-4"><span>First order</span><span className="text-right font-bold text-boutique-brown">{formatDate(selectedCustomer.firstOrder)}</span></div>
                    <div className="flex justify-between gap-4"><span>Last order</span><span className="text-right font-bold text-boutique-brown">{formatDate(selectedCustomer.lastOrder)}</span></div>
                    <div className="flex justify-between gap-4"><span>Pending payments</span><span className="font-bold text-boutique-brown">{selectedCustomer.pendingOrders}</span></div>
                    <div className="flex justify-between gap-4 border-t border-boutique-brown/10 pt-3 font-serif text-2xl text-boutique-brown"><span>Total</span><span>{money(selectedCustomer.total)}</span></div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
