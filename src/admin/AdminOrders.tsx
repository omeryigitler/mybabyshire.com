import React, { useEffect, useMemo, useState } from 'react';
import { Mail, PackageCheck, RefreshCcw, Search, ShoppingCart } from 'lucide-react';
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
  createdAt: string;
  customer?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  subtotal?: number | null;
  shipping?: number | null;
  items: OrderItem[];
};

const getPaymentBadgeClass = (status: string) => {
  if (status === 'paid') return 'bg-green-100 text-green-800';
  if (status === 'refunded') return 'bg-gray-100 text-gray-700';
  return 'bg-amber-100 text-amber-800';
};

const getProviderBadgeClass = (provider?: string) => {
  if (provider === 'PayPal') return 'bg-[#eef5ff] text-[#003087] border-[#d7e7ff]';
  if (provider === 'Stripe') return 'bg-[#f3f0ff] text-[#635bff] border-[#e2ddff]';
  return 'bg-gray-50 text-gray-500 border-gray-200';
};

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
      const response = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Could not load orders.');
      }

      setOrders(data);
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderStatus: draftOrderStatus,
          paymentStatus: draftPaymentStatus,
          trackingReference: draftTrackingReference.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Could not update order.');
      }

      const updatedOrder = {
        ...selectedOrder,
        orderStatus: data.orderStatus,
        paymentStatus: data.paymentStatus,
        trackingReference: data.trackingReference,
      };

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

    return orders.filter((order) =>
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerEmail.toLowerCase().includes(query) ||
      order.orderStatus.toLowerCase().includes(query) ||
      order.paymentStatus.toLowerCase().includes(query) ||
      (order.paymentProvider || '').toLowerCase().includes(query)
    );
  }, [orders, searchTerm]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter((order) => order.paymentStatus === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Review customer gift requests and personalization details.</p>
        </div>
        <button onClick={loadOrders} disabled={isLoading} className="border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-500">Total Orders</span><ShoppingCart className="w-5 h-5 text-gray-400" /></div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{isLoading ? '—' : orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-500">Pending Payment</span><PackageCheck className="w-5 h-5 text-amber-500" /></div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{isLoading ? '—' : pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-500">Recorded Value</span><Mail className="w-5 h-5 text-gray-400" /></div>
          <p className="text-3xl font-bold text-gray-900 mt-4">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search orders..." className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all w-72" />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3 font-medium">Order</th>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Payment</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {isLoading && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading orders...</td></tr>}
            {!isLoading && filteredOrders.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No orders found.</td></tr>}
            {!isLoading && filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4"><div className="font-semibold text-gray-900">{order.orderNumber}</div><div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</div></td>
                <td className="px-6 py-4"><div className="font-medium text-gray-900">{order.customerName}</div><div className="text-xs text-gray-500">{order.customerEmail}</div></td>
                <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{order.orderStatus}</span></td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentBadgeClass(order.paymentStatus)}`}>{order.paymentStatus}</span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getProviderBadgeClass(order.paymentProvider)}`}>via {order.paymentProvider || 'Not selected'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4 text-right"><button onClick={() => openOrder(order)} className="text-sm font-medium text-gray-900 hover:underline">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500 mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">Close</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Customer</h3>
                  <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerEmail}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Shipping</h3>
                  {selectedOrder.customer ? <p className="text-sm text-gray-700">{selectedOrder.customer.address}<br />{selectedOrder.customer.city}, {selectedOrder.customer.state} {selectedOrder.customer.zip}</p> : <p className="text-sm text-gray-500">No address snapshot</p>}
                </div>
                <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Manage Status</h3>
                  <select value={draftOrderStatus} onChange={(event) => setDraftOrderStatus(event.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                    <option value="processing">processing</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                  <select value={draftPaymentStatus} onChange={(event) => setDraftPaymentStatus(event.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="refunded">refunded</option>
                  </select>
                  <input value={draftTrackingReference} onChange={(event) => setDraftTrackingReference(event.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Tracking reference" />
                  <button onClick={updateSelectedOrder} disabled={isUpdating} className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400">
                    {isUpdating ? 'Saving...' : 'Save Status'}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex justify-between gap-4">
                        <div><p className="font-semibold text-gray-900">{item.productName}</p><p className="text-sm text-gray-500">Qty {item.quantity} × ${item.price.toFixed(2)}</p></div>
                        <p className="font-semibold text-gray-900">${(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                      {Object.keys(item.personalizationData).length > 0 && (
                        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                          {Object.entries(item.personalizationData).map(([key, value]) => <div key={key}><span className="font-semibold">{key}: </span>{String(value)}</div>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Payment provider</span><span>{selectedOrder.paymentProvider || 'Not selected'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${Number(selectedOrder.subtotal || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>${Number(selectedOrder.shipping || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tracking</span><span>{selectedOrder.trackingReference || 'Not added yet'}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold"><span>Total</span><span>${selectedOrder.totalAmount.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
