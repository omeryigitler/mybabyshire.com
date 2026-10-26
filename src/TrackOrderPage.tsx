import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, Copy, ExternalLink, MapPin, Package, PackageCheck, Search, Truck } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';
import { type TrackingEvent, type TrackingProviderType } from './utils/carriers';
import { useSeo } from './utils/seo';

type TrackedOrder = {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  shipmentStatus: string;
  shipmentStatusLabel: string;
  shippingMethod?: string | null;
  shippingService?: string | null;
  estimatedDelivery?: string | null;
  carrier?: string | null;
  carrierKey?: string | null;
  trackingNumber?: string | null;
  trackingReference?: string | null;
  trackingUrl?: string | null;
  trackingProviderType: TrackingProviderType;
  customerNote?: string | null;
  lastUpdated?: string | null;
  totalAmount: number;
  currency: string;
  createdAt: string;
  shippingCity?: string | null;
  shippingState?: string | null;
  trackingEvents: TrackingEvent[];
  liveTracking?: {
    providerConnected: boolean;
    providerType: TrackingProviderType;
    provider?: string | null;
    status?: string | null;
    message: string;
    events: TrackingEvent[];
  };
  items: {
    productName: string;
    quantity: number;
    price: number;
    personalizationData: Record<string, string>;
  }[];
};

const STATUS_STEPS = [
  { key: 'order_confirmed', label: 'Confirmed', icon: PackageCheck },
  { key: 'preparing_shipment', label: 'Preparing', icon: Clock3 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

const statusRank: Record<string, number> = {
  pending_payment: 0,
  paid: 1,
  order_confirmed: 1,
  preparing_shipment: 2,
  shipped: 3,
  in_transit: 4,
  out_for_delivery: 5,
  delivered: 6,
  delayed: 4,
  exception: 4,
  cancelled: 0,
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not updated yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const titleCase = (value?: string | null) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderReference, setOrderReference] = useState(searchParams.get('query') || '');
  const [verification, setVerification] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState('');

  useSeo({ title: 'Track Order', description: 'Track your MY BABY SHIRE order using your order reference and verification information.' });

  useEffect(() => {
    const query = searchParams.get('query');
    if (query) setOrderReference(query);
  }, [searchParams]);

  const activeRank = statusRank[order?.shipmentStatus || ''] ?? 1;
  const timelineEvents = useMemo(() => order?.trackingEvents || order?.liveTracking?.events || [], [order]);

  const copyText = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      setErrorMessage('Could not copy to clipboard.');
    }
  };

  const handleTrack = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setOrder(null);

    const reference = orderReference.trim();
    const verifier = verification.trim();
    if (!reference) return setErrorMessage('Enter your order reference or tracking number.');
    if (!verifier) return setErrorMessage('Enter the order email or shipping ZIP code.');

    setIsLoading(true);
    try {
      const response = await fetch(`/api/track?query=${encodeURIComponent(reference)}&verify=${encodeURIComponent(verifier)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Order could not be found.');
      setOrder(data);
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#202020]">
      <header className="border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto grid min-h-[72px] max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="commerce-focus inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#202020]"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back to shop</span></Link>
          <Link to="/" aria-label="MY BABY SHIRE home"><BrandLogo variant="nav" className="!h-[42px] !drop-shadow-none" /></Link>
          <div className="justify-self-end text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Order tracking</div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#999]">Order status</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Track your order</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#707070] sm:text-base">For previous website orders, use the order reference or tracking number plus the order email or shipping ZIP code.</p>
        </div>

        <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-[#e3e3e3] bg-white p-5 text-center"><h2 className="text-lg font-semibold">Purchased on Etsy?</h2><p className="mt-2 text-sm text-[#666]">Track your delivery or contact us about an Etsy order through Etsy Purchases &amp; reviews.</p><a href="https://www.etsy.com/your/purchases" target="_blank" rel="noopener noreferrer" className="commerce-focus mt-4 inline-flex rounded-lg bg-[#202020] px-5 py-3 text-sm font-semibold text-white">View your Etsy orders ↗</a></div>

        <form onSubmit={handleTrack} className="mx-auto mt-8 grid max-w-3xl gap-3 rounded-[12px] border border-[#e3e3e3] bg-white p-4 sm:p-5 lg:grid-cols-[1.1fr_.9fr_auto]">
          <input value={orderReference} onChange={(event) => setOrderReference(event.target.value)} className="commerce-focus min-h-12 min-w-0 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm font-medium outline-none placeholder:text-[#aaa] focus:border-[#202020]" placeholder="Order reference or tracking number" />
          <input value={verification} onChange={(event) => setVerification(event.target.value)} className="commerce-focus min-h-12 min-w-0 rounded-[9px] border border-[#dedede] bg-white px-4 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]" placeholder="Email or ZIP code" />
          <button disabled={isLoading} className="commerce-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] bg-[#202020] px-5 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50"><Search className="h-4 w-4" />{isLoading ? 'Checking…' : 'Track'}</button>
        </form>

        {errorMessage && <div className="mx-auto mt-4 max-w-3xl rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorMessage}</div>}

        {!order && !isLoading && !errorMessage && (
          <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
            <InfoCard icon={Package} title="Order reference" text="Use the reference from your order confirmation." />
            <InfoCard icon={PackageCheck} title="Verification" text="Your email or shipping ZIP keeps order data private." />
            <InfoCard icon={Truck} title="Carrier status" text="Carrier and live tracking details appear when configured for the order." />
          </div>
        )}

        {order && (
          <section className="mt-8 overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white">
            <div className="border-b border-[#ececec] p-5 sm:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Order</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2"><h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{order.orderNumber}</h2><button type="button" onClick={() => void copyText(order.orderNumber, 'order')} className="commerce-focus inline-flex items-center gap-1.5 rounded-[8px] border border-[#dedede] px-2.5 py-1.5 text-xs font-semibold hover:bg-[#f7f7f7]"><Copy className="h-3.5 w-3.5" />{copied === 'order' ? 'Copied' : 'Copy'}</button></div>
                  <p className="mt-2 text-sm text-[#777]">Placed {formatDate(order.createdAt)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
                  <Summary label="Order" value={titleCase(order.orderStatus)} />
                  <Summary label="Shipment" value={order.shipmentStatusLabel || titleCase(order.shipmentStatus)} />
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {order.orderStatus === 'cancelled' ? <div className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">This order has been cancelled.</div> : (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {STATUS_STEPS.map((step) => {
                    const Icon = step.icon;
                    const complete = activeRank >= (statusRank[step.key] || 0);
                    return <div key={step.key} className={`rounded-[10px] border p-3 ${complete ? 'border-[#cfe3d5] bg-[#f3faf5]' : 'border-[#e5e5e5] bg-[#fafafa]'}`}><Icon className={`h-4 w-4 ${complete ? 'text-[#316942]' : 'text-[#aaa]'}`} /><p className={`mt-2 text-xs font-semibold ${complete ? 'text-[#316942]' : 'text-[#888]'}`}>{step.label}</p></div>;
                  })}
                </div>
              )}

              <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Detail label="Carrier" value={order.carrier || 'Not assigned'} />
                <Detail label="Tracking number" value={order.trackingNumber || order.trackingReference || 'Not assigned'} />
                <Detail label="Destination" value={[order.shippingCity, order.shippingState].filter(Boolean).join(', ') || 'Order address'} icon={MapPin} />
                <Detail label="Last updated" value={formatDate(order.lastUpdated)} />
              </div>

              {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="commerce-focus mt-4 inline-flex items-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f7f7f7]">Open carrier tracking <ExternalLink className="h-4 w-4" /></a>}

              {order.customerNote && <div className="mt-6 rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Order note</p><p className="mt-2 text-sm leading-6 text-[#666]">{order.customerNote}</p></div>}

              <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
                <div>
                  <h3 className="text-sm font-semibold">Tracking timeline</h3>
                  {timelineEvents.length === 0 ? <div className="mt-3 rounded-[10px] bg-[#fafafa] p-4 text-sm text-[#777]">Tracking events will appear here when shipment updates are available.</div> : <div className="mt-3 divide-y divide-[#eeeeee] rounded-[10px] border border-[#e5e5e5]">{timelineEvents.map((event, index) => <div key={`${event.status}-${event.timestamp || index}`} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{titleCase(event.status)}</p><p className="mt-1 text-xs leading-5 text-[#777]">{event.description || event.location || 'Shipment update'}</p></div><span className="shrink-0 text-[11px] text-[#999]">{formatDate(event.timestamp)}</span></div></div>)}</div>}
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Order items</h3>
                  <div className="mt-3 divide-y divide-[#eeeeee] rounded-[10px] border border-[#e5e5e5]">{order.items.map((item, index) => <div key={`${item.productName}-${index}`} className="p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{item.productName}</p><p className="mt-1 text-xs text-[#777]">Qty {item.quantity}</p>{Object.keys(item.personalizationData || {}).length > 0 && <p className="mt-1 text-xs text-[#777]">Customization details included</p>}</div><p className="shrink-0 text-sm font-semibold">{order.currency} {(item.price * item.quantity).toFixed(2)}</p></div></div>)}</div>
                  <div className="mt-3 flex items-center justify-between rounded-[10px] bg-[#202020] p-4 text-white"><span className="text-sm font-medium">Order total</span><span className="font-semibold">{order.currency} {order.totalAmount.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const InfoCard = ({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) => <div className="rounded-[11px] border border-[#e3e3e3] bg-white p-4"><Icon className="h-4 w-4 text-[#666]" /><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-[#777]">{text}</p></div>;
const Summary = ({ label, value }: { label: string; value: string }) => <div className="rounded-[10px] bg-[#fafafa] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">{label}</p><p className="mt-1.5 text-sm font-semibold">{value || '—'}</p></div>;
const Detail = ({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) => <div className="rounded-[10px] border border-[#e5e5e5] p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</div><p className="mt-2 break-words text-sm font-medium">{value}</p></div>;
