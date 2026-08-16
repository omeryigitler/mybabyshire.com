import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Package, ReceiptText, UserRound } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { clearMemberSession, getStoredMemberToken, memberFetch, Member, MemberOrder } from './memberAuth';
import { useSeo } from '../utils/seo';

const statusLabel = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AccountPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [orders, setOrders] = useState<MemberOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signedOut, setSignedOut] = useState(false);

  useSeo({ title: 'My Account', description: 'View your MY BABY SHIRE profile and order history.' });

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const [profileData, orderData] = await Promise.all([
          memberFetch<{ member: Member }>('/api/account/me'),
          memberFetch<{ orders: MemberOrder[] }>('/api/account/orders'),
        ]);
        setMember(profileData.member);
        setOrders(orderData.orders || []);
      } catch (accountError) {
        setError((accountError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (getStoredMemberToken()) void loadAccount();
    else setLoading(false);
  }, []);

  const handleSignOut = () => {
    clearMemberSession();
    setSignedOut(true);
  };

  if (signedOut) return <Navigate to="/" replace />;
  if (!loading && !getStoredMemberToken()) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#202020]">
      <header className="border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto grid min-h-[72px] max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="commerce-focus inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#202020]"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back to shop</span></Link>
          <Link to="/" aria-label="MY BABY SHIRE home"><BrandLogo variant="nav" className="!h-[42px] !drop-shadow-none" /></Link>
          <button type="button" onClick={handleSignOut} className="commerce-focus justify-self-end inline-flex min-h-10 items-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-3.5 text-sm font-semibold hover:bg-[#f7f7f7]"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></button>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#999]">Account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">My Account</h1>
          <p className="mt-2 text-sm text-[#707070]">Your profile, order history and tracking links in one place.</p>
        </div>

        {loading && <div className="rounded-[12px] border border-[#e3e3e3] bg-white p-8 text-center text-sm text-[#777]">Loading your account...</div>}
        {!loading && error && <div className="rounded-[12px] border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">{error}</div>}

        {!loading && !error && member && (
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            <aside className="h-fit rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#202020] text-white"><UserRound className="h-5 w-5" /></div>
              <h2 className="mt-5 text-lg font-semibold">Profile</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Name</dt><dd className="mt-1 font-medium">{member.name}</dd></div>
                <div><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Email</dt><dd className="mt-1 break-words font-medium">{member.email}</dd></div>
              </dl>
            </aside>

            <section className="overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-[#ececec] p-5 sm:p-6">
                <div><h2 className="text-lg font-semibold">Orders</h2><p className="mt-1 text-sm text-[#777]">Orders linked to this account email.</p></div>
                <Package className="h-5 w-5 text-[#777]" />
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center"><p className="text-sm font-medium">No orders yet.</p><Link to="/collections/all" className="commerce-focus mt-4 inline-flex rounded-[9px] bg-[#202020] px-4 py-2.5 text-sm font-semibold text-white">Shop products</Link></div>
              ) : (
                <div className="divide-y divide-[#eeeeee]">
                  {orders.map((order) => (
                    <article key={order.id} className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div><div className="flex items-center gap-2 font-semibold"><ReceiptText className="h-4 w-4 text-[#777]" />{order.orderNumber}</div><p className="mt-1.5 text-xs text-[#888]">{new Date(order.createdAt).toLocaleDateString()}</p></div>
                        <div className="sm:text-right"><p className="font-semibold">{order.currency} {order.totalAmount.toFixed(2)}</p><p className="mt-1 text-xs text-[#777]">{statusLabel(order.paymentStatus)} · {statusLabel(order.orderStatus)}</p></div>
                      </div>

                      <div className="mt-4 space-y-2 rounded-[9px] bg-[#fafafa] p-4">
                        {order.items.map((item) => <div key={item.id} className="flex items-start justify-between gap-4 text-sm"><span className="text-[#666]">{item.quantity} × {item.productName}</span><span className="shrink-0 font-medium">{order.currency} {(item.price * item.quantity).toFixed(2)}</span></div>)}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link to={`/track-order?query=${encodeURIComponent(order.trackingReference || order.orderNumber)}`} className="commerce-focus inline-flex rounded-[9px] border border-[#dedede] bg-white px-4 py-2.5 text-xs font-semibold hover:bg-[#f7f7f7]">Track order</Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
