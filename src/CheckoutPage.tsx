import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, Lock, ShieldCheck, ShoppingBag, Truck, WalletCards, Zap } from 'lucide-react';
import { useStore } from './store/useStore';
import { CardDesignFrame } from './components/CardDesignFrame';
import { BrandLogo } from './components/BrandLogo';

type PaymentMethod = 'stripe' | 'paypal';
type ShippingMethod = {
  id: string;
  label: string;
  description: string;
  carrier: string;
  service: string;
  estimatedDelivery: string;
  amount: number;
};

const SHIPPING_METHODS: ShippingMethod[] = [
  { id: 'us-standard', label: 'Standard Shipping', description: 'Reliable gift-ready delivery for most US addresses.', carrier: 'USPS', service: 'Ground Advantage', estimatedDelivery: '3-5 business days', amount: 6.95 },
  { id: 'us-priority', label: 'Priority Shipping', description: 'Faster delivery for time-sensitive gifts.', carrier: 'USPS', service: 'Priority Mail', estimatedDelivery: '2-3 business days', amount: 12.95 },
];

const WalletBadge = ({ label, tone = 'light' }: { label: string; tone?: 'dark' | 'light' | 'blue' }) => {
  const toneClass = tone === 'dark'
    ? 'bg-neutral-950 text-white border-neutral-950'
    : tone === 'blue'
      ? 'bg-[#f2f7ff] text-[#1434cb] border-[#d7e5ff]'
      : 'bg-white text-boutique-brown border-boutique-brown/10';

  return <span className={`inline-flex h-9 items-center rounded-xl border px-3 text-[11px] font-black tracking-tight shadow-sm ${toneClass}`}>{label}</span>;
};

export default function CheckoutPage() {
  const { cartItems } = useStore();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('stripe');
  const [selectedShippingId, setSelectedShippingId] = useState('us-standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const selectedShippingMethod = SHIPPING_METHODS.find((method) => method.id === selectedShippingId) || SHIPPING_METHODS[0];
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cartItems]);
  const shipping = subtotal > 0 ? selectedShippingMethod.amount : 0;
  const total = subtotal + shipping;

  const validateCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your gift bag is empty.');
      return false;
    }

    if (!customerName.trim() || !email.trim() || !address.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      alert('Please fill in all checkout fields.');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      alert('Please enter a valid email address.');
      return false;
    }

    if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
      alert('Please enter a valid US ZIP code.');
      return false;
    }

    return true;
  };

  const checkoutPayload = {
    customer: {
      name: customerName.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zip: zip.trim(),
    },
    items: cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      personalizationData: item.personalizationData,
    })),
    shippingMethodId: selectedShippingMethod.id,
    currency: 'USD',
  };

  const readJsonResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(text.includes('<!doctype') || text.includes('<html') ? 'Payment endpoint returned a website page instead of JSON. Please redeploy and try again.' : text);
    }

    return response.json();
  };

  const handleStripeCheckout = async () => {
    const response = await fetch('/api/checkout/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload),
    });

    const data = await readJsonResponse(response);
    if (!response.ok) throw new Error(data.details || data.error || 'Checkout could not be created.');
    if (!data.checkoutUrl) throw new Error('Checkout URL was not returned.');
    window.location.href = data.checkoutUrl;
  };

  const handlePayPalCheckout = async () => {
    const response = await fetch('/api/paypal-create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload),
    });

    const data = await readJsonResponse(response);
    if (!response.ok) throw new Error(data.details || data.error || 'PayPal checkout could not be created.');
    if (!data.approvalUrl) throw new Error('PayPal approval URL was not returned.');
    window.location.href = data.approvalUrl;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateCheckout()) return;

    setIsSubmitting(true);

    try {
      if (selectedPaymentMethod === 'paypal') {
        await handlePayPalCheckout();
      } else {
        await handleStripeCheckout();
      }
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
      setIsSubmitting(false);
    }
  };

  const buttonLabel = isSubmitting
    ? selectedPaymentMethod === 'paypal'
      ? 'Opening PayPal...'
      : 'Opening secure payment...'
    : selectedPaymentMethod === 'paypal'
      ? 'Continue with PayPal'
      : 'Continue to Secure Payment';

  return (
    <div className="min-h-screen bg-boutique-bg font-sans text-boutique-brown relative overflow-x-clip">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-pattern bg-[length:400px_400px]"></div>

      <header className="relative z-20 flex min-h-[74px] items-center justify-between border-b border-boutique-brown/10 bg-boutique-bg/80 px-4 py-3 backdrop-blur-md sm:px-6 md:min-h-[86px] md:px-12">
        <Link to="/" className="relative z-20 inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light hover:text-boutique-brown"><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to shop</span></Link>
        <Link to="/" className="group/logo absolute left-1/2 top-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center" aria-label="MY BABY SHIRE home">
          <BrandLogo variant="nav" />
        </Link>
        <div className="relative z-20 hidden items-center gap-2 text-xs font-bold uppercase tracking-wider text-boutique-brown-light sm:flex"><Lock className="h-4 w-4" /> Secure checkout</div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[58%_42%] md:py-14">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-boutique-brown/10 bg-white/75 p-6 shadow-sm md:p-8">
          <div>
            <h1 className="font-serif text-4xl text-boutique-brown">Checkout</h1>
            <p className="mt-2 text-sm text-boutique-brown-light">Enter your shipping details and choose your preferred payment method.</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-boutique-brown">Contact</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="Full name" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="Email address" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-boutique-brown">Shipping address</h2>
            <input value={address} onChange={(event) => setAddress(event.target.value)} className="w-full rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="Street address" />
            <div className="grid gap-4 md:grid-cols-3">
              <input value={city} onChange={(event) => setCity(event.target.value)} className="rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="City" />
              <input value={state} onChange={(event) => setState(event.target.value)} className="rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="State" />
              <input value={zip} onChange={(event) => setZip(event.target.value)} className="rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="ZIP code" />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-boutique-brown">Shipping method</h2>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4df] px-3 py-1 text-[11px] font-bold text-boutique-brown"><Truck className="h-3.5 w-3.5" /> USA delivery</div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {SHIPPING_METHODS.map((method) => {
                const active = selectedShippingId === method.id;
                return (
                  <button key={method.id} type="button" onClick={() => setSelectedShippingId(method.id)} className={`rounded-[1.35rem] border p-4 text-left transition-all ${active ? 'border-boutique-brown bg-[#fffaf3] shadow-sm ring-2 ring-boutique-brown/10' : 'border-boutique-brown/10 bg-white/80 hover:bg-[#fffaf3]'}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-boutique-brown">{method.label}</p><p className="mt-1 text-xs text-boutique-brown-light">{method.carrier} · {method.service}</p></div><span className="font-bold text-boutique-brown">${method.amount.toFixed(2)}</span></div>
                    <p className="mt-3 text-xs leading-relaxed text-boutique-brown-light">{method.description}</p>
                    <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold text-boutique-brown-light shadow-sm">{method.estimatedDelivery}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-boutique-brown">Payment method</h2>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold text-green-800"><ShieldCheck className="h-3.5 w-3.5" /> Secure</div>
            </div>

            <div className="grid gap-3">
              <button type="button" onClick={() => setSelectedPaymentMethod('stripe')} className={`group relative overflow-hidden rounded-[1.55rem] border p-4 text-left transition-all ${selectedPaymentMethod === 'stripe' ? 'border-boutique-brown bg-[#fffaf3] shadow-sm ring-2 ring-boutique-brown/10' : 'border-boutique-brown/10 bg-white/80 hover:border-boutique-brown/25'}`}>
                <div className="absolute right-4 top-4 rounded-full border border-[#635bff]/15 bg-white px-3 py-1 text-[11px] font-black text-[#635bff] shadow-sm">stripe</div>
                <div className="flex items-start gap-4 pr-16">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selectedPaymentMethod === 'stripe' ? 'bg-boutique-brown text-white' : 'bg-boutique-bg text-boutique-brown'}`}><CreditCard className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-boutique-brown">Card & digital wallets</p><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-boutique-brown-light shadow-sm">Primary</span></div>
                    <p className="mt-1 text-sm leading-relaxed text-boutique-brown-light">Secure hosted checkout. Apple Pay, Google Pay, and Link appear automatically when the customer device and browser support them.</p>
                    <div className="mt-3 flex flex-wrap gap-2"><WalletBadge label="VISA" tone="blue" /><WalletBadge label="mastercard" /><WalletBadge label=" Pay" tone="dark" /><WalletBadge label="G Pay" /><WalletBadge label="Link" tone="blue" /></div>
                    <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-xs text-boutique-brown-light shadow-sm"><Zap className="h-3.5 w-3.5 text-boutique-brown" /> Demo wallet badges shown here; real wallet buttons are rendered inside Stripe Checkout when available.</div>
                  </div>
                  {selectedPaymentMethod === 'stripe' && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-700" />}
                </div>
              </button>

              <button type="button" onClick={() => setSelectedPaymentMethod('paypal')} className={`group relative overflow-hidden rounded-[1.55rem] border p-4 text-left transition-all ${selectedPaymentMethod === 'paypal' ? 'border-[#003087] bg-[#fff8df] shadow-sm ring-2 ring-[#003087]/10' : 'border-boutique-brown/10 bg-white/80 hover:border-[#003087]/30'}`}>
                <div className="absolute right-4 top-4 rounded-full bg-[#003087] px-3 py-1 text-[11px] font-black text-white shadow-sm">PayPal</div>
                <div className="flex items-start gap-4 pr-20">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selectedPaymentMethod === 'paypal' ? 'bg-[#ffc439] text-[#003087]' : 'bg-boutique-bg text-boutique-brown'}`}><WalletCards className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-boutique-brown">PayPal protected checkout</p><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-boutique-brown-light shadow-sm">Secondary</span></div><p className="mt-1 text-sm leading-relaxed text-boutique-brown-light">Customers can sign in to PayPal and complete payment on PayPal’s secure hosted page.</p><div className="mt-3 flex flex-wrap gap-2"><WalletBadge label="PayPal" tone="blue" /><WalletBadge label="Buyer protection" /><WalletBadge label="Hosted checkout" /></div></div>
                  {selectedPaymentMethod === 'paypal' && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-700" />}
                </div>
              </button>
            </div>

            <div className="rounded-[1.35rem] border border-boutique-brown/10 bg-white/80 p-4 shadow-sm"><div className="flex items-start gap-3"><div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-sm font-bold text-boutique-brown">Selected: {selectedPaymentMethod === 'paypal' ? 'PayPal' : 'Stripe card & wallets'}</p><p className="mt-1 text-xs leading-relaxed text-boutique-brown-light">MY BABY SHIRE never stores card numbers, wallet credentials, or PayPal login details. Payment is completed on the selected provider’s secure checkout.</p></div></div></div>
          </section>

          <button disabled={isSubmitting || cartItems.length === 0} className={`w-full rounded-full px-6 py-4 text-base font-bold shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${selectedPaymentMethod === 'paypal' ? 'bg-[#ffc439] text-[#003087] hover:bg-[#f7b820]' : 'bg-boutique-brown text-white hover:bg-boutique-wood'}`}>{buttonLabel}</button>
        </form>

        <aside className="rounded-[2rem] border border-boutique-brown/10 bg-white/75 p-6 shadow-sm md:p-8 h-fit">
          <div className="mb-6 flex items-center gap-2"><ShoppingBag className="h-5 w-5" /><h2 className="font-serif text-2xl text-boutique-brown">Order Summary</h2></div>
          {cartItems.length === 0 ? <div className="rounded-2xl bg-boutique-bg p-6 text-center text-sm text-boutique-brown-light">Your gift bag is empty.</div> : <div className="space-y-4">{cartItems.map((item) => <div key={item.id} className="flex gap-4 rounded-2xl bg-boutique-bg p-3"><div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white">{item.product.bgImage && <CardDesignFrame value={item.product.bgImage} className="absolute inset-0 h-full w-full opacity-70" legacyClassName="absolute inset-0 h-full w-full object-cover opacity-70" />}<img src={item.product.imageUrl} className="relative z-10 h-full w-full object-contain p-2" alt="" /></div><div className="min-w-0 flex-1"><p className="font-serif text-sm font-medium text-boutique-brown">{item.product.name}</p><p className="mt-1 text-xs text-boutique-brown-light">Qty {item.quantity}</p>{Object.keys(item.personalizationData).length > 0 && <p className="mt-1 truncate text-[11px] text-boutique-brown-light">Personalized</p>}</div><p className="text-sm font-bold text-boutique-brown">${(item.product.price * item.quantity).toFixed(2)}</p></div>)}</div>}
          <div className="mt-6 space-y-3 border-t border-boutique-brown/10 pt-5 text-sm"><div className="flex justify-between text-boutique-brown-light"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div><div className="flex justify-between text-boutique-brown-light"><span>{selectedShippingMethod.label}</span><span>${shipping.toFixed(2)}</span></div><div className="flex justify-between text-xs text-boutique-brown-light"><span>{selectedShippingMethod.carrier} · {selectedShippingMethod.service}</span><span>{selectedShippingMethod.estimatedDelivery}</span></div><div className="flex justify-between pt-3 font-serif text-xl text-boutique-brown"><span>Total</span><span>${total.toFixed(2)}</span></div></div>
        </aside>
      </main>
    </div>
  );
}
