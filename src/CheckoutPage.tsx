import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, ShoppingBag } from 'lucide-react';
import { useStore } from './store/useStore';

export default function CheckoutPage() {
  const { cartItems } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPayPalSubmitting, setIsPayPalSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cartItems]);
  const shipping = subtotal > 0 ? 6.95 : 0;
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

    return true;
  };

  const checkoutPayload = {
    customer: { name: customerName, email, address, city, state, zip },
    items: cartItems.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      personalizationData: item.personalizationData,
    })),
    subtotal,
    shipping,
    total,
    currency: 'USD',
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateCheckout()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkout/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Checkout could not be created.');
      if (!data.checkoutUrl) throw new Error('Checkout URL was not returned.');
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
      setIsSubmitting(false);
    }
  };

  const handlePayPalCheckout = async () => {
    if (!validateCheckout()) return;

    setIsPayPalSubmitting(true);

    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'PayPal checkout could not be created.');
      if (!data.approvalUrl) throw new Error('PayPal approval URL was not returned.');
      window.location.href = data.approvalUrl;
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
      setIsPayPalSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-boutique-bg font-sans text-boutique-brown relative overflow-x-clip">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-pattern bg-[length:400px_400px]"></div>

      <header className="relative z-20 flex items-center justify-between border-b border-boutique-brown/10 bg-boutique-bg/80 px-6 py-5 backdrop-blur-md md:px-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light hover:text-boutique-brown"><ArrowLeft className="h-4 w-4" /> Back to shop</Link>
        <Link to="/" className="font-serif text-3xl text-boutique-brown">Little Wonders</Link>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-boutique-brown-light"><Lock className="h-4 w-4" /> Secure checkout</div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[58%_42%] md:py-14">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-boutique-brown/10 bg-white/75 p-6 shadow-sm md:p-8">
          <div><h1 className="font-serif text-4xl text-boutique-brown">Checkout</h1><p className="mt-2 text-sm text-boutique-brown-light">Enter your shipping details to continue to secure payment.</p></div>
          <section className="space-y-4"><h2 className="text-sm font-bold uppercase tracking-wider text-boutique-brown">Contact</h2><div className="grid gap-4 md:grid-cols-2"><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="Full name" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="Email address" /></div></section>
          <section className="space-y-4"><h2 className="text-sm font-bold uppercase tracking-wider text-boutique-brown">Shipping address</h2><input value={address} onChange={(event) => setAddress(event.target.value)} className="w-full rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="Street address" /><div className="grid gap-4 md:grid-cols-3"><input value={city} onChange={(event) => setCity(event.target.value)} className="rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="City" /><input value={state} onChange={(event) => setState(event.target.value)} className="rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="State" /><input value={zip} onChange={(event) => setZip(event.target.value)} className="rounded-2xl border border-boutique-brown/15 bg-boutique-bg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boutique-wood/40" placeholder="ZIP code" /></div></section>
          <div className="rounded-2xl border border-boutique-brown/10 bg-[#fffaf3] p-4 text-xs text-boutique-brown-light">
            Card payments, Apple Pay, Google Pay, and Link are handled by Stripe when available. PayPal is available as a secondary checkout option.
          </div>
          <button disabled={isSubmitting || isPayPalSubmitting || cartItems.length === 0} className="w-full rounded-full bg-boutique-brown px-6 py-4 text-base font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Opening secure payment...' : 'Continue to Secure Payment'}</button>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-boutique-brown/45"><span className="h-px flex-1 bg-boutique-brown/10"></span>or<span className="h-px flex-1 bg-boutique-brown/10"></span></div>
          <button type="button" onClick={handlePayPalCheckout} disabled={isSubmitting || isPayPalSubmitting || cartItems.length === 0} className="w-full rounded-full border border-[#003087]/20 bg-[#ffc439] px-6 py-4 text-base font-black text-[#003087] shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#f7b820] disabled:cursor-not-allowed disabled:opacity-50">{isPayPalSubmitting ? 'Opening PayPal...' : 'Pay with PayPal'}</button>
        </form>

        <aside className="rounded-[2rem] border border-boutique-brown/10 bg-white/75 p-6 shadow-sm md:p-8 h-fit">
          <div className="mb-6 flex items-center gap-2"><ShoppingBag className="h-5 w-5" /><h2 className="font-serif text-2xl text-boutique-brown">Order Summary</h2></div>
          {cartItems.length === 0 ? <div className="rounded-2xl bg-boutique-bg p-6 text-center text-sm text-boutique-brown-light">Your gift bag is empty.</div> : <div className="space-y-4">{cartItems.map((item) => <div key={item.id} className="flex gap-4 rounded-2xl bg-boutique-bg p-3"><div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white">{item.product.bgImage && <img src={item.product.bgImage} className="absolute inset-0 h-full w-full object-cover opacity-70" alt="" />}<img src={item.product.imageUrl} className="relative z-10 h-full w-full object-contain p-2" alt="" /></div><div className="min-w-0 flex-1"><p className="font-serif text-sm font-medium text-boutique-brown">{item.product.name}</p><p className="mt-1 text-xs text-boutique-brown-light">Qty {item.quantity}</p>{Object.keys(item.personalizationData).length > 0 && <p className="mt-1 truncate text-[11px] text-boutique-brown-light">Personalized</p>}</div><p className="text-sm font-bold text-boutique-brown">${(item.product.price * item.quantity).toFixed(2)}</p></div>)}</div>}
          <div className="mt-6 space-y-3 border-t border-boutique-brown/10 pt-5 text-sm"><div className="flex justify-between text-boutique-brown-light"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div><div className="flex justify-between text-boutique-brown-light"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div><div className="flex justify-between pt-3 font-serif text-xl text-boutique-brown"><span>Total</span><span>${total.toFixed(2)}</span></div></div>
        </aside>
      </main>
    </div>
  );
}
