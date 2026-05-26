import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Package, ReceiptText, UserRound } from 'lucide-react';
import { clearMemberSession, getStoredMemberToken, memberFetch, Member, MemberOrder } from './memberAuth';

export default function AccountPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [orders, setOrders] = useState<MemberOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signedOut, setSignedOut] = useState(false);

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

    if (getStoredMemberToken()) {
      loadAccount();
    } else {
      setLoading(false);
    }
  }, []);

  const handleSignOut = () => {
    clearMemberSession();
    setSignedOut(true);
  };

  if (signedOut) return <Navigate to="/" replace />;
  if (!loading && !getStoredMemberToken()) return <Navigate to="/account/login" replace />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-boutique-bg px-6 py-8 font-sans text-boutique-brown md:px-12">
      <div className="pointer-events-none fixed inset-0 opacity-40 bg-pattern bg-[length:420px_420px]"></div>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_6%,rgba(255,255,255,0.92)_0%,rgba(252,250,246,0.55)_42%,rgba(252,250,246,0)_78%)]"></div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-boutique-brown/10 bg-white/80 p-6 shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light hover:text-boutique-brown">
              <ArrowLeft className="h-4 w-4" /> Back to shop
            </Link>
            <h1 className="font-serif text-4xl text-boutique-brown">My Account</h1>
            <p className="mt-2 text-sm text-boutique-brown-light">View your profile and order history.</p>
          </div>
          <button onClick={handleSignOut} className="inline-flex items-center justify-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-5 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fffaf3]">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </header>

        {loading && <p className="rounded-3xl bg-white/80 p-6 text-center text-sm text-boutique-brown-light shadow-sm">Loading your account...</p>}

        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && member && (
          <div className="grid gap-6 md:grid-cols-[36%_64%]">
            <section className="h-fit rounded-[2rem] border border-boutique-brown/10 bg-white/82 p-6 shadow-sm backdrop-blur-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-boutique-brown text-white shadow-sm">
                <UserRound className="h-6 w-6" />
              </div>
              <h2 className="font-serif text-2xl text-boutique-brown">Profile</h2>
              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-boutique-brown/50">Name</p>
                  <p className="mt-1 font-medium text-boutique-brown">{member.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-boutique-brown/50">Email</p>
                  <p className="mt-1 font-medium text-boutique-brown">{member.email}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-boutique-brown/10 bg-white/82 p-6 shadow-sm backdrop-blur-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-boutique-brown">Orders</h2>
                  <p className="mt-1 text-sm text-boutique-brown-light">Orders linked to your Google email.</p>
                </div>
                <Package className="h-6 w-6 text-boutique-brown-light" />
              </div>

              {orders.length === 0 ? (
                <div className="rounded-2xl bg-boutique-bg p-6 text-center text-sm text-boutique-brown-light">
                  No orders found for this account yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-boutique-brown/10 bg-[#fffaf3]/80 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="mb-2 flex items-center gap-2 font-bold text-boutique-brown">
                            <ReceiptText className="h-4 w-4" /> {order.orderNumber}
                          </div>
                          <p className="text-xs text-boutique-brown-light">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="font-bold text-boutique-brown">{order.currency} {order.totalAmount.toFixed(2)}</p>
                          <p className="mt-1 text-xs text-boutique-brown-light">{order.paymentStatus} · {order.orderStatus}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-boutique-brown/10 pt-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-sm text-boutique-brown-light">
                            <span>{item.quantity} × {item.productName}</span>
                            <span>{order.currency} {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {order.trackingReference && (
                        <Link to={`/track-order?query=${encodeURIComponent(order.trackingReference)}`} className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-boutique-brown shadow-sm hover:bg-boutique-bg">
                          Track order
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
