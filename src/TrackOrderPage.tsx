import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Gift,
  MapPin,
  Package,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import { BabyCubeMark, BrandLogo } from './components/BrandLogo';
import { getShipmentStatusLabel, type TrackingEvent, type TrackingProviderType } from './utils/carriers';

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

function formatDate(value?: string | null) {
  if (!value) return 'Not updated yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusIcon(status: string, isLatest: boolean) {
  if (status === 'delivered') return <CheckCircle2 className="h-5 w-5" />;
  if (status === 'in_transit' || status === 'out_for_delivery' || status === 'shipped') return <Truck className="h-5 w-5" />;
  if (isLatest) return <PackageCheck className="h-5 w-5" />;
  return <Package className="h-5 w-5" />;
}

export default function TrackOrderPage() {
  const [orderReference, setOrderReference] = useState('');
  const [verification, setVerification] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState('');

  const activeRank = statusRank[order?.shipmentStatus || ''] ?? 1;
  const timelineEvents = useMemo(() => order?.trackingEvents || [], [order]);

  const copyText = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      alert('Could not copy.');
    }
  };

  const handleTrack = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setOrder(null);

    const reference = orderReference.trim();
    if (!reference) {
      setErrorMessage('Please enter your order reference or tracking number.');
      return;
    }

    const verifier = verification.trim();
    if (!verifier) {
      setErrorMessage('Please enter the order email or shipping ZIP code.');
      return;
    }

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
    <div className="relative min-h-screen overflow-x-hidden bg-boutique-bg font-sans text-boutique-brown">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-45 bg-pattern bg-[length:400px_400px]"></div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.92)_0%,rgba(252,250,246,0.55)_34%,rgba(252,250,246,0)_72%)]"></div>

      <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute left-[-70px] top-[120px] z-0 hidden w-72 opacity-50 mix-blend-multiply md:block" alt="" />
      <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute right-[-60px] top-[210px] z-0 hidden w-80 opacity-45 mix-blend-multiply md:block" alt="" />
      <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute left-[8%] top-[170px] z-0 hidden w-10 rotate-12 opacity-60 mix-blend-multiply lg:block" alt="" />
      <img src="/toy-abc-blocks.png" className="pointer-events-none absolute right-[9%] top-[360px] z-0 hidden w-16 -rotate-6 opacity-45 mix-blend-multiply lg:block" alt="" />
      <img src="/toy-pull-duck.png" className="pointer-events-none absolute right-[4%] bottom-[120px] z-0 hidden w-36 opacity-50 mix-blend-multiply xl:block" alt="" />

      <header className="relative z-20 flex items-center justify-between border-b border-boutique-brown/10 bg-boutique-bg/85 px-6 py-5 backdrop-blur-md md:px-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light hover:text-boutique-brown"><ArrowLeft className="h-4 w-4" /> Back to shop</Link>
        <Link to="/" className="group/logo inline-flex items-center" aria-label="MY BABY SHIRE home">
          <BrandLogo variant="header" className="hidden sm:inline-flex" />
          <BabyCubeMark className="h-auto w-12 sm:hidden" />
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-boutique-brown-light"><PackageCheck className="h-4 w-4" /> Order tracking</div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-wider text-boutique-brown-light shadow-sm"><Sparkles className="h-4 w-4" /> Follow your MY BABY SHIRE order</div>
          <h1 className="font-serif text-5xl leading-none text-boutique-brown md:text-7xl">Order Tracking</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-boutique-brown-light">Enter your MY BABY SHIRE order reference or tracking number plus the order email or shipping ZIP code to see the latest shipping progress.</p>
        </div>

        <form onSubmit={handleTrack} className="relative mx-auto mt-8 max-w-3xl rounded-[2.2rem] border border-boutique-brown/10 bg-white/80 p-4 shadow-[0_20px_60px_rgba(58,37,26,0.10)] backdrop-blur-sm">
          <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -left-10 -top-8 w-32 opacity-30 mix-blend-multiply" alt="" />
          <img src="/toy-wooden-star-solid.png" className="pointer-events-none absolute right-8 top-4 w-8 rotate-12 opacity-35 mix-blend-multiply" alt="" />
          <div className="relative z-10 grid gap-3 lg:grid-cols-[1.2fr_0.9fr_auto]">
            <input value={orderReference} onChange={(event) => setOrderReference(event.target.value)} className="min-h-16 min-w-0 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-6 text-sm font-semibold uppercase tracking-wide text-boutique-brown outline-none transition-all focus:ring-2 focus:ring-boutique-wood/35" placeholder="LW-XXXXXXXX-XXXXX or tracking number" />
            <input value={verification} onChange={(event) => setVerification(event.target.value)} className="min-h-16 min-w-0 rounded-full border border-boutique-brown/10 bg-white px-6 text-sm font-semibold text-boutique-brown outline-none transition-all focus:ring-2 focus:ring-boutique-wood/35" placeholder="Email or ZIP code" />
            <button disabled={isLoading} className="inline-flex min-h-16 items-center justify-center gap-2 rounded-full bg-boutique-brown px-7 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood disabled:opacity-50"><Search className="h-4 w-4" /> {isLoading ? 'Checking...' : 'Track Order'}</button>
          </div>
        </form>

        {errorMessage && <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{errorMessage}</div>}

        {!order && !isLoading && !errorMessage && (
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
            <InfoCard icon={Package} title="Order reference" content={<p className="text-sm text-boutique-brown-light">Use the order reference shown after checkout with the order email or ZIP.</p>} />
            <InfoCard icon={Truck} title="Carrier ready" content={<p className="text-sm text-boutique-brown-light">USPS, UPS, FedEx and DHL tracking links are supported.</p>} />
            <InfoCard icon={Clock3} title="Timeline" content={<p className="text-sm text-boutique-brown-light">Shipment milestones update as the team updates your order.</p>} />
          </div>
        )}

        {order && (
          <section className="relative mt-10 overflow-hidden rounded-[2.4rem] border border-boutique-brown/10 bg-white/85 shadow-[0_24px_70px_rgba(58,37,26,0.10)] backdrop-blur-sm">
            <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -left-12 bottom-20 w-44 opacity-30 mix-blend-multiply" alt="" />
            <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-14 top-8 w-52 opacity-30 mix-blend-multiply" alt="" />

            <div className="relative border-b border-boutique-brown/10 bg-[#fffaf3] px-6 py-7 md:px-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-boutique-brown/60">Order Reference</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-3xl leading-tight text-boutique-brown md:text-5xl">{order.orderNumber}</h2>
                    <button onClick={() => copyText(order.orderNumber, 'order')} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-boutique-brown shadow-sm hover:bg-boutique-bg"><Copy className="h-3.5 w-3.5" /> {copied === 'order' ? 'Copied' : 'Copy'}</button>
                  </div>
                  <p className="mt-3 text-sm text-boutique-brown-light">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:w-[360px]">
                  <div className="rounded-2xl border border-boutique-brown/10 bg-white px-5 py-4 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-wider text-boutique-brown/60">Shipment</p><p className="mt-1 text-xl font-bold text-boutique-brown">{order.shipmentStatusLabel}</p></div>
                  <div className="rounded-2xl border border-boutique-brown/10 bg-white px-5 py-4 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-wider text-boutique-brown/60">Payment</p><div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : order.paymentStatus === 'refunded' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'}`}>{order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'refunded' ? 'Refunded' : 'Awaiting payment'}</div></div>
                </div>
              </div>
            </div>

            <div className="relative px-6 py-7 md:px-8">
              {order.orderStatus === 'cancelled' ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">This order has been cancelled.</div> : (
                <div className="grid gap-3 md:grid-cols-6">
                  {STATUS_STEPS.map((step) => {
                    const Icon = step.icon;
                    const complete = activeRank >= (statusRank[step.key] || 0);
                    return <div key={step.key} className="min-w-0"><div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${complete ? 'bg-green-100 text-green-800' : 'bg-[#fffaf3] text-boutique-brown/35'}`}><Icon className="h-5 w-5" /></div><div className={`h-1 rounded-full ${complete ? 'bg-green-300' : 'bg-boutique-brown/10'}`} /><p className={`mt-3 text-[11px] font-bold uppercase leading-snug ${complete ? 'text-green-800' : 'text-boutique-brown/40'}`}>{step.label}</p></div>;
                  })}
                </div>
              )}

              <div className="mt-7 grid gap-4 md:grid-cols-4">
                <InfoCard icon={Truck} title="Carrier" content={<><p className="font-semibold text-boutique-brown">{order.carrier || 'Preparing carrier'}</p><p className="mt-1 text-sm text-boutique-brown-light">{order.shippingMethod || 'Shipping method pending'}</p>{order.shippingService && <p className="mt-1 text-xs text-boutique-brown-light">{order.shippingService}</p>}</>} />
                <InfoCard icon={PackageCheck} title="Tracking number" content={<><div className="flex items-center gap-2"><p className="font-bold text-boutique-brown break-all">{order.trackingNumber || 'Awaiting shipment'}</p>{order.trackingNumber && <button onClick={() => copyText(order.trackingNumber || '', 'tracking')} className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-boutique-brown shadow-sm">{copied === 'tracking' ? 'Copied' : 'Copy'}</button>}</div>{order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-full bg-boutique-brown px-3 py-2 text-xs font-bold text-white hover:bg-boutique-wood">Official tracking <ExternalLink className="h-3.5 w-3.5" /></a>}</>} />
                <InfoCard icon={Clock3} title="Estimated delivery" content={<><p className="font-semibold text-boutique-brown">{order.estimatedDelivery || 'To be confirmed'}</p><p className="mt-1 text-sm text-boutique-brown-light">Last updated: {formatDate(order.lastUpdated)}</p></>} />
                <InfoCard icon={CreditCard} title="Order summary" content={<><p className="font-semibold text-boutique-brown">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p><p className="text-sm text-boutique-brown-light">Total: ${order.totalAmount.toFixed(2)}</p></>} />
              </div>

              <div className="mt-7 grid gap-6 lg:grid-cols-[360px_1fr]">
                <div className="rounded-[1.7rem] border border-boutique-brown/10 bg-[#fffaf3] p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-boutique-brown/60">Tracking provider</p><h3 className="mt-2 font-serif text-2xl text-boutique-brown">{order.trackingProviderType === 'external_link' ? `${order.carrier} Official Tracking` : order.trackingProviderType === 'api' ? 'Carrier API Ready' : 'Manual Tracking'}</h3><p className="mt-3 text-sm leading-relaxed text-boutique-brown-light">{order.customerNote || order.liveTracking?.message}</p>{order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white hover:bg-boutique-wood">Track on {order.carrier}<ExternalLink className="h-4 w-4" /></a>}</div>
                <div className="rounded-[1.7rem] border border-boutique-brown/10 bg-white p-6 shadow-sm"><h3 className="font-serif text-2xl text-boutique-brown">Shipment Timeline</h3><div className="relative mt-6 space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-boutique-brown/10">{timelineEvents.map((event, index) => <div key={`${event.timestamp}-${index}`} className="relative flex gap-5"><div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full ${index === 0 ? 'bg-boutique-brown text-white' : 'border border-boutique-brown/10 bg-[#fffaf3] text-boutique-brown/45'}`}>{statusIcon(event.status, index === 0)}</div><div className="min-w-0 flex-1 pt-1"><div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between"><div><p className="text-sm font-bold uppercase tracking-wider text-boutique-brown">{getShipmentStatusLabel(event.status)}</p><p className="mt-2 text-sm leading-relaxed text-boutique-brown-light">{event.description}</p></div><span className="shrink-0 text-xs text-boutique-brown/45">{formatDate(event.timestamp)}</span></div>{event.location && <div className="mt-2 flex items-center gap-2 text-boutique-brown/40"><MapPin className="h-3 w-3" /><span className="text-xs uppercase">{event.location}</span></div>}</div></div>)}</div></div>
              </div>

              <div className="mt-8">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-wider text-boutique-brown-light"><Gift className="h-4 w-4" /> Items in your order</div>
                <div className="space-y-4">{order.items.map((item, index) => <div key={`${item.productName}-${index}`} className="relative overflow-hidden rounded-[1.9rem] border border-boutique-brown/10 bg-white p-5 shadow-sm"><img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute right-4 top-3 w-24 opacity-20 mix-blend-multiply" alt="" /><div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="font-serif text-2xl font-medium text-boutique-brown">{item.productName}</p><p className="mt-1 text-sm text-boutique-brown-light">Qty {item.quantity} × ${item.price.toFixed(2)}</p></div><div className="rounded-2xl bg-[#fffaf3] px-4 py-3 text-right"><p className="text-[11px] font-bold uppercase tracking-wider text-boutique-brown/60">Line Total</p><p className="mt-1 text-xl font-bold text-boutique-brown">${(item.quantity * item.price).toFixed(2)}</p></div></div>{Object.keys(item.personalizationData).length > 0 && <div className="mt-4 rounded-2xl border border-boutique-brown/10 bg-boutique-bg/75 p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-boutique-brown/60">Personalization Details</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(item.personalizationData).map(([key, value]) => <div key={key} className="rounded-xl bg-white/80 px-3 py-2 text-xs text-boutique-brown-light"><span className="font-bold text-boutique-brown">{key}: </span>{String(value)}</div>)}</div></div>}</div>)}</div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function InfoCard({ icon: Icon, title, content }: { icon: React.ComponentType<{ className?: string }>; title: string; content: React.ReactNode }) {
  return <div className="rounded-[1.7rem] border border-boutique-brown/10 bg-[#fffaf3] p-5 shadow-sm"><div className="mb-3 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-boutique-brown shadow-sm"><Icon className="h-4 w-4" /></div><h3 className="text-xs font-bold uppercase tracking-wider text-boutique-brown/60">{title}</h3></div><div>{content}</div></div>;
}
